"""
Servicio para el análisis nutricional usando Roboflow - VERSIÓN CORREGIDA
"""
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
import io
import base64
from django.core.files.base import ContentFile
from django.conf import settings
from inference_sdk import InferenceHTTPClient

class AnalisisNutricionalService:
    """Servicio para realizar análisis nutricional con IA"""
    
    def __init__(self):
        self.client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=getattr(settings, 'ROBOFLOW_API_KEY', "0r4klCQmalPo9Xw2xkj6")
        )
        self.model_id = getattr(settings, 'ROBOFLOW_MODEL_ID', "malnutrition_project-1/1")
        
        # Configuración de colores y nombres de clases
        self.class_colors = {
            0: (255, 0, 0),    # Rojo para malnutridos
            1: (0, 255, 0),    # Verde para sobrenutridos
            2: (0, 0, 255),    # Azul para normal
            "malnutrido": (255, 0, 0),
            "sobrenutrido": (0, 255, 0),
            "normal": (0, 0, 255)
        }
        
        self.class_names = {
            0: "Malnutrido",
            1: "Sobrenutrido", 
            2: "Normal",
            "malnutrido": "Malnutrido",
            "sobrenutrido": "Sobrenutrido",
            "normal": "Normal"
        }
        
        # Mapeo inverso para normalizar las clases (español e inglés)
        self.normalize_class = {
            # Español
            "malnutrido": 0,
            "sobrenutrido": 1,
            "normal": 2,
            # Inglés (lo que está devolviendo el modelo)
            "malnourished": 0,
            "overnourished": 1,
            "well-nourished": 2,
            "wellnourished": 2,
            "normal": 2,
            # Números
            0: 0,
            1: 1,
            2: 2
        }
    
    def procesar_imagen(self, imagen_path):
        """
        Procesa una imagen y devuelve el análisis nutricional
        
        Args:
            imagen_path: Ruta de la imagen a procesar
            
        Returns:
            dict: Resultado del análisis con predicciones y estadísticas
        """
        try:
            # Realizar la inferencia
            resultado = self.client.infer(imagen_path, model_id=self.model_id)
            
            # Debug: Imprimir resultado completo
            print(f"Resultado completo de Roboflow: {resultado}")
            
            if not resultado.get("predictions"):
                return {
                    'exito': False,
                    'error': 'No se detectaron personas en la imagen',
                    'predicciones': [],
                    'imagen_procesada': None
                }
            
            # Normalizar las predicciones
            predicciones_normalizadas = self._normalizar_predicciones(resultado["predictions"])
            
            # Procesar imagen con las detecciones
            imagen_procesada = self._dibujar_predicciones(imagen_path, predicciones_normalizadas)
            
            # Analizar resultados
            estadisticas = self._calcular_estadisticas(predicciones_normalizadas)
            
            # Obtener la mejor predicción (mayor confianza)
            mejor_prediccion = max(predicciones_normalizadas, key=lambda x: x["confidence"])
            
            return {
                'exito': True,
                'predicciones': predicciones_normalizadas,
                'mejor_prediccion': mejor_prediccion,
                'estadisticas': estadisticas,
                'imagen_procesada': imagen_procesada,
                'total_detecciones': len(predicciones_normalizadas)
            }
            
        except Exception as e:
            print(f"Error completo: {str(e)}")
            return {
                'exito': False,
                'error': f'Error al procesar la imagen: {str(e)}',
                'predicciones': [],
                'imagen_procesada': None
            }
    
    def _normalizar_predicciones(self, predicciones):
        """Normaliza las predicciones para manejar diferentes formatos de clase"""
        predicciones_normalizadas = []
        
        for pred in predicciones:
            pred_normalizada = pred.copy()
            
            # Obtener la clase original
            clase_original = pred.get("class", pred.get("class_name", ""))
            
            # Debug: Mostrar clase original
            print(f"Clase original detectada: {clase_original} (tipo: {type(clase_original)})")
            
            # Normalizar la clase a número
            if isinstance(clase_original, str):
                clase_original = clase_original.lower()
            
            if clase_original in self.normalize_class:
                pred_normalizada["class"] = self.normalize_class[clase_original]
                pred_normalizada["class_name"] = self.class_names[self.normalize_class[clase_original]]
            else:
                # Si no reconocemos la clase, asignar como "normal" por defecto
                print(f"Clase no reconocida: {clase_original}, asignando como normal")
                pred_normalizada["class"] = 2
                pred_normalizada["class_name"] = "Normal"
            
            predicciones_normalizadas.append(pred_normalizada)
        
        return predicciones_normalizadas
    
    def _dibujar_predicciones(self, imagen_path, predicciones):
        """Dibuja las predicciones sobre la imagen original"""
        try:
            # Cargar la imagen
            image = cv2.imread(imagen_path)
            if image is None:
                print(f"No se pudo cargar la imagen desde: {imagen_path}")
                return None
                
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image_pil = Image.fromarray(image_rgb)
            
            # Crear una copia para dibujar
            draw_image = image_pil.copy()
            draw = ImageDraw.Draw(draw_image)
            
            # Intentar cargar una fuente
            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except:
                try:
                    font = ImageFont.truetype("DejaVuSans.ttf", 20)
                except:
                    font = ImageFont.load_default()
            
            # Dibujar cada predicción
            for prediction in predicciones:
                self._dibujar_prediccion_individual(draw, prediction, font)
            
            # Convertir a base64 para almacenar/mostrar
            buffer = io.BytesIO()
            draw_image.save(buffer, format='PNG')
            imagen_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            return imagen_base64
            
        except Exception as e:
            print(f"Error al dibujar predicciones: {e}")
            return None
    
    def _dibujar_prediccion_individual(self, draw, prediction, font):
        """Dibuja una predicción individual en la imagen"""
        try:
            # Obtener datos de la predicción
            x = prediction["x"]
            y = prediction["y"]
            width = prediction["width"]
            height = prediction["height"]
            confidence = prediction["confidence"]
            class_id = prediction["class"]
            
            # Calcular coordenadas del rectángulo
            x1 = x - width / 2
            y1 = y - height / 2
            x2 = x + width / 2
            y2 = y + height / 2
            
            # Color y nombre según la clase
            color = self.class_colors.get(class_id, (155, 155, 0))
            class_name = self.class_names.get(class_id, f"Clase {class_id}")
            
            # Dibujar el rectángulo
            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
            
            # Texto de la predicción
            text = f"{class_name}: {confidence:.2f}"
            
            # Dibujar el texto con fondo
            try:
                text_bbox = draw.textbbox((0, 0), text, font=font)
                text_width = text_bbox[2] - text_bbox[0]
                text_height = text_bbox[3] - text_bbox[1]
            except:
                # Fallback para versiones antiguas de PIL
                text_width, text_height = draw.textsize(text, font=font)
            
            # Fondo del texto
            draw.rectangle([x1, y1-text_height-5, x1+text_width+10, y1], fill=color)
            
            # Texto
            draw.text((x1+5, y1-text_height-2), text, fill=(255, 255, 255), font=font)
            
        except Exception as e:
            print(f"Error al dibujar predicción individual: {e}")
    
    def _calcular_estadisticas(self, predicciones):
        """Calcula estadísticas de las predicciones"""
        estadisticas = {
            'malnutridos': 0,
            'sobrenutridos': 0,
            'normal': 0,
            'confianza_promedio': 0,
            'confianza_maxima': 0,
            'distribución_por_clase': {}
        }
        
        if not predicciones:
            return estadisticas
        
        # Contar por categorías
        for pred in predicciones:
            class_id = pred["class"]
            class_name = pred.get("class_name", self.class_names.get(class_id, "Desconocido"))
            
            # Debug: Mostrar qué se está contando
            print(f"Contando predicción - Clase ID: {class_id}, Nombre: {class_name}")
            
            if class_id == 0:
                estadisticas['malnutridos'] += 1
            elif class_id == 1:
                estadisticas['sobrenutridos'] += 1
            elif class_id == 2:
                estadisticas['normal'] += 1
            
            # Agregar a distribución por clase
            if class_name not in estadisticas['distribución_por_clase']:
                estadisticas['distribución_por_clase'][class_name] = 0
            estadisticas['distribución_por_clase'][class_name] += 1
        
        # Calcular confianza
        confianzas = [pred["confidence"] for pred in predicciones]
        estadisticas['confianza_promedio'] = sum(confianzas) / len(confianzas)
        estadisticas['confianza_maxima'] = max(confianzas)
        
        # Debug: Mostrar estadísticas calculadas
        print(f"Estadísticas calculadas: {estadisticas}")
        
        return estadisticas
    
    def determinar_severidad(self, confianza, estado_nutricional):
        """Determina la severidad basada en la confianza y el estado"""
        if estado_nutricional == 2:  # Normal
            return None
            
        if confianza >= 0.8:
            return 'SEVERO'
        elif confianza >= 0.6:
            return 'MODERADO'
        else:
            return 'LEVE'
    
    def obtener_resultado_principal(self, resultado_procesamiento):
        """Obtiene el resultado principal del análisis"""
        if not resultado_procesamiento['exito']:
            return {
                'estado': 'ERROR',
                'mensaje': resultado_procesamiento['error'],
                'confianza': 0
            }
        
        mejor_prediccion = resultado_procesamiento['mejor_prediccion']
        class_id = mejor_prediccion['class']
        confianza = mejor_prediccion['confidence']
        
        estado_nutricional = self.class_names.get(class_id, "Desconocido")
        severidad = self.determinar_severidad(confianza, class_id)
        
        return {
            'estado': estado_nutricional,
            'severidad': severidad,
            'confianza': confianza,
            'class_id': class_id,
            'total_detecciones': resultado_procesamiento['total_detecciones']
        }
    
    def generar_recomendaciones_ia(self, estado_nutricional, severidad, edad_meses):
        """Genera recomendaciones específicas basadas en IA y parámetros"""
        recomendaciones = {
            'alimentarias': [],
            'medicas': [],
            'seguimiento': []
        }
        
        edad_anos = edad_meses // 12
        es_bebe = edad_meses < 24
        es_preescolar = 24 <= edad_meses < 72
        es_escolar = edad_meses >= 72
        
        if estado_nutricional == 0:  # Malnutrido
            if es_bebe:
                recomendaciones['alimentarias'].extend([
                    "Asegurar lactancia materna exclusiva si es menor de 6 meses",
                    "Introducir alimentos complementarios ricos en hierro y zinc",
                    "Papillas fortificadas con micronutrientes"
                ])
            elif es_preescolar:
                recomendaciones['alimentarias'].extend([
                    "Comidas pequeñas y frecuentes (6-8 veces al día)",
                    "Incluir proteínas en cada comida: huevo, pollo, pescado",
                    "Agregar grasas saludables: aguacate, aceite de oliva"
                ])
            else:  # Escolar
                recomendaciones['alimentarias'].extend([
                    "Incrementar ingesta calórica con alimentos densos en nutrientes",
                    "Meriendas nutritivas entre comidas principales",
                    "Suplementos vitamínicos bajo supervisión médica"
                ])
            
            if severidad == 'SEVERO':
                recomendaciones['medicas'].append("Hospitalización para evaluación inmediata")
            elif severidad == 'MODERADO':
                recomendaciones['medicas'].append("Consulta médica urgente en 48 horas")
            else:
                recomendaciones['medicas'].append("Consulta médica en una semana")
                
        elif estado_nutricional == 1:  # Sobrenutrido
            if es_bebe:
                recomendaciones['alimentarias'].extend([
                    "No diluir la leche materna o fórmula",
                    "Evitar jugos y bebidas azucaradas",
                    "Introducir verduras antes que frutas"
                ])
            else:
                recomendaciones['alimentarias'].extend([
                    "Reducir alimentos procesados y ultraprocesados",
                    "Aumentar consumo de verduras y frutas frescas",
                    "Controlar porciones apropiadas para la edad",
                    "Promover actividad física diaria"
                ])
            
            recomendaciones['medicas'].extend([
                "Consulta con nutricionista pediátrico",
                "Evaluación de factores de riesgo metabólico",
                "Seguimiento cada 3 meses"
            ])
        
        # Seguimiento general
        recomendaciones['seguimiento'] = [
            "Registro diario de alimentación por 2 semanas",
            "Control de peso cada 15 días",
            "Seguimiento fotográfico mensual para comparación",
            "Reevaluación con IA en 30 días"
        ]
        
        return recomendaciones