/**
 * historial-analisis.js
 * JavaScript para la página de historial de análisis nutricionales
 * NutriScan Kids - Responsive y optimizado para todas las resoluciones
 */

// Variables globales
let searchTimeout;
let deleteModalElement;

// Inicialización del DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Inicializa la aplicación
 */
function initializeApp() {
    // Obtener referencias a elementos del DOM
    deleteModalElement = document.getElementById('deleteModal');
    
    // Configurar event listeners
    setupEventListeners();
    
    // Inicializar componentes
    initializeAnimations();
    initializeFormControls();
    initializeKeyboardShortcuts();
    initializeTooltips();
    initializeLazyLoading();
    
    // Configurar PWA
    initializePWA();
    
    console.log('Historial de Análisis inicializado correctamente');
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
    // Filtros automáticos
    const selectores = document.querySelectorAll('select[name="estado"], select[name="severidad"]');
    selectores.forEach(selector => {
        selector.addEventListener('change', function() {
            this.form.submit();
        });
    });
    
    // Búsqueda con Enter
    const searchInput = document.querySelector('input[name="buscar"]');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.form.submit();
            }
        });
        
        // Búsqueda en tiempo real (opcional)
        searchInput.addEventListener('input', buscarEnTiempoReal);
    }
    
    // Cerrar modal al hacer clic fuera
    if (deleteModalElement) {
        deleteModalElement.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarModal();
            }
        });
    }
    
    // Responsive menu toggle (si existe)
    const menuToggle = document.querySelector('[data-mobile-menu-toggle]');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Detección de cambios en orientación y tamaño de pantalla
    window.addEventListener('resize', debounce(handleResize, 250));
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Optimización para scroll en dispositivos móviles
    if (isMobileDevice()) {
        optimizeMobileScrolling();
    }
}

/**
 * Inicializa animaciones de entrada
 */
function initializeAnimations() {
    // Animar entrada de las cards
    const cards = document.querySelectorAll('.hover-lift');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Actualizar barras de progreso con animación
    animateProgressBars();
    
    // Animar contadores
    animateCounters();
}

/**
 * Anima las barras de progreso
 */
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.bg-gradient-to-r');
    progressBars.forEach((bar, index) => {
        if (bar.style.width && bar.style.width !== '0%') {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.transition = 'width 1s ease-out';
                bar.style.width = width;
            }, 500 + (index * 100));
        }
    });
}

/**
 * Anima los contadores de estadísticas
 */
function animateCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-counter') || counter.textContent);
        const duration = 2000;
        const step = Math.ceil(target / (duration / 16));
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = current.toLocaleString();
        }, 16);
    });
}

/**
 * Inicializa controles de formulario
 */
function initializeFormControls() {
    // Mejorar inputs con efectos focus
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.classList.add('filter-input');
        });
        
        input.addEventListener('blur', function() {
            this.classList.remove('filter-input');
        });
    });
    
    // Validación en tiempo real
    const requiredInputs = document.querySelectorAll('input[required], select[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', validateInput);
        input.addEventListener('input', clearValidationError);
    });
}

/**
 * Valida un input individual
 */
function validateInput(e) {
    const input = e.target;
    const value = input.value.trim();
    
    if (!value && input.hasAttribute('required')) {
        showInputError(input, 'Este campo es obligatorio');
    } else {
        clearInputError(input);
    }
}

/**
 * Muestra error en un input
 */
function showInputError(input, message) {
    clearInputError(input);
    
    input.classList.add('border-red-500', 'focus:ring-red-500');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-500 text-sm mt-1 validation-error';
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
}

/**
 * Limpia error de un input
 */
function clearInputError(input) {
    input.classList.remove('border-red-500', 'focus:ring-red-500');
    
    const errorDiv = input.parentNode.querySelector('.validation-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * Limpia errores de validación
 */
function clearValidationError(e) {
    clearInputError(e.target);
}

/**
 * Configura atajos de teclado
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K para focus en búsqueda
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('input[name="buscar"]');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape para cerrar modal
        if (e.key === 'Escape') {
            cerrarModal();
        }
        
        // Ctrl/Cmd + N para nuevo análisis
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const newButton = document.querySelector('a[href*="nuevo"]');
            if (newButton) {
                newButton.click();
            }
        }
        
        // F5 para actualizar (con confirmación si hay filtros)
        if (e.key === 'F5') {
            const hasFilters = checkForActiveFilters();
            if (hasFilters) {
                e.preventDefault();
                if (confirm('¿Deseas actualizar la página? Se mantendrán los filtros activos.')) {
                    location.reload();
                }
            }
        }
    });
}

/**
 * Verifica si hay filtros activos
 */
function checkForActiveFilters() {
    const searchInput = document.querySelector('input[name="buscar"]');
    const stateSelect = document.querySelector('select[name="estado"]');
    const severitySelect = document.querySelector('select[name="severidad"]');
    
    return (searchInput && searchInput.value.trim()) ||
           (stateSelect && stateSelect.value) ||
           (severitySelect && severitySelect.value);
}

/**
 * Configura tooltips
 */
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[title]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('focus', showTooltip);
        element.addEventListener('blur', hideTooltip);
    });
}

