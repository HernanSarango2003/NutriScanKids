/**
 * NutriScan Kids - Authentication Handler
 * Maneja toda la lógica de autenticación, validación y UI
 */

class AuthHandler {
  constructor() {
    this.validators = {
      username: {
        required: true,
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_]+$/,
        messages: {
          required: "El usuario es requerido",
          minLength: "El usuario debe tener al menos 3 caracteres",
          maxLength: "El usuario no puede exceder 30 caracteres",
          pattern:
            "El usuario solo puede contener letras, números y guiones bajos",
        },
      },
      password: {
        required: true,
        minLength: 6,
        maxLength: 128,
        messages: {
          required: "La contraseña es requerida",
          minLength: "La contraseña debe tener al menos 6 caracteres",
          maxLength: "La contraseña no puede exceder 128 caracteres",
        },
      },
    };

    this.init();
  }

  /**
   * Inicializa el handler de autenticación
   */
  init() {
    this.setupEventListeners();
    this.setupPasswordToggle();
    this.setupFormValidation();
    this.setupTabNavigation();
    this.setupAccessibility();
    this.initializeAnimations();
  }

  /**
   * Configura todos los event listeners
   */
  setupEventListeners() {
    // Form submission
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }

    // Input field listeners
    const usernameInput = document.getElementById("id_username");
    const passwordInput = document.getElementById("id_password");

    if (usernameInput) {
      usernameInput.addEventListener("input", () =>
        this.validateField("username")
      );
      usernameInput.addEventListener("blur", () =>
        this.validateField("username")
      );
      usernameInput.addEventListener("focus", () =>
        this.clearFieldError("username")
      );
    }

    if (passwordInput) {
      passwordInput.addEventListener("input", () =>
        this.validateField("password")
      );
      passwordInput.addEventListener("blur", () =>
        this.validateField("password")
      );
      passwordInput.addEventListener("focus", () =>
        this.clearFieldError("password")
      );
    }

    // Social login buttons
    this.setupSocialLogin();
  }

  /**
   * Configura el toggle de contraseña
   */
  setupPasswordToggle() {
    const toggleBtn = document.getElementById("toggle-password");
    const passwordInput = document.getElementById("id_password");
    const passwordIcon = document.getElementById("password-icon");

    if (toggleBtn && passwordInput && passwordIcon) {
      toggleBtn.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";

        // Cambiar tipo de input
        passwordInput.type = isPassword ? "text" : "password";

        // Cambiar icono con animación
        passwordIcon.style.transform = "scale(0)";
        setTimeout(() => {
          passwordIcon.className = isPassword
            ? "fas fa-eye-slash"
            : "fas fa-eye";
          passwordIcon.style.transform = "scale(1)";
        }, 150);

        // Efecto de pulso
        toggleBtn.classList.add("animate-pulse");
        setTimeout(() => toggleBtn.classList.remove("animate-pulse"), 300);
      });
    }
  }

  /**
   * Configura la validación de formularios
   */
  setupFormValidation() {
    const form = document.getElementById("login-form");
    if (form) {
      form.setAttribute("novalidate", "true");

      // Agregar indicadores de validación en tiempo real
      const inputs = form.querySelectorAll(
        'input[type="text"], input[type="password"]'
      );
      inputs.forEach((input) => {
        input.addEventListener("input", () => {
          const fieldName = input.name;
          if (this.validators[fieldName]) {
            this.validateField(fieldName);
          }
        });
      });
    }
  }

  /**
   * Valida un campo específico
   */
  validateField(fieldName) {
    const input = document.getElementById(`id_${fieldName}`);
    const validator = this.validators[fieldName];

    if (!input || !validator) return false;

    const value = input.value.trim();
    const errors = [];

    // Validación requerida
    if (validator.required && !value) {
      errors.push(validator.messages.required);
    }

    if (value) {
      // Validación de longitud mínima
      if (validator.minLength && value.length < validator.minLength) {
        errors.push(validator.messages.minLength);
      }

      // Validación de longitud máxima
      if (validator.maxLength && value.length > validator.maxLength) {
        errors.push(validator.messages.maxLength);
      }

      // Validación de patrón
      if (validator.pattern && !validator.pattern.test(value)) {
        errors.push(validator.messages.pattern);
      }
    }

    // Mostrar errores o éxito
    if (errors.length > 0) {
      this.showFieldError(fieldName, errors[0]);
      return false;
    } else if (value) {
      this.showFieldSuccess(fieldName);
      return true;
    } else {
      this.clearFieldError(fieldName);
      return false;
    }
  }

  /**
   * Muestra error en un campo
   */
  showFieldError(fieldName, message) {
    const input = document.getElementById(`id_${fieldName}`);
    const errorDiv = input.closest(".form-group").querySelector(".field-error");

    if (input && errorDiv) {
      // Agregar estilos de error
      input.classList.add("border-red-500", "bg-red-500/10");
      input.classList.remove("border-green-500", "bg-green-500/10");

      // Mostrar mensaje
      errorDiv.querySelector("span").textContent = message;
      errorDiv.classList.remove("hidden");
      errorDiv.classList.add("animate-slide-down");

      // Efecto de vibración
      input.classList.add("animate-pulse");
      setTimeout(() => input.classList.remove("animate-pulse"), 500);
    }
  }

  /**
   * Muestra éxito en un campo
   */
  showFieldSuccess(fieldName) {
    const input = document.getElementById(`id_${fieldName}`);
    const errorDiv = input.closest(".form-group").querySelector(".field-error");

    if (input) {
      // Agregar estilos de éxito
      input.classList.add("border-green-500", "bg-green-500/10");
      input.classList.remove("border-red-500", "bg-red-500/10");

      // Ocultar mensaje de error
      if (errorDiv) {
        errorDiv.classList.add("hidden");
        errorDiv.classList.remove("animate-slide-down");
      }
    }
  }

  /**
   * Limpia errores de un campo
   */
  clearFieldError(fieldName) {
    const input = document.getElementById(`id_${fieldName}`);
    const errorDiv = input.closest(".form-group").querySelector(".field-error");

    if (input) {
      input.classList.remove(
        "border-red-500",
        "bg-red-500/10",
        "border-green-500",
        "bg-green-500/10"
      );

      if (errorDiv) {
        errorDiv.classList.add("hidden");
        errorDiv.classList.remove("animate-slide-down");
      }
    }
  }

  /**
   * Maneja el envío del formulario
   */
  handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = document.getElementById("submit-btn");
    const btnText = document.getElementById("btn-text");
    const btnLoading = document.getElementById("btn-loading");

    // Validar todos los campos
    const isUsernameValid = this.validateField("username");
    const isPasswordValid = this.validateField("password");

    if (!isUsernameValid || !isPasswordValid) {
      this.showNotification(
        "Por favor, corrija los errores antes de continuar",
        "error"
      );
      this.shakeForm();
      return;
    }

    // Mostrar estado de carga
    this.setLoadingState(true);

    if (submitBtn && btnText && btnLoading) {
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-75", "cursor-not-allowed");
      btnText.classList.add("hidden");
      btnLoading.classList.remove("hidden");
    }

    // Simular delay para mejor UX
    setTimeout(() => {
      form.submit();
    }, 800);

    // Timeout de seguridad
    setTimeout(() => {
      this.setLoadingState(false);
      if (submitBtn && btnText && btnLoading) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
        btnText.classList.remove("hidden");
        btnLoading.classList.add("hidden");
      }
    }, 10000);
  }

  /**
   * Configura navegación entre tabs
   */
  setupTabNavigation() {
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");

    if (loginTab) {
      loginTab.addEventListener("click", (e) => {
        if (loginTab.href !== window.location.href) {
          e.preventDefault();
          this.navigateWithEffect(loginTab.href, "login");
        }
      });
    }

    if (registerTab) {
      registerTab.addEventListener("click", (e) => {
        if (registerTab.href !== window.location.href) {
          e.preventDefault();
          this.navigateWithEffect(registerTab.href, "register");
        }
      });
    }
  }

  /**
   * Navega con efecto de transición
   */
  navigateWithEffect(url, type) {
    const authPanel = document.querySelector(".bg-white\\/10.backdrop-blur-xl");

    if (authPanel) {
      authPanel.style.transform = "scale(0.95)";
      authPanel.style.opacity = "0.5";

      setTimeout(() => {
        window.location.href = url;
      }, 300);
    } else {
      window.location.href = url;
    }
  }

  /**
   * Configura login social
   */
  setupSocialLogin() {
    const socialBtns = document.querySelectorAll(".social-btn");

    socialBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();

        // Efecto de clic
        btn.style.transform = "scale(0.95)";
        setTimeout(() => {
          btn.style.transform = "scale(1)";
        }, 150);

        // Mostrar notificación temporal
        this.showNotification(
          "Función de login social próximamente disponible",
          "info"
        );
      });
    });
  }

  /**
   * Configura accesibilidad
   */
  setupAccessibility() {
    // Navegación por teclado
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const focused = document.activeElement;
        if (focused && focused.classList.contains("tab")) {
          focused.click();
        }
      }

      // Escape para cerrar notificaciones
      if (e.key === "Escape") {
        this.closeAllNotifications();
      }
    });

    // Agregar atributos ARIA
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute(
        "aria-selected",
        tab.classList.contains("text-primary-400") ? "true" : "false"
      );
    });

    // Mejorar indicadores de foco
    const focusableElements = document.querySelectorAll(
      'input, button, a, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements.forEach((element) => {
      element.addEventListener("focus", () => {
        element.classList.add("ring-2", "ring-primary-400", "ring-opacity-50");
      });

      element.addEventListener("blur", () => {
        element.classList.remove(
          "ring-2",
          "ring-primary-400",
          "ring-opacity-50"
        );
      });
    });
  }

  /**
   * Inicializa animaciones
   */
  initializeAnimations() {
    // Animación de entrada escalonada
    const featureCards = document.querySelectorAll(".feature-card");
    featureCards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.2}s`;
    });

    // Observer para animaciones al entrar en viewport
    this.setupIntersectionObserver();
  }

  /**
   * Configura observer para animaciones
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

    const elementsToAnimate = document.querySelectorAll(
      ".feature-card, .auth-forms"
    );
    elementsToAnimate.forEach((el) => observer.observe(el));
  }

  /**
   * Efecto de vibración en el formulario
   */
  shakeForm() {
    const form = document.getElementById("login-form");
    if (form) {
      form.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        form.style.animation = "";
      }, 500);
    }
  }

  /**
   * Establece estado de carga global
   */
  setLoadingState(isLoading) {
    const body = document.body;

    if (isLoading) {
      body.style.cursor = "wait";
      body.classList.add("pointer-events-none");

      // Agregar overlay de carga sutil
      const overlay = document.createElement("div");
      overlay.id = "loading-overlay";
      overlay.className =
        "fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center";
      overlay.innerHTML = `
                <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-6 flex items-center space-x-3">
                    <i class="fas fa-spinner fa-spin text-primary-400 text-xl"></i>
                    <span class="text-white">Procesando...</span>
                </div>
            `;
      document.body.appendChild(overlay);
    } else {
      body.style.cursor = "default";
      body.classList.remove("pointer-events-none");

      const overlay = document.getElementById("loading-overlay");
      if (overlay) {
        overlay.remove();
      }
    }
  }

  /**
   * Sistema de notificaciones
   */
  showNotification(message, type = "info", duration = 5000) {
    const notification = document.createElement("div");
    notification.className = `
            fixed top-6 right-6 z-50 max-w-sm p-4 rounded-xl shadow-2xl border backdrop-blur-xl
            transform translate-x-full transition-all duration-300 ease-out
            ${this.getNotificationStyles(type)}
        `;

    notification.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <i class="fas ${this.getNotificationIcon(
                      type
                    )} text-lg"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <button class="flex-shrink-0 ml-2 hover:scale-110 transition-transform" onclick="this.closest('.fixed').remove()">
                    <i class="fas fa-times text-sm opacity-60 hover:opacity-100"></i>
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

    return notification;
  }

  /**
   * Obtiene estilos para notificaciones
   */
  getNotificationStyles(type) {
    const styles = {
      success: "bg-green-500/20 border-green-500/30 text-green-400",
      error: "bg-red-500/20 border-red-500/30 text-red-400",
      warning: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
      info: "bg-blue-500/20 border-blue-500/30 text-blue-400",
    };
    return styles[type] || styles.info;
  }

  /**
   * Obtiene iconos para notificaciones
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
   * Cierra todas las notificaciones
   */
  closeAllNotifications() {
    const notifications = document.querySelectorAll(".fixed.top-6.right-6");
    notifications.forEach((notification) => {
      notification.classList.add("translate-x-full");
      setTimeout(() => notification.remove(), 300);
    });
  }

  /**
   * Utilidades de debug
   */
  debug(message, data = null) {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.log(`[NutriScan Auth] ${message}`, data);
    }
  }

  /**
   * Maneja mensajes de éxito del servidor
   */
  handleServerSuccess(message) {
    const successDiv = document.getElementById("success-message");
    const successText = document.getElementById("success-text");

    if (successDiv && successText) {
      successText.textContent = message;
      successDiv.classList.remove("hidden");

      setTimeout(() => {
        successDiv.classList.add("hidden");
      }, 8000);
    }
  }

  /**
   * Validación de fortaleza de contraseña
   */
  checkPasswordStrength(password) {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^a-zA-Z0-9]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;

    return {
      score: strength,
      checks: checks,
      level: strength < 2 ? "weak" : strength < 4 ? "medium" : "strong",
    };
  }
}

// CSS personalizado para animaciones adicionales
const customStyles = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    .message-alert.success {
        background: rgba(34, 197, 94, 0.1);
        border-color: rgba(34, 197, 94, 0.3);
    }

    .message-alert.error {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.3);
    }

    .message-alert.warning {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.3);
    }

    .message-alert.info {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.3);
    }

    .feature-card:hover .feature-icon {
        transform: scale(1.1) rotate(5deg);
    }
`;

// Inyectar estilos personalizados
const styleSheet = document.createElement("style");
styleSheet.textContent = customStyles;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const authHandler = new AuthHandler();

  // Exponer para uso global si es necesario
  window.NutriScanAuth = authHandler;

  authHandler.debug("NutriScan Authentication System initialized", {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });
});
