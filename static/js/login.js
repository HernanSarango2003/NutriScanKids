/**
 * NutriScan Kids - Authentication JavaScript
 * Maneja la funcionalidad de autenticación y UI interactiva
 */

class AuthHandler {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupPasswordToggle();
    this.setupFormValidation();
    this.setupAnimations();
  }

  /**
   * Configura todos los event listeners necesarios
   */
  setupEventListeners() {
    // Tab navigation
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");

    if (loginTab) {
      loginTab.addEventListener("click", (e) => {
        this.handleTabClick(e, "login");
      });
    }

    if (registerTab) {
      registerTab.addEventListener("click", (e) => {
        this.handleTabClick(e, "register");
      });
    }

    // Form submission
    const loginForm = document.getElementById("login");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        this.handleFormSubmit(e);
      });
    }

    // Input focus effects
    this.setupInputEffects();
  }

  /**
   * Maneja el clic en las pestañas
   */
  handleTabClick(event, tabType) {
    event.preventDefault();

    // Agregar efecto de carga
    const target = event.currentTarget;
    this.addLoadingEffect(target);

    // Navegar después de un breve delay para mostrar el efecto
    setTimeout(() => {
      if (tabType === "login") {
        window.location.href = loginTab.href;
      } else if (tabType === "register") {
        window.location.href = registerTab.href;
      }
    }, 200);
  }

  /**
   * Agrega efecto de carga a los elementos
   */
  addLoadingEffect(element) {
    const originalContent = element.innerHTML;
    element.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Cargando...';
    element.classList.add("opacity-75", "cursor-not-allowed");

    setTimeout(() => {
      element.innerHTML = originalContent;
      element.classList.remove("opacity-75", "cursor-not-allowed");
    }, 1000);
  }

  /**
   * Configura el toggle de contraseña
   */
  setupPasswordToggle() {
    const toggleButton = document.getElementById("toggle-password");
    const passwordInput = document.getElementById("id_password");
    const eyeIcon = document.getElementById("eye-icon");

    if (toggleButton && passwordInput && eyeIcon) {
      toggleButton.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";

        passwordInput.type = isPassword ? "text" : "password";
        eyeIcon.className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";

        // Efecto visual
        toggleButton.classList.add("transform", "scale-110");
        setTimeout(() => {
          toggleButton.classList.remove("transform", "scale-110");
        }, 150);
      });
    }
  }

  /**
   * Configura la validación del formulario
   */
  setupFormValidation() {
    const form = document.getElementById("login");
    const usernameInput = document.getElementById("id_username");
    const passwordInput = document.getElementById("id_password");

    if (form && usernameInput && passwordInput) {
      // Validación en tiempo real
      usernameInput.addEventListener("input", () => {
        this.validateField(usernameInput, "username");
      });

      passwordInput.addEventListener("input", () => {
        this.validateField(passwordInput, "password");
      });

      // Remover errores al enfocar
      usernameInput.addEventListener("focus", () => {
        this.clearFieldError(usernameInput);
      });

      passwordInput.addEventListener("focus", () => {
        this.clearFieldError(passwordInput);
      });
    }
  }

  /**
   * Valida un campo específico
   */
  validateField(input, fieldType) {
    const value = input.value.trim();
    let isValid = true;
    let errorMessage = "";

    switch (fieldType) {
      case "username":
        if (value.length < 3) {
          isValid = false;
          errorMessage = "El usuario debe tener al menos 3 caracteres";
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          isValid = false;
          errorMessage =
            "El usuario solo puede contener letras, números y guiones bajos";
        }
        break;

      case "password":
        if (value.length < 6) {
          isValid = false;
          errorMessage = "La contraseña debe tener al menos 6 caracteres";
        }
        break;
    }

    this.updateFieldValidation(input, isValid, errorMessage);
    return isValid;
  }

  /**
   * Actualiza la visualización de validación del campo
   */
  updateFieldValidation(input, isValid, errorMessage) {
    const errorDiv = input.parentNode.querySelector(".validation-error");

    if (!isValid && errorMessage) {
      // Agregar clase de error
      input.classList.add("border-red-500", "bg-red-50");
      input.classList.remove("border-green-500", "bg-green-50");

      // Mostrar mensaje de error si no existe
      if (!errorDiv) {
        const errorElement = document.createElement("div");
        errorElement.className =
          "validation-error mt-2 text-sm text-red-600 flex items-center animate-fade-in";
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>${errorMessage}`;
        input.parentNode.appendChild(errorElement);
      }
    } else if (isValid && input.value.trim()) {
      // Agregar clase de éxito
      input.classList.add("border-green-500", "bg-green-50");
      input.classList.remove("border-red-500", "bg-red-50");

      // Remover mensaje de error
      if (errorDiv) {
        errorDiv.remove();
      }
    } else {
      // Estado neutral
      input.classList.remove(
        "border-red-500",
        "bg-red-50",
        "border-green-500",
        "bg-green-50"
      );
      if (errorDiv) {
        errorDiv.remove();
      }
    }
  }

  /**
   * Limpia los errores de un campo
   */
  clearFieldError(input) {
    const errorDiv = input.parentNode.querySelector(".validation-error");
    if (errorDiv) {
      errorDiv.classList.add("animate-fade-out");
      setTimeout(() => errorDiv.remove(), 300);
    }

    input.classList.remove("border-red-500", "bg-red-50");
  }

  /**
   * Maneja el envío del formulario
   */
  handleFormSubmit(event) {
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const usernameInput = document.getElementById("id_username");
    const passwordInput = document.getElementById("id_password");

    // Validar campos antes del envío
    const isUsernameValid = this.validateField(usernameInput, "username");
    const isPasswordValid = this.validateField(passwordInput, "password");

    if (!isUsernameValid || !isPasswordValid) {
      event.preventDefault();
      this.showNotification(
        "Por favor, corrija los errores antes de continuar",
        "error"
      );
      return;
    }

    // Mostrar estado de carga
    if (submitButton) {
      const originalContent = submitButton.innerHTML;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Iniciando sesión...';
      submitButton.disabled = true;
      submitButton.classList.add("opacity-75", "cursor-not-allowed");

      // Restaurar el botón después de 5 segundos (en caso de error)
      setTimeout(() => {
        submitButton.innerHTML = originalContent;
        submitButton.disabled = false;
        submitButton.classList.remove("opacity-75", "cursor-not-allowed");
      }, 5000);
    }
  }

  /**
   * Configura efectos de input
   */
  setupInputEffects() {
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="password"], input[type="email"]'
    );

    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.parentNode.classList.add("transform", "scale-[1.02]");
      });

      input.addEventListener("blur", () => {
        input.parentNode.classList.remove("transform", "scale-[1.02]");
      });
    });
  }

  /**
   * Configura animaciones de entrada
   */
  setupAnimations() {
    // Animar elementos con retraso escalonado
    const animatedElements = document.querySelectorAll(".animate-slide-up");

    animatedElements.forEach((element, index) => {
      element.style.animationDelay = `${index * 0.2}s`;
    });

    // Animar características con retraso
    const featureItems = document.querySelectorAll(".feature-item");
    featureItems.forEach((item, index) => {
      item.style.animationDelay = `${0.3 + index * 0.1}s`;
      item.classList.add("animate-slide-up");
    });
  }

  /**
   * Muestra notificaciones personalizadas
   */
  showNotification(message, type = "info", duration = 5000) {
    const notification = document.createElement("div");
    notification.className = `
            fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm
            transform translate-x-full transition-transform duration-300 ease-out
            ${this.getNotificationStyles(type)}
        `;

    notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${this.getNotificationIcon(type)} mr-3"></i>
                <span class="flex-1">${message}</span>
                <button class="ml-3 text-white hover:text-gray-200" onclick="this.parentNode.parentNode.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);

    // Auto-remover
    setTimeout(() => {
      notification.classList.add("translate-x-full");
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  /**
   * Obtiene los estilos para las notificaciones
   */
  getNotificationStyles(type) {
    const styles = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      warning: "bg-yellow-500 text-white",
      info: "bg-blue-500 text-white",
    };
    return styles[type] || styles.info;
  }

  /**
   * Obtiene el icono para las notificaciones
   */
  getNotificationIcon(type) {
    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };
    return icons[type] || icons.info;
  }

  /**
   * Maneja mensajes de éxito del servidor
   */
  handleSuccessMessage(message) {
    const successDiv = document.getElementById("success-message");
    const successText = document.getElementById("success-text");

    if (successDiv && successText) {
      successText.textContent = message;
      successDiv.classList.remove("hidden");
      successDiv.classList.add("animate-fade-in");

      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        successDiv.classList.add("animate-fade-out");
        setTimeout(() => {
          successDiv.classList.add("hidden");
          successDiv.classList.remove("animate-fade-out");
        }, 300);
      }, 5000);
    }
  }

  /**
   * Inicializa efectos de scroll suave
   */
  setupSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute("href"));

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });
  }

  /**
   * Maneja el estado de carga global
   */
  setLoadingState(isLoading) {
    const body = document.body;

    if (isLoading) {
      body.style.cursor = "wait";
      body.classList.add("pointer-events-none");
    } else {
      body.style.cursor = "default";
      body.classList.remove("pointer-events-none");
    }
  }

  /**
   * Utilidad para debug en desarrollo
   */
  debug(message, data = null) {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.log(`[NutriScan Auth] ${message}`, data);
    }
  }
}

/**
 * Clase para manejar animaciones avanzadas
 */
class AnimationManager {
  constructor() {
    this.setupIntersectionObserver();
    this.setupParallaxEffects();
  }

  /**
   * Configura el observer para animaciones al entrar en viewport
   */
  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-slide-up");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observar elementos que necesitan animación
    const elementsToAnimate = document.querySelectorAll(
      ".feature-item, .auth-forms, .auth-info"
    );
    elementsToAnimate.forEach((el) => observer.observe(el));
  }

  /**
   * Configura efectos de parallax sutiles
   */
  setupParallaxEffects() {
    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;

      const parallaxElements = document.querySelectorAll(".gradient-bg");
      parallaxElements.forEach((element) => {
        element.style.transform = `translate3d(0, ${rate}px, 0)`;
      });

      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener("scroll", requestTick);
  }
}

/**
 * Clase para manejar la accesibilidad
 */
class AccessibilityManager {
  constructor() {
    this.setupKeyboardNavigation();
    this.setupAriaLabels();
    this.setupFocusManagement();
  }

  /**
   * Configura la navegación por teclado
   */
  setupKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // Enter en tabs
      if (e.key === "Enter" && e.target.classList.contains("tab")) {
        e.target.click();
      }

      // Escape para cerrar notificaciones
      if (e.key === "Escape") {
        const notifications = document.querySelectorAll(".fixed.top-4.right-4");
        notifications.forEach((notification) => notification.remove());
      }
    });
  }

  /**
   * Configura las etiquetas ARIA
   */
  setupAriaLabels() {
    const passwordToggle = document.getElementById("toggle-password");
    if (passwordToggle) {
      passwordToggle.setAttribute("aria-label", "Mostrar/ocultar contraseña");
    }

    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute(
        "aria-selected",
        tab.classList.contains("active") ? "true" : "false"
      );
    });
  }

  /**
   * Maneja el foco para mejor accesibilidad
   */
  setupFocusManagement() {
    // Agregar indicadores de foco visibles
    const focusableElements = document.querySelectorAll(
      'input, button, a, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element) => {
      element.addEventListener("focus", () => {
        element.classList.add("ring-2", "ring-primary", "ring-opacity-50");
      });

      element.addEventListener("blur", () => {
        element.classList.remove("ring-2", "ring-primary", "ring-opacity-50");
      });
    });
  }
}

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar clases principales
  const authHandler = new AuthHandler();
  const animationManager = new AnimationManager();
  const accessibilityManager = new AccessibilityManager();

  // Debug info
  authHandler.debug("NutriScan Kids Auth system initialized", {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });

  // Configurar manejo de errores globales
  window.addEventListener("error", (e) => {
    authHandler.debug("JavaScript Error:", {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    });
  });

  // Configurar performance monitoring en desarrollo
  if (window.performance && window.performance.measure) {
    window.addEventListener("load", () => {
      const loadTime =
        window.performance.timing.loadEventEnd -
        window.performance.timing.navigationStart;
      authHandler.debug(`Page loaded in ${loadTime}ms`);
    });
  }
});

/**
 * Exponer funciones globales para uso desde Django templates si es necesario
 */
window.NutriScanAuth = {
  showNotification: (message, type, duration) => {
    const authHandler = new AuthHandler();
    authHandler.showNotification(message, type, duration);
  },

  setLoadingState: (isLoading) => {
    const authHandler = new AuthHandler();
    authHandler.setLoadingState(isLoading);
  },
};