/**
 * Muestra tooltip
 */
function showTooltip(e) {
    const element = e.target;
    const title = element.getAttribute('title');
    
    if (!title) return;
    
    // Crear tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip absolute z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none';
    tooltip.textContent = title;
    tooltip.id = 'custom-tooltip';
    
    // Ocultar title nativo
    element.setAttribute('data-title', title);
    element.removeAttribute('title');
    
    // Posicionar tooltip
    document.body.appendChild(tooltip);
    positionTooltip(element, tooltip);
}

/**
 * Oculta tooltip
 */
function hideTooltip(e) {
    const element = e.target;
    const tooltip = document.getElementById('custom-tooltip');
    
    if (tooltip) {
        tooltip.remove();
    }
    
    // Restaurar title
    const title = element.getAttribute('data-title');
    if (title) {
        element.setAttribute('title', title);
        element.removeAttribute('data-title');
    }
}

/**
 * Posiciona el tooltip
 */
function positionTooltip(element, tooltip) {
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    
    // Ajustar si se sale de la pantalla
    if (top < 0) {
        top = rect.bottom + 8;
    }
    
    if (left < 0) {
        left = 8;
    } else if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 8;
    }
    
    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left}px`;
}

/**
 * Inicializa lazy loading
 */
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

/**
 * Inicializa PWA
 */
function initializePWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    }
}

/**
 * Limpia todos los filtros
 */
function limpiarFiltros() {
    // Limpiar todos los filtros
    const searchInput = document.querySelector('input[name="buscar"]');
    const stateSelect = document.querySelector('select[name="estado"]');
    const severitySelect = document.querySelector('select[name="severidad"]');
    
    if (searchInput) searchInput.value = '';
    if (stateSelect) stateSelect.value = '';
    if (severitySelect) severitySelect.value = '';
    
    // Mostrar loading
    showLoading('Limpiando filtros...');
    
    // Redirigir sin parámetros
    setTimeout(() => {
        window.location.href = window.location.pathname;
    }, 300);
}

/**
 * Confirma la eliminación de un análisis
 */
function confirmarEliminacion(analisisId, nombrePaciente) {
    if (!deleteModalElement) {
        console.error('Modal de eliminación no encontrado');
        return;
    }
    
    const patientNameElement = document.getElementById('patientName');
    const deleteFormElement = document.getElementById('deleteForm');
    
    if (patientNameElement) {
        patientNameElement.textContent = nombrePaciente;
    }
    
    if (deleteFormElement) {
        deleteFormElement.action = `/analisis/${analisisId}/eliminar/`;
    }
    
    // Mostrar modal con animación
    deleteModalElement.classList.remove('hidden');
    
    setTimeout(() => {
        deleteModalElement.classList.add('animate-fade-in');
    }, 10);
    
    // Focus en el botón de cancelar para accesibilidad
    const cancelButton = deleteModalElement.querySelector('button[onclick*="cerrarModal"]');
    if (cancelButton) {
        setTimeout(() => cancelButton.focus(), 100);
    }
}

/**
 * Cierra el modal de eliminación
 */
function cerrarModal() {
    if (!deleteModalElement) return;
    
    deleteModalElement.classList.add('animate-fade-out');
    
    setTimeout(() => {
        deleteModalElement.classList.add('hidden');
        deleteModalElement.classList.remove('animate-fade-in', 'animate-fade-out');
    }, 200);
}

/**
 * Búsqueda en tiempo real con debounce
 */
function buscarEnTiempoReal() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
            showLoading('Buscando...');
            form.submit();
        }
    }, 800); // Aumentado el delay para evitar demasiadas peticiones
}

/**
 * Muestra indicador de carga
 */
function showLoading(message = 'Cargando...') {
    const existingLoader = document.getElementById('loading-indicator');
    if (existingLoader) {
        existingLoader.remove();
    }
    
    const loader = document.createElement('div');
    loader.id = 'loading-indicator';
    loader.className = 'fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 flex items-center space-x-3';
    loader.innerHTML = `
        <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
        <span class="text-gray-700 font-medium">${message}</span>
    `;
    
    document.body.appendChild(loader);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (loader.parentNode) {
            loader.remove();
        }
    }, 5000);
}

/**
 * Muestra notificaciones toast
 */
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    const iconClass = tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle';
    const bgClass = tipo === 'success' ? 'from-green-500 to-green-600' : 
                   tipo === 'error' ? 'from-red-500 to-red-600' : 
                   'from-blue-500 to-blue-600';
    
    toast.className = `fixed top-4 right-4 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl text-white font-bold shadow-lg transform translate-x-full transition-all duration-300 bg-gradient-to-r ${bgClass} max-w-sm`;
    
    toast.innerHTML = `
        <div class="flex items-center space-x-2 sm:space-x-3">
            <i class="fas fa-${iconClass} text-sm sm:text-base"></i>
            <span class="text-sm sm:text-base">${mensaje}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white">
                <i class="fas fa-times text-sm"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-ocultar después de 4 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    }, 4000);
}

