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
from django.template.loader import get_template
from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import json
import os
import base64
import io
from io import BytesIO
from PIL import Image
from apps.analisis.forms.EmailForm import EnviarAnalisisEmailForm
from apps.analisis.services.EmailServices import EmailService
from apps.analisis.models import AnalisisNutricional
from apps.analisis.services.api import AnalisisNutricionalService
from apps.analisis.forms.AnalisisForm import AnalisisNutricionalForm

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

import logging

logger = logging.getLogger(__name__)

@login_required
def lista_analisis(request):
    """Vista para listar todos los análisis nutricionales"""
    # Filtros
    busqueda = request.GET.get('buscar', '')
    estado_filtro = request.GET.get('estado', '')
    severidad_filtro = request.GET.get('severidad', '')
    
    usuario = request.user
    
    # Query base
    analisis = AnalisisNutricional.objects.filter(activo=True, procesado_por=usuario.id)
    
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
    #USER ACTUAL LOGUEADO
    usuario = request.user
    
    analisis = AnalisisNutricional.objects.filter(activo=True, procesado_por=usuario.id)
    
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
def enviar_reporte_email(request, analisis_id):
    """
    Envía el reporte completo del análisis por email al usuario actual
    """
    try:
        # Obtener el análisis
        analisis = get_object_or_404(AnalisisNutricional, 
                                   id=analisis_id, 
                                   procesado_por=request.user,
                                   activo=True)
        
        # Verificar que el análisis esté completado
        if not analisis.procesamiento_completado:
            messages.error(request, 'El análisis aún está en procesamiento. No se puede enviar el reporte.')
            return redirect('analisis:detalle', analisis_id=analisis_id)
        
        # Verificar que el usuario tenga email
        if not request.user.email:
            messages.error(request, 'No tienes un email configurado en tu perfil.')
            return redirect('analisis:detalle', analisis_id=analisis_id)
        
        # Generar y enviar el email
        resultado = enviar_email_reporte(analisis, request.user.email, request.user)
        
        if resultado['success']:
            messages.success(request, f'✅ Reporte enviado exitosamente a {request.user.email}')
            logger.info(f"Reporte enviado para análisis {analisis_id} a {request.user.email}")
        else:
            messages.error(request, f'❌ Error al enviar el reporte: {resultado["error"]}')
            logger.error(f"Error enviando reporte {analisis_id}: {resultado['error']}")
            
    except Exception as e:
        messages.error(request, f'Error inesperado: {str(e)}')
        logger.error(f"Error inesperado enviando reporte {analisis_id}: {str(e)}")
    
    return redirect('analisis:detalle', analisis_id=analisis_id)

