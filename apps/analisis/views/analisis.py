"""
Vistas para el análisis nutricional con IA
"""
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import Q, Count, Avg
from django.utils import timezone
from django.conf import settings
import json
import os
import base64
import io
from PIL import Image
from apps.analisis.forms.EmailForm import EnviarAnalisisEmailForm
from apps.analisis.services.EmailServices import EmailService
from apps.analisis.models import AnalisisNutricional
from apps.analisis.services.api import AnalisisNutricionalService
from apps.analisis.forms.AnalisisForm import AnalisisNutricionalForm


@login_required
def lista_analisis(request):
    """Vista para listar todos los análisis nutricionales"""
    # Filtros
    busqueda = request.GET.get('buscar', '')
    estado_filtro = request.GET.get('estado', '')
    severidad_filtro = request.GET.get('severidad', '')
    
    # Query base
    analisis = AnalisisNutricional.objects.filter(activo=True)
    
    # Aplicar filtros
    if busqueda:
        analisis = analisis.filter(
            Q(nombre_paciente__icontains=busqueda) |
            Q(observaciones_adicionales__icontains=busqueda)
        )
    
    if estado_filtro:
        analisis = analisis.filter(estado_nutricional=estado_filtro)
    
    if severidad_filtro:
        analisis = analisis.filter(severidad=severidad_filtro)
    
    # Estadísticas generales
    estadisticas = {
        'total': analisis.count(),
        'malnutridos': analisis.filter(estado_nutricional=0).count(),
        'sobrenutridos': analisis.filter(estado_nutricional=1).count(),
        'confianza_promedio': analisis.aggregate(Avg('confianza'))['confianza__avg'] or 0,
        'analisis_mes': analisis.filter(
            fecha_analisis__month=timezone.now().month
        ).count()
    }
    
    # Paginación
    paginator = Paginator(analisis, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'estadisticas': estadisticas,
        'busqueda': busqueda,
        'estado_filtro': estado_filtro,
        'severidad_filtro': severidad_filtro,
        'estados_choices': AnalisisNutricional.ESTADO_CHOICES,
        'severidad_choices': AnalisisNutricional.SEVERIDAD_CHOICES,
    }
    
    return render(request, 'analisis/analisis_list.html', context)


@login_required
def detalle_analisis(request, analisis_id):
    """Vista para mostrar el detalle de un análisis"""
    analisis = get_object_or_404(AnalisisNutricional, id=analisis_id, activo=True)
    
    context = {
        'analisis': analisis,
        'puede_editar': request.user == analisis.procesado_por or request.user.is_staff,
    }
    
    return render(request, 'analisis/detalle_analisis.html', context)