/**
 * Exporta análisis (funcionalidad futura)
 */
function exportarAnalisis(formato = 'pdf') {
    mostrarToast('Funcionalidad de exportación en desarrollo', 'info');
    
    // Aquí puedes implementar la lógica de exportación
    console.log(`Exportando análisis en formato: ${formato}`);
}

/**
 * Comparte análisis usando Web Share API
 */
function compartirAnalisis(analisisId, nombrePaciente) {
    const url = `${window.location.origin}/analisis/${analisisId}/`;
    const title = `Análisis Nutricional - ${nombrePaciente}`;
    const text = `Revisa este análisis nutricional de ${nombrePaciente}`;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        }).then(() => {
            mostrarToast('Análisis compartido exitosamente', 'success');
        }).catch((error) => {
            console.log('Error al compartir:', error);
            copiarEnlace(url);
        });
    } else {
        copiarEnlace(url);
    }
}

/**
 * Copia enlace al portapapeles
 */
function copiarEnlace(url) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            mostrarToast('Enlace copiado al portapapeles', 'success');
        }).catch(() => {
            fallbackCopyText(url);
        });
    } else {
        fallbackCopyText(url);
    }
}

/**
 * Fallback para copiar texto
 */
function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        mostrarToast('Enlace copiado al portapapeles', 'success');
    } catch (err) {
        mostrarToast('No se pudo copiar el enlace', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Detecta si es un dispositivo móvil
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

/**
 * Optimiza el scroll para dispositivos móviles
 */
function optimizeMobileScrolling() {
    // Smooth scrolling
    if (CSS.supports('scroll-behavior', 'smooth')) {
        document.documentElement.style.scrollBehavior = 'smooth';
    }
    
    // Momentum scrolling para iOS
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Prevenir zoom en inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type !== 'range') {
            input.addEventListener('focus', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                }
            });
            
            input.addEventListener('blur', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.content = 'width=device-width, initial-scale=1.0';
                }
            });
        }
    });
}

/**
 * Maneja cambios de tamaño de ventana
 */
function handleResize() {
    // Actualizar variables CSS para viewport height en móviles
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Reorganizar elementos si es necesario
    adjustLayoutForScreenSize();
    
    // Reposicionar tooltips
    const tooltip = document.getElementById('custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

/**
 * Maneja cambios de orientación
 */
function handleOrientationChange() {
    // Delay para permitir que la orientación se complete
    setTimeout(() => {
        handleResize();
        
        // Forzar repaint para arreglar bugs de orientación
        const body = document.body;
        body.style.display = 'none';
        body.offsetHeight; // trigger reflow
        body.style.display = '';
    }, 100);
}

/**
 * Ajusta el layout según el tamaño de pantalla
 */
function adjustLayoutForScreenSize() {
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;
    const isDesktop = screenWidth >= 1024;
    
    // Ajustar grid de estadísticas
    const statsGrid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    if (statsGrid) {
        if (isMobile) {
            statsGrid.className = 'grid grid-cols-1 gap-4 mb-6';
        } else if (isTablet) {
            statsGrid.className = 'grid grid-cols-2 gap-6 mb-8';
        } else {
            statsGrid.className = 'grid grid-cols-4 gap-6 mb-8';
        }
    }
    
    // Ajustar tabla vs cards
    const tableView = document.querySelector('.hidden.xl\\:block');
    const cardView = document.querySelector('.block.xl\\:hidden');
    
    if (tableView && cardView) {
        if (isDesktop) {
            tableView.classList.remove('hidden');
            cardView.classList.add('hidden');
        } else {
            tableView.classList.add('hidden');
            cardView.classList.remove('hidden');
        }
    }
}

/**
 * Toggle para menú móvil
 */
function toggleMobileMenu() {
    const menu = document.querySelector('[data-mobile-menu]');
    if (menu) {
        menu.classList.toggle('hidden');
        menu.classList.toggle('block');
        
        // Animate
        if (!menu.classList.contains('hidden')) {
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                menu.style.transition = 'all 0.3s ease';
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
            }, 10);
        }
    }
}