def enviar_email_reporte(analisis, email_destino, usuario):
    """
    Función auxiliar para enviar el reporte por email
    """
    try:
        # Contexto para el template del email
        contexto = {
            'analisis': analisis,
            'usuario': usuario,
            'fecha_envio': timezone.now(),
            'sistema_nombre': 'NutriScan IA',
            'url_sistema': settings.SITE_URL if hasattr(settings, 'SITE_URL') else 'http://localhost:8000',
        }
        
        # Generar contenido HTML del email
        template_html = get_template('email/analisis_email.html')
        contenido_html = template_html.render(contexto)
        
        # Generar contenido de texto plano como fallback
        template_texto = get_template('email/analisis_email.txt')
        contenido_texto = template_texto.render(contexto)
        
        # Configurar el email
        asunto = f'📊 Reporte de Análisis Nutricional - {analisis.nombre_paciente}'
        
        # Email del sistema (configurar en settings.py)
        email_desde = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nutriscan.com')
        
        # Crear el email
        email = EmailMultiAlternatives(
            subject=asunto,
            body=contenido_texto,
            from_email=f'NutriScan IA <{email_desde}>',
            to=[email_destino],
            reply_to=['soporte@nutriscan.com']  # Email de soporte
        )
        
        # Adjuntar versión HTML
        email.attach_alternative(contenido_html, "text/html")
        
        # Enviar el email
        email.send()
        
        return {'success': True, 'message': 'Email enviado correctamente'}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def generar_pdf_reporte(analisis):
    """
    Genera un PDF profesional del reporte de análisis
    """
    buffer = BytesIO()
    
    # Configurar el documento PDF
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title=f'Reporte Nutricional - {analisis.nombre_paciente}'
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilos personalizados
    titulo_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#28a745'),
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitulo_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=20,
        textColor=colors.HexColor('#495057'),
        fontName='Helvetica-Bold'
    )
    
    texto_normal = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        alignment=TA_JUSTIFY
    )
    
    # Estilo para texto en tablas
    texto_tabla = ParagraphStyle(
        'TablaTexto',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_LEFT
    )
    
    # Contenido del PDF
    contenido = []
    
    # Encabezado
    contenido.append(Paragraph("🔬 NutriScan IA", titulo_style))
    contenido.append(Paragraph("Sistema de Análisis Nutricional con Inteligencia Artificial", styles['Normal']))
    contenido.append(Spacer(1, 0.5*inch))
    
    # Información del paciente
    contenido.append(Paragraph("📋 INFORMACIÓN DEL PACIENTE", subtitulo_style))
    
    # Tabla de información del paciente - SIN HTML en las celdas
    datos_paciente = [
        ['👶 Nombre:', analisis.nombre_paciente],
        ['📅 Edad:', f'{analisis.edad_meses} meses ({analisis.edad_anos} años)'],
        ['⚧ Género:', analisis.get_genero_display()],
        ['🗓️ Fecha Análisis:', analisis.fecha_analisis.strftime('%d/%m/%Y %H:%M')],
        ['👨‍⚕️ Procesado por:', analisis.procesado_por.get_full_name() if analisis.procesado_por else 'Sistema Automático'],
        ['🆔 ID Análisis:', str(analisis.id)[:8] + '...']
    ]
    
    tabla_paciente = Table(datos_paciente, colWidths=[4*cm, 10*cm])
    tabla_paciente.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8f9fa')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#495057')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#dee2e6')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    contenido.append(tabla_paciente)
    contenido.append(Spacer(1, 0.3*inch))
    
    # Resultados del análisis
    contenido.append(Paragraph("🎯 RESULTADOS DEL ANÁLISIS", subtitulo_style))
    
    # Estado nutricional - usando Paragraph para formatear correctamente
    estado_texto = analisis.get_estado_nutricional_display()
    if analisis.estado_nutricional == 0:  # Malnutrición
        estado_color = colors.HexColor('#dc3545')
    elif analisis.estado_nutricional == 1:  # Riesgo
        estado_color = colors.HexColor('#ffc107')
    else:  # Normal
        estado_color = colors.HexColor('#28a745')
    
    # Crear párrafos para el estado nutricional con formato
    estado_paragraph = Paragraph(f'<b><font color="{estado_color.hexval()}">{estado_texto}</font></b>', texto_tabla)
    confianza_paragraph = Paragraph(f'<b>{analisis.confianza_porcentaje}</b>', texto_tabla)
    
    resultados_data = [
        ['🏥 Estado Nutricional:', estado_paragraph],
        ['📊 Confianza del Modelo:', confianza_paragraph],
    ]
    
    if analisis.severidad:
        severidad_paragraph = Paragraph(f'<b>{analisis.get_severidad_display()}</b>', texto_tabla)
        resultados_data.append(['🔍 Severidad:', severidad_paragraph])
    
    tabla_resultados = Table(resultados_data, colWidths=[4*cm, 10*cm])
    tabla_resultados.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#e8f5e8')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#495057')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#28a745')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    contenido.append(tabla_resultados)
    contenido.append(Spacer(1, 0.3*inch))
    
    # Interpretación de confianza - usando Paragraph en lugar de texto en tabla
    if analisis.confianza >= 0.8:
        interpretacion = Paragraph('✅ <b>Confianza Alta</b> - Resultado muy confiable', 
                                 ParagraphStyle('ConfianzaAlta', parent=texto_normal, textColor=colors.HexColor('#28a745')))
    elif analisis.confianza >= 0.6:
        interpretacion = Paragraph('⚠️ <b>Confianza Media</b> - Se recomienda evaluación adicional', 
                                 ParagraphStyle('ConfianzaMedia', parent=texto_normal, textColor=colors.HexColor('#ffc107')))
    else:
        interpretacion = Paragraph('❌ <b>Confianza Baja</b> - Requiere evaluación médica profesional', 
                                 ParagraphStyle('ConfianzaBaja', parent=texto_normal, textColor=colors.HexColor('#dc3545')))
    
    contenido.append(interpretacion)
    contenido.append(Spacer(1, 0.2*inch))
    
    # Recomendaciones
    if analisis.recomendaciones_nutricionales:
        contenido.append(Paragraph("💡 RECOMENDACIONES", subtitulo_style))
        
        for categoria, recomendaciones in analisis.recomendaciones_nutricionales.items():
            # Título de categoría
            if categoria == 'alimentarias':
                titulo_cat = "🍎 Recomendaciones Alimentarias"
                color_cat = colors.HexColor('#28a745')
            elif categoria == 'medicas':
                titulo_cat = "🏥 Recomendaciones Médicas"
                color_cat = colors.HexColor('#dc3545')
            else:
                titulo_cat = "📋 Plan de Seguimiento"
                color_cat = colors.HexColor('#17a2b8')
            
            # Crear estilo personalizado para cada categoría
            estilo_categoria = ParagraphStyle(
                f'Categoria_{categoria}',
                parent=styles['Heading3'],
                textColor=color_cat,
                fontSize=14,
                spaceAfter=10
            )
            
            contenido.append(Paragraph(f'<b>{titulo_cat}</b>', estilo_categoria))
            
            # Lista de recomendaciones
            for recomendacion in recomendaciones:
                contenido.append(Paragraph(f'• {recomendacion}', texto_normal))
            
            contenido.append(Spacer(1, 0.2*inch))
    
    # Plan alimentario
    if analisis.plan_alimentario:
        contenido.append(Paragraph("🍽️ PLAN ALIMENTARIO PERSONALIZADO", subtitulo_style))
        
        # Dividir el plan en párrafos
        plan_parrafos = analisis.plan_alimentario.split('\n')
        for parrafo in plan_parrafos:
            if parrafo.strip():
                contenido.append(Paragraph(parrafo.strip(), texto_normal))
        
        contenido.append(Spacer(1, 0.2*inch))
    
    # Observaciones adicionales
    if analisis.observaciones_adicionales:
        contenido.append(Paragraph("📝 OBSERVACIONES ADICIONALES", subtitulo_style))
        
        obs_parrafos = analisis.observaciones_adicionales.split('\n')
        for parrafo in obs_parrafos:
            if parrafo.strip():
                contenido.append(Paragraph(parrafo.strip(), texto_normal))
        
        contenido.append(Spacer(1, 0.2*inch))
    
    # Aviso médico
    contenido.append(Spacer(1, 0.3*inch))
    aviso_style = ParagraphStyle(
        'Aviso',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#856404'),
        backColor=colors.HexColor('#fff3cd'),
        borderColor=colors.HexColor('#ffeaa7'),
        borderWidth=1,
        leftIndent=10,
        rightIndent=10,
        spaceAfter=20,
        spaceBefore=10
    )
    
    aviso_texto = """
    <b>⚠️ AVISO MÉDICO IMPORTANTE:</b><br/>
    Este reporte ha sido generado automáticamente por un sistema de inteligencia artificial 
    y tiene fines informativos únicamente. NO sustituye el diagnóstico, tratamiento o consejo 
    médico profesional. Siempre consulte con un pediatra o nutricionista calificado para 
    obtener evaluación y tratamiento médico apropiado.
    """
    
    contenido.append(Paragraph(aviso_texto, aviso_style))
    
    # Footer con información del sistema
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#6c757d'),
        alignment=TA_CENTER
    )
    
    contenido.append(Spacer(1, 0.3*inch))
    contenido.append(Paragraph("🔬 <b>NutriScan IA</b> - Sistema de Análisis Nutricional", footer_style))
    contenido.append(Paragraph("📧 soporte@nutriscan.com | 🌐 www.nutriscan.com", footer_style))
    contenido.append(Paragraph(f"Generado el {timezone.now().strftime('%d/%m/%Y %H:%M')}", footer_style))
    
    # Construir el PDF
    try:
        doc.build(contenido)
    except Exception as e:
        logger.error(f"Error construyendo PDF: {str(e)}")
        raise
    
    # Obtener el contenido del buffer
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content


