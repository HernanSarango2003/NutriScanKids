/**
 * NutriScan Kids - Register Handler
 * Maneja la funcionalidad específica del registro de usuarios
 */

class RegisterHandler {
  constructor() {
    this.validators = {
      first_name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/,
        messages: {
          required: "El nombre es requerido",
          minLength: "El nombre debe tener al menos 2 caracteres",
          maxLength: "El nombre no puede exceder 50 caracteres",
          pattern: "El nombre solo puede contener letras y espacios",
        },
      },
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
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        messages: {
          required: "El correo electrónico es requerido",
          pattern: "Ingrese un correo electrónico válido",
        },
      },
      password1: {
        required: true,
        minLength: 8,
        maxLength: 128,
        messages: {
          required: "La contraseña es requerida",
          minLength: "La contraseña debe tener al menos 8 caracteres",
          maxLength: "La contraseña no puede exceder 128 caracteres",
        },
      },
      password2: {
        required: true,
        messages: {
          required: "Debe confirmar su contraseña",
          match: "Las contraseñas no coinciden",
        },
      },
    };

    this.passwordStrengthConfig = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
    };

    this.init();
  }

  /**
   * Inicializa el handler de registro
   */
  init() {
    this.setupEventListeners();
    this.setupPasswordToggle();
    this.setupPasswordStrength();
    this.setupFormValidation();
    this.setupTabNavigation();
    this.setupAccessibility();
    this.initializeAnimations();
  }

  /**
   * Configura todos los event listeners
   */
  setupEventListeners() {
    const form = document.getElementById("register-form");
    if (form) {
      form.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }

    // Validación en tiempo real para cada campo
    Object.keys(this.validators).forEach((fieldName) => {
      const input = document.getElementById(`id_${fieldName}`);
      if (input) {
        input.addEventListener("input", () => this.validateField(fieldName));
        input.addEventListener("blur", () => this.validateField(fieldName));
        input.addEventListener("focus", () => this.clearFieldError(fieldName));
      }
    });

    // Listener especial para confirmación de contraseña
    const password2Input = document.getElementById("id_password2");
    if (password2Input) {
      password2Input.addEventListener("input", () =>
        this.validatePasswordMatch()
      );
      password2Input.addEventListener("blur", () =>
        this.validatePasswordMatch()
      );
    }

    // Checkbox de términos y condiciones
    const termsCheckbox = document.getElementById("terms-checkbox");
    if (termsCheckbox) {
      termsCheckbox.addEventListener("change", () => this.validateTerms());
    }
  }

  /**
   * Configura el toggle de contraseña
   */
  setupPasswordToggle() {
    const toggleBtn = document.getElementById("toggle-password");
    const passwordInput = document.getElementById("id_password1");
    const passwordIcon = document.getElementById("password-icon");

    if (toggleBtn && passwordInput && passwordIcon) {
      toggleBtn.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";

        passwordInput.type = isPassword ? "text" : "password";

        passwordIcon.style.transform = "scale(0)";
        setTimeout(() => {
          passwordIcon.className = isPassword
            ? "fas fa-eye-slash"
            : "fas fa-eye";
          passwordIcon.style.transform = "scale(1)";
        }, 150);

        toggleBtn.classList.add("animate-pulse");
        setTimeout(() => toggleBtn.classList.remove("animate-pulse"), 300);
      });
    }
  }

  /**
   * Configura el indicador de fortaleza de contraseña
   */
  setupPasswordStrength() {
    const passwordInput = document.getElementById("id_password1");
    const strengthIndicator = document.getElementById("password-strength");
    const strengthBar = document.getElementById("strength-bar");
    const strengthText = document.getElementById("strength-text");

    if (passwordInput && strengthIndicator) {
      passwordInput.addEventListener("input", () => {
        const password = passwordInput.value;

        if (password.length > 0) {
          strengthIndicator.classList.remove("hidden");
          const strength = this.calculatePasswordStrength(password);
          this.updatePasswordStrengthUI(strength, strengthBar, strengthText);
        } else {
          strengthIndicator.classList.add("hidden");
        }
      });

      passwordInput.addEventListener("focus", () => {
        if (passwordInput.value.length > 0) {
          strengthIndicator.classList.remove("hidden");
        }
      });
    }
  }

  /**
   * Calcula la fortaleza de la contraseña
   */
  calculatePasswordStrength(password) {
    const checks = {
      length: password.length >= this.passwordStrengthConfig.minLength,
      uppercase: this.passwordStrengthConfig.requireUppercase
        ? /[A-Z]/.test(password)
        : true,
      lowercase: this.passwordStrengthConfig.requireLowercase
        ? /[a-z]/.test(password)
        : true,
      numbers: this.passwordStrengthConfig.requireNumbers
        ? /\d/.test(password)
        : true,
      symbols: this.passwordStrengthConfig.requireSymbols
        ? /[^a-zA-Z0-9]/.test(password)
        : true,
    };

    const score = Object.values(checks).filter(Boolean).length;
    const maxScore = Object.keys(checks).length;
    const percentage = (score / maxScore) * 100;

    let level = "weak";
    if (percentage >= 80) level = "strong";
    else if (percentage >= 50) level = "medium";

    return {
      score,
      maxScore,
      percentage,
      level,
      checks,
    };
  }

  /**
   * Actualiza la UI del indicador de fortaleza
   */
  updatePasswordStrengthUI(strength, strengthBar, strengthText) {
    const colors = {
      weak: "bg-red-500",
      medium: "bg-yellow-500",
      strong: "bg-green-500",
    };

    const texts = {
      weak: "Débil",
      medium: "Media",
      strong: "Fuerte",
    };

    if (strengthBar) {
      strengthBar.className = `h-2 rounded-full transition-all duration-300 ${
        colors[strength.level]
      }`;
      strengthBar.style.width = `${strength.percentage}%`;
    }

    if (strengthText) {
      strengthText.textContent = texts[strength.level];
      strengthText.className = `text-xs ${
        strength.level === "weak"
          ? "text-red-400"
          : strength.level === "medium"
          ? "text-yellow-400"
          : "text-green-400"
      }`;
    }

    // Actualizar indicadores de requisitos
    this.updatePasswordRequirements(strength.checks);
  }

  /**
   * Actualiza los indicadores de requisitos de contraseña
   */
  updatePasswordRequirements(checks) {
    const requirements = document.querySelectorAll(".requirement");
    const checkKeys = Object.keys(checks);

    requirements.forEach((req, index) => {
      const requirement = req.dataset.requirement;
      const icon = req.querySelector("i");
      const text = req.querySelector("span");

      if (checks[requirement]) {
        icon.className = "fas fa-check-circle text-green-400";
        text.classList.remove("text-white/60");
        text.classList.add("text-green-400");
      } else {
        icon.className = "fas fa-circle text-white/30";
        text.classList.remove("text-green-400");
        text.classList.add("text-white/60");
      }
    });
  }

  /**
   * Configura la validación del formulario
   */
  setupFormValidation() {
    const form = document.getElementById("register-form");
    if (form) {
      form.setAttribute("novalidate", "true");
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
   * Valida que las contraseñas coincidan
   */
  validatePasswordMatch() {
    const password = document.getElementById("id_password1").value;
    const password2 = document.getElementById("id_password2").value;
    const statusIcon = document.getElementById("password2-status");

    if (password2.length === 0) {
      statusIcon.className = "fas fa-circle text-white/30";
      this.clearFieldError("password2");
      return false;
    }

    if (password === password2) {
      statusIcon.className = "fas fa-check-circle text-green-400";
      this.showFieldSuccess("password2");
      return true;
    } else {
      statusIcon.className = "fas fa-times-circle text-red-400";
      this.showFieldError(
        "password2",
        this.validators.password2.messages.match
      );
      return false;
    }
  }

  /**
   * Valida los términos y condiciones
   */
  validateTerms() {
    const checkbox = document.getElementById("terms-checkbox");
    const submitBtn = document.getElementById("submit-btn");

    if (checkbox && submitBtn) {
      if (checkbox.checked) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
      } else {
        submitBtn.disabled = true;
        submitBtn.classList.add("opacity-50", "cursor-not-allowed");
      }
    }
  }

  /**
   * Muestra error en un campo
   */
  // (Duplicated, incomplete definition removed)

  /**
   * Muestra error en un campo
   */
  showFieldError(fieldName, message) {
    const input = document.getElementById(`id_${fieldName}`);
    const errorDiv = input.closest(".form-group").querySelector(".field-error");

    if (input && errorDiv) {
      input.classList.add("border-red-500", "bg-red-500/10");
      input.classList.remove("border-green-500", "bg-green-500/10");

      errorDiv.querySelector("span").textContent = message;
      errorDiv.classList.remove("hidden");
      errorDiv.classList.add("animate-slide-down");

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
      input.classList.add("border-green-500", "bg-green-500/10");
      input.classList.remove("border-red-500", "bg-red-500/10");

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
    const termsCheckbox = document.getElementById("terms-checkbox");

    // Validar términos y condiciones
    if (!termsCheckbox.checked) {
      this.showNotification(
        "Debe aceptar los términos y condiciones para continuar",
        "error"
      );
      termsCheckbox.focus();
      return;
    }

    // Validar todos los campos
    const validations = {
      first_name: this.validateField("first_name"),
      username: this.validateField("username"),
      email: this.validateField("email"),
      password: this.validateField("password1"),
      password2: this.validatePasswordMatch(),
    };

    const allValid = Object.values(validations).every(Boolean);

    if (!allValid) {
      this.showNotification(
        "Por favor, corrija los errores antes de continuar",
        "error"
      );
      this.shakeForm();
      return;
    }

    // Verificar fortaleza de contraseña
    const password = document.getElementById("id_password1").value;
    const strength = this.calculatePasswordStrength(password);

    if (strength.level === "weak") {
      this.showNotification(
        "Por favor, elija una contraseña más segura",
        "warning"
      );
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
    }, 1000);

    // Timeout de seguridad
    setTimeout(() => {
      this.setLoadingState(false);
      if (submitBtn && btnText && btnLoading) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
        btnText.classList.remove("hidden");
        btnLoading.classList.add("hidden");
      }
    }, 15000);
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
          this.navigateWithEffect(loginTab.href);
        }
      });
    }

    if (registerTab) {
      registerTab.addEventListener("click", (e) => {
        if (registerTab.href !== window.location.href) {
          e.preventDefault();
          this.navigateWithEffect(registerTab.href);
        }
      });
    }
  }

  /**
   * Navega con efecto de transición
   */
  navigateWithEffect(url) {
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
   * Configura accesibilidad
   */
  setupAccessibility() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const focused = document.activeElement;
        if (focused && focused.classList.contains("tab")) {
          focused.click();
        }
      }

      if (e.key === "Escape") {
        this.closeAllNotifications();
      }
    });

    const tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute(
        "aria-selected",
        tab.classList.contains("text-primary-400") ? "true" : "false"
      );
    });

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
    const featureCards = document.querySelectorAll(".feature-card");
    featureCards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.2}s`;
    });

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

    const elementsToAnimate = document.querySelectorAll(".feature-card");
    elementsToAnimate.forEach((el) => observer.observe(el));
  }

  /**
   * Efecto de vibración en el formulario
   */
  shakeForm() {
    const form = document.getElementById("register-form");
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

      const overlay = document.createElement("div");
      overlay.id = "loading-overlay";
      overlay.className =
        "fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center";
      overlay.innerHTML = `
                <div class="bg-white/10 backdrop-blur-xl rounded-2xl p-6 flex items-center space-x-3">
                    <i class="fas fa-spinner fa-spin text-primary-400 text-xl"></i>
                    <span class="text-white">Creando su cuenta...</span>
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

    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);

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
   * Verificación de disponibilidad de usuario/email
   */
  async checkAvailability(fieldName, value) {
    // Simulación de verificación async (reemplazar con API real)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulamos algunos valores no disponibles
        const unavailable = {
          username: ["admin", "user", "test", "demo"],
          email: ["test@test.com", "admin@admin.com"],
        };

        const isAvailable = !unavailable[fieldName]?.includes(
          value.toLowerCase()
        );
        resolve(isAvailable);
      }, 800);
    });
  }

  /**
   * Validación avanzada con verificación de disponibilidad
   */
  async validateFieldAdvanced(fieldName) {
    const basicValidation = this.validateField(fieldName);

    if (!basicValidation) return false;

    if (fieldName === "username" || fieldName === "email") {
      const input = document.getElementById(`id_${fieldName}`);
      const value = input.value.trim();

      if (value) {
        // Mostrar indicador de verificación
        this.showFieldChecking(fieldName);

        try {
          const isAvailable = await this.checkAvailability(fieldName, value);

          if (isAvailable) {
            this.showFieldSuccess(fieldName);
            return true;
          } else {
            const message =
              fieldName === "username"
                ? "Este nombre de usuario no está disponible"
                : "Este correo electrónico ya está registrado";
            this.showFieldError(fieldName, message);
            return false;
          }
        } catch (error) {
          console.error("Error checking availability:", error);
          return basicValidation;
        }
      }
    }

    return basicValidation;
  }

  /**
   * Muestra indicador de verificación
   */
  showFieldChecking(fieldName) {
    const input = document.getElementById(`id_${fieldName}`);
    if (input) {
      input.classList.remove(
        "border-red-500",
        "bg-red-500/10",
        "border-green-500",
        "bg-green-500/10"
      );
      input.classList.add("border-yellow-500", "bg-yellow-500/10");

      // Agregar spinner temporal
      const parent = input.parentElement;
      const existingIcon = parent.querySelector(".absolute i");
      if (existingIcon) {
        existingIcon.className = "fas fa-spinner fa-spin text-yellow-400";
      }
    }
  }

  /**
   * Utilidades de debug
   */
  debug(message, data = null) {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.log(`[NutriScan Register] ${message}`, data);
    }
  }

  /**
   * Obtiene estadísticas de validación
   */
  getValidationStats() {
    const fields = Object.keys(this.validators);
    const stats = {};

    fields.forEach((field) => {
      const input = document.getElementById(`id_${field}`);
      if (input) {
        stats[field] = {
          hasValue: input.value.trim() !== "",
          isValid: this.validateField(field),
          length: input.value.length,
        };
      }
    });

    return stats;
  }
}

// CSS personalizado para animaciones adicionales
const customStyles = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }

    .requirement.met i {
        color: #10b981 !important;
    }

    .requirement.met span {
        color: #10b981 !important;
    }

    .password-strength-weak .strength-bar {
        background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
    }

    .password-strength-medium .strength-bar {
        background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
    }

    .password-strength-strong .strength-bar {
        background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
    }

    .form-group:focus-within {
        transform: translateY(-2px);
    }
`;

// Inyectar estilos personalizados
const styleSheet = document.createElement("style");
styleSheet.textContent = customStyles;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const registerHandler = new RegisterHandler();

  // Exponer para uso global si es necesario
  window.NutriScanRegister = registerHandler;

  registerHandler.debug("NutriScan Registration System initialized", {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });

  // Configurar manejo de errores globales específico para registro
  window.addEventListener("error", (e) => {
    registerHandler.debug("JavaScript Error during registration:", {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    });
  });
});