/**
 * Función debounce para optimizar eventos
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Función throttle para optimizar eventos
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

/**
 * Inicializa observadores de rendimiento
 */
function initializePerformanceObservers() {
    // Observer para métricas de rendimiento
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'paint') {
                        console.log(`${entry.name}: ${entry.startTime}ms`);
                    }
                });
            });
            observer.observe({ entryTypes: ['paint'] });
        } catch (e) {
            console.warn('PerformanceObserver not supported');
        }
    }
}

/**
 * Manejo de errores globales
 */
function setupErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('Error global:', e.error);
        mostrarToast('Ha ocurrido un error inesperado', 'error');
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Promise rechazada:', e.reason);
        mostrarToast('Error de conexión', 'error');
    });
}

/**
 * Configuración de accesibilidad
 */
function setupAccessibility() {
    // Skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Saltar al contenido principal';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Anuncios para lectores de pantalla
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.id = 'screen-reader-announcer';
    document.body.appendChild(announcer);
    
    // Focus management
    setupFocusManagement();
}

/**
 * Configuración de manejo de focus
 */
function setupFocusManagement() {
    // Trap focus en modales
    const modals = document.querySelectorAll('[role="dialog"], .modal');
    modals.forEach(modal => {
        modal.addEventListener('keydown', trapFocus);
    });
}

/**
 * Atrapa el focus en un elemento
 */
function trapFocus(e) {
    if (e.key !== 'Tab') return;
    
    const modal = e.currentTarget;
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
        if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        }
    } else {
        if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }
}

/**
 * Anuncia mensajes para lectores de pantalla
 */
function announceToScreenReader(message) {
    const announcer = document.getElementById('screen-reader-announcer');
    if (announcer) {
        announcer.textContent = message;
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    }
}

/**
 * Funciones de utilidad para manejo de datos
 */
const DataUtils = {
    /**
     * Formatea números
     */
    formatNumber: function(num) {
        return new Intl.NumberFormat('es-ES').format(num);
    },
    
    /**
     * Formatea fechas
     */
    formatDate: function(date, options = {}) {
        const defaultOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options }).format(new Date(date));
    },
    
    /**
     * Formatea porcentajes
     */
    formatPercentage: function(num) {
        return new Intl.NumberFormat('es-ES', { 
            style: 'percent', 
            minimumFractionDigits: 1 
        }).format(num / 100);
    }
};

/**
 * Manejo de estado de la aplicación
 */
const AppState = {
    filters: {
        search: '',
        state: '',
        severity: ''
    },
    
    updateFilter: function(key, value) {
        this.filters[key] = value;
        this.saveState();
    },
    
    saveState: function() {
        try {
            localStorage.setItem('historialAnalisisState', JSON.stringify(this.filters));
        } catch (e) {
            console.warn('No se pudo guardar el estado en localStorage');
        }
    },
    
    loadState: function() {
        try {
            const saved = localStorage.getItem('historialAnalisisState');
            if (saved) {
                this.filters = { ...this.filters, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('No se pudo cargar el estado desde localStorage');
        }
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Configurar manejo de errores
setupErrorHandling();

// Configurar accesibilidad
setupAccessibility();

// Inicializar observadores de rendimiento
initializePerformanceObservers();

// Exponer funciones globales necesarias
window.limpiarFiltros = limpiarFiltros;
window.confirmarEliminacion = confirmarEliminacion;
window.cerrarModal = cerrarModal;
window.mostrarToast = mostrarToast;
window.exportarAnalisis = exportarAnalisis;
window.compartirAnalisis = compartirAnalisis;