# Función auxiliar para limpiar texto HTML si es necesario
def limpiar_texto_html(texto):
    """
    Limpia texto de etiquetas HTML que podrían causar problemas en ReportLab
    """
    if not texto:
        return ""
    
    # Reemplazar etiquetas HTML comunes
    texto = texto.replace('<b>', '').replace('</b>', '')
    texto = texto.replace('<font color=', '').replace('</font>', '')
    texto = texto.replace('<br/>', '\n').replace('<br>', '\n')
    
    return texto.strip()


@login_required
def descargar_pdf_reporte(request, analisis_id):
    """
    Vista para descargar directamente el PDF del reporte
    """
    try:
        # Obtener el análisis
        analisis = get_object_or_404(AnalisisNutricional, 
                                   id=analisis_id, 
                                   procesado_por=request.user,
                                   activo=True)
        
        # Verificar que el análisis esté completado
        if not analisis.procesamiento_completado:
            messages.error(request, 'El análisis aún está en procesamiento.')
            return redirect('analisis:detalle', analisis_id=analisis_id)
        
        # Generar PDF
        pdf_content = generar_pdf_reporte(analisis)
        
        # Crear respuesta HTTP con el PDF
        response = HttpResponse(pdf_content, content_type='application/pdf')
        nombre_archivo = f'reporte_nutricional_{analisis.nombre_paciente.replace(" ", "_")}_{analisis.fecha_analisis.strftime("%Y%m%d")}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"'
        
        logger.info(f"PDF descargado: {nombre_archivo} por {request.user.username}")
        return response
        
    except Exception as e:
        messages.error(request, f'Error generando PDF: {str(e)}')
        logger.error(f"Error descargando PDF {analisis_id}: {str(e)}")
        return redirect('analisis:detalle', analisis_id=analisis_id)