@login_required
def nuevo_analisis(request):
    """Vista para crear un nuevo análisis nutricional"""
    if request.method == 'POST':
        form = AnalisisNutricionalForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                # Guardar análisis en estado "Procesando"
                analisis = form.save(commit=False)
                analisis.procesado_por = request.user
                analisis.estado_nutricional = 999  # Estado "Procesando"
                analisis.confianza = 0.0
                analisis.procesamiento_completado = False
                analisis.save()
                
                # Procesar la imagen con IA en segundo plano
                try:
                    servicio = AnalisisNutricionalService()
                    resultado = servicio.procesar_imagen(analisis.imagen.path)
                    
                    if resultado['exito']:
                        # Actualizar el análisis con los resultados de la IA
                        mejor_prediccion = resultado['mejor_prediccion']
                        
                        analisis.estado_nutricional = mejor_prediccion['class']
                        analisis.confianza = mejor_prediccion['confidence']
                        analisis.severidad = servicio.determinar_severidad(
                            mejor_prediccion['confidence'], 
                            mejor_prediccion['class']
                        )
                        
                        # Generar recomendaciones con IA
                        analisis.procesamiento_completado = True
                        analisis.recomendaciones_nutricionales = analisis._generar_recomendaciones()
                        
                        # Generar recomendaciones adicionales con IA si está disponible
                        try:
                            recomendaciones_ia = servicio.generar_recomendaciones_ia(
                                analisis.estado_nutricional,
                                analisis.severidad,
                                analisis.edad_meses
                            )
                            if recomendaciones_ia:
                                analisis.recomendaciones_nutricionales = recomendaciones_ia
                        except Exception as e:
                            print(f"Error generando recomendaciones IA: {e}")
                            # Usar recomendaciones por defecto
                            analisis.recomendaciones_nutricionales = analisis._generar_recomendaciones()
                        
                        analisis.marcar_procesamiento_completado()
                        
                        messages.success(
                            request, 
                            f'✅ Análisis procesado exitosamente. Detección: {analisis.get_estado_nutricional_display()} '
                            f'con {analisis.confianza_porcentaje} de confianza.'
                        )
                        
                        return redirect('analisis:detalle', analisis_id=analisis.id)
                    else:
                        # Si falla la IA, marcar error pero permitir edición manual
                        analisis.marcar_error_procesamiento(resultado.get('error', 'Error desconocido'))
                        
                        messages.warning(
                            request, 
                            f'⚠️ Error en el procesamiento automático: {resultado.get("error", "Error desconocido")}. '
                            'El análisis se guardó y puede completarse manualmente.'
                        )
                        return redirect('analisis:editar', analisis_id=analisis.id)
                        
                except Exception as e:
                    # Error en el servicio de IA
                    error_msg = f'Error al procesar la imagen: {str(e)}'
                    analisis.marcar_error_procesamiento(error_msg)
                    
                    messages.error(
                        request, 
                        f'❌ {error_msg}. El análisis se guardó y puede completarse manualmente.'
                    )
                    return redirect('analisis:editar', analisis_id=analisis.id)
                    
            except Exception as e:
                # Error al guardar en base de datos
                messages.error(
                    request, 
                    f'❌ Error al guardar el análisis: {str(e)}. Por favor, inténtalo de nuevo.'
                )
                return render(request, 'analisis/form_analisis.html', {
                    'form': form,
                    'title': 'Nuevo Análisis Nutricional'
                })
    else:
        form = AnalisisNutricionalForm()
    
    context = {
        'form': form,
        'title': 'Nuevo Análisis Nutricional'
    }
    
    return render(request, 'analisis/form_analisis.html', context)


@login_required
def editar_analisis(request, analisis_id):
    """Vista para editar un análisis existente"""
    analisis = get_object_or_404(AnalisisNutricional, id=analisis_id)
    
    # Verificar permisos
    if not (request.user == analisis.procesado_por or request.user.is_staff):
        messages.error(request, 'No tienes permisos para editar este análisis.')
        return redirect('analisis:detalle', analisis_id=analisis.id)
    
    if request.method == 'POST':
        form = AnalisisNutricionalForm(request.POST, request.FILES, instance=analisis)
        if form.is_valid():
            form.save()
            messages.success(request, 'Análisis actualizado exitosamente.')
            return redirect('analisis:detalle', analisis_id=analisis.id)
    else:
        form = AnalisisNutricionalForm(instance=analisis)
    
    context = {
        'form': form,
        'analisis': analisis,
        'title': 'Editar Análisis Nutricional'
    }
    
    return render(request, 'analisis/analisis_edit.html', context)


@login_required
def eliminar_analisis(request, analisis_id):
    """Vista para eliminar (desactivar) un análisis"""
    analisis = get_object_or_404(AnalisisNutricional, id=analisis_id)
    
    # Verificar permisos
    if not (request.user == analisis.procesado_por or request.user.is_staff):
        messages.error(request, 'No tienes permisos para eliminar este análisis.')
        return redirect('analisis:detalle', analisis_id=analisis.id)
    
    if request.method == 'POST':
        analisis.activo = False
        analisis.save()
        messages.success(request, 'Análisis eliminado exitosamente.')
        return redirect('analisis:lista')
    
    context = {
        'analisis': analisis
    }
    
    return render(request, 'analisis/confirmar_eliminacion.html', context)


