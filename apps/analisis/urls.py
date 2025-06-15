"""
URLs para el módulo de análisis nutricional
"""
from django.urls import path
from apps.analisis.views.analisis import dashboard_estadisticas, enviar_analisis_email, enviar_multiple_analisis_email, lista_analisis, nuevo_analisis, detalle_analisis, editar_analisis, eliminar_analisis, procesar_imagen_ajax, exportar_reporte

app_name = 'analisis'

urlpatterns = [
    # Dashboard y estadísticas
    path('', dashboard_estadisticas, name='dashboard'),
    path('estadisticas/', dashboard_estadisticas, name='estadisticas'),
    
    # CRUD de análisis
    path('lista/', lista_analisis, name='lista'),
    path('nuevo/', nuevo_analisis, name='nuevo'),
    path('<uuid:analisis_id>/', detalle_analisis, name='detalle'),
    path('<uuid:analisis_id>/editar/', editar_analisis, name='editar'),
    path('<uuid:analisis_id>/eliminar/', eliminar_analisis, name='eliminar'),
    
    # Funciones AJAX y procesamiento
    path('procesar-imagen/', procesar_imagen_ajax, name='procesar_imagen'),
    
    # Reportes y exportación
    path('exportar/csv/', exportar_reporte, name='exportar_csv'),
    
    path('enviar-email/<int:analisis_id>/', enviar_analisis_email, name='enviar_email'),
    path('enviar-multiple-email/', enviar_multiple_analisis_email, name='enviar_multiple_email'),
]