@csrf_exempt
@require_http_methods(["POST"])
def procesar_imagen_ajax(request):
    """Vista AJAX para procesar una imagen sin guardar en BD"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'No autenticado'}, status=401)
    
    try:
        if 'imagen' not in request.FILES:
            return JsonResponse({'error': 'No se proporcionó imagen'}, status=400)
        
        imagen = request.FILES['imagen']
        
        # Guardar temporalmente la imagen
        temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', f'temp_{request.user.id}_{imagen.name}')
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        
        with open(temp_path, 'wb+') as destination:
            for chunk in imagen.chunks():
                destination.write(chunk)
        
        # Procesar con IA
        servicio = AnalisisNutricionalService()
        resultado = servicio.procesar_imagen(temp_path)
        
        # Limpiar archivo temporal
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if resultado['exito']:
            mejor_prediccion = resultado['mejor_prediccion']
            return JsonResponse({
                'exito': True,
                'estado_nutricional': mejor_prediccion['class'],
                'estado_nombre': servicio.class_names.get(mejor_prediccion['class']),
                'confianza': mejor_prediccion['confidence'],
                'confianza_porcentaje': f"{mejor_prediccion['confidence'] * 100:.1f}%",
                'total_detecciones': resultado['total_detecciones'],
                'estadisticas': resultado['estadisticas'],
                'imagen_procesada': resultado['imagen_procesada']
            })
        else:
            return JsonResponse({
                'exito': False,
                'error': resultado['error']
            })
            
    except Exception as e:
        return JsonResponse({
            'exito': False,
            'error': f'Error interno: {str(e)}'
        }, status=500)


@login_required
def dashboard_estadisticas(request):
    """Vista del dashboard con estadísticas generales"""
    # Estadísticas generales
    analisis = AnalisisNutricional.objects.filter(activo=True)
    
    estadisticas = {
        'total_analisis': analisis.count(),
        'malnutridos': analisis.filter(estado_nutricional=0).count(),
        'sobrenutridos': analisis.filter(estado_nutricional=1).count(),
        'normales': analisis.filter(estado_nutricional=2).count(),
        'confianza_promedio': analisis.aggregate(Avg('confianza'))['confianza__avg'] or 0,
        'analisis_ultima_semana': analisis.filter(
            fecha_analisis__gte=timezone.now() - timezone.timedelta(days=7)
        ).count(),
    }
    
    # Análisis por severidad
    severidad_stats = {}
    for severidad_code, severidad_name in AnalisisNutricional.SEVERIDAD_CHOICES:
        severidad_stats[severidad_name] = analisis.filter(severidad=severidad_code).count()
    
    # Análisis recientes
    analisis_recientes = analisis.order_by('-fecha_analisis')[:5]
    
    # Datos para gráficos (últimos 30 días)
    fecha_inicio = timezone.now() - timezone.timedelta(days=30)
    analisis_periodo = analisis.filter(fecha_analisis__gte=fecha_inicio)
    
    # Agrupar por día
    analisis_por_dia = []
    for i in range(30):
        fecha = fecha_inicio + timezone.timedelta(days=i)
        count = analisis_periodo.filter(
            fecha_analisis__date=fecha.date()
        ).count()
        analisis_por_dia.append({
            'fecha': fecha.strftime('%Y-%m-%d'),
            'cantidad': count
        })
    
    context = {
        'estadisticas': estadisticas,
        'severidad_stats': severidad_stats,
        'analisis_recientes': analisis_recientes,
        'analisis_por_dia': json.dumps(analisis_por_dia),
    }
    
    return render(request, 'analisis/dashboard.html', context)


@login_required
def exportar_reporte(request):
    """Vista para exportar reporte de análisis en CSV"""
    import csv
    from django.http import HttpResponse
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="reporte_analisis_nutricional.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'ID', 'Nombre Paciente', 'Edad (meses)', 'Género', 
        'Estado Nutricional', 'Confianza', 'Severidad', 
        'Fecha Análisis', 'Procesado Por'
    ])
    
    analisis = AnalisisNutricional.objects.filter(activo=True).order_by('-fecha_analisis')
    
    for a in analisis:
        writer.writerow([
            str(a.id),
            a.nombre_paciente,
            a.edad_meses,
            a.get_genero_display(),
            a.get_estado_nutricional_display(),
            f'{a.confianza:.2f}',
            a.get_severidad_display() if a.severidad else '',
            a.fecha_analisis.strftime('%d/%m/%Y %H:%M'),
            a.procesado_por.username if a.procesado_por else ''
        ])
    
    return response

@login_required
def enviar_analisis_email(request, analisis_id):
    """Vista para enviar análisis por email"""
    analisis = get_object_or_404(AnalisisNutricional, id=analisis_id, activo=True)
    
    # Verificar permisos
    if not (request.user == analisis.procesado_por or request.user.is_staff):
        messages.error(request, 'No tienes permisos para enviar este análisis.')
        return redirect('analisis:detalle', analisis_id=analisis.id)
    
    if request.method == 'POST':
        form = EnviarAnalisisEmailForm(request.POST)
        if form.is_valid():
            try:
                # Obtener datos del formulario
                destinatario = form.cleaned_data['destinatario']
                asunto = form.cleaned_data.get('asunto')
                mensaje_personalizado = form.cleaned_data.get('mensaje_personalizado')
                incluir_imagen = form.cleaned_data.get('incluir_imagen', True)
                incluir_recomendaciones = form.cleaned_data.get('incluir_recomendaciones', True)
                
                # Enviar email usando el servicio
                resultado = EmailService.enviar_analisis(
                    analisis=analisis,
                    destinatario=destinatario,
                    asunto=asunto,
                    mensaje_personalizado=mensaje_personalizado,
                    incluir_imagen=incluir_imagen,
                    incluir_recomendaciones=incluir_recomendaciones
                )
                
                if resultado['exito']:
                    messages.success(request, f'✅ {resultado["mensaje"]}')
                    return redirect('analisis:detalle', analisis_id=analisis.id)
                else:
                    messages.error(request, f'❌ {resultado["mensaje"]}')
                    
            except Exception as e:
                messages.error(request, f'❌ Error inesperado: {str(e)}')
    else:
        # Prellenar formulario con datos por defecto
        initial_data = {
            'asunto': f'Análisis Nutricional - {analisis.nombre_paciente}',
            'incluir_imagen': True,
            'incluir_recomendaciones': True
        }
        form = EnviarAnalisisEmailForm(initial=initial_data)
    
    context = {
        'form': form,
        'analisis': analisis,
        'title': f'Enviar Análisis de {analisis.nombre_paciente}'
    }
    
    return render(request, 'analisis/enviar_email.html', context)


@login_required 
def enviar_multiple_analisis_email(request):
    """Vista para enviar múltiples análisis por email"""
    if request.method == 'POST':
        analisis_ids = request.POST.getlist('analisis_seleccionados')
        destinatario = request.POST.get('destinatario')
        
        if not analisis_ids:
            messages.error(request, 'Debes seleccionar al menos un análisis.')
            return redirect('analisis:lista')
        
        if not destinatario:
            messages.error(request, 'Debes proporcionar un email de destinatario.')
            return redirect('analisis:lista')
        
        # Obtener análisis seleccionados
        analisis_list = AnalisisNutricional.objects.filter(
            id__in=analisis_ids, 
            activo=True
        )
        
        # Verificar permisos para todos
        sin_permisos = []
        for analisis in analisis_list:
            if not (request.user == analisis.procesado_por or request.user.is_staff):
                sin_permisos.append(analisis.nombre_paciente)
        
        if sin_permisos:
            messages.error(
                request, 
                f'No tienes permisos para enviar análisis de: {", ".join(sin_permisos)}'
            )
            return redirect('analisis:lista')
        
        # Enviar emails
        enviados = 0
        errores = []
        
        for analisis in analisis_list:
            resultado = EmailService.enviar_analisis(
                analisis=analisis,
                destinatario=destinatario,
                incluir_imagen=True,
                incluir_recomendaciones=True
            )
            
            if resultado['exito']:
                enviados += 1
            else:
                errores.append(f'{analisis.nombre_paciente}: {resultado["mensaje"]}')
        
        # Mostrar resultados
        if enviados > 0:
            messages.success(
                request, 
                f'✅ {enviados} análisis enviados exitosamente a {destinatario}'
            )
        
        if errores:
            for error in errores:
                messages.error(request, f'❌ {error}')
        
        return redirect('analisis:lista')
    
    return redirect('analisis:lista')
