/**
 * NutriScan Kids - Módulo de Análisis Nutricional
 * Funcionalidades específicas para la página de análisis
 */

class NutriScanAnalisis {
  constructor() {
    this.elements = {};
    this.init();
  }

  init() {
    this.initializeElements();
    this.initializeEventListeners();
    this.initializeEnhancements();
  }

  // ==================== INICIALIZACIÓN DE ELEMENTOS ====================

  initializeElements() {
    this.elements = {
      dropZone: document.getElementById("drop-zone"),
      fileInput: document.getElementById("imagen"),
      imagePreview: document.getElementById("image-preview"),
      previewImg: document.getElementById("preview-img"),
      removeBtn: document.getElementById("remove-image"),
      form: document.getElementById("analisis-form"),
      submitBtn: document.getElementById("submit-btn"),
      submitText: document.getElementById("submit-text"),
      loadingModal: document.getElementById("loading-modal"),
      progressBar: document.getElementById("progress-bar"),
      analysisStep: document.getElementById("analysis-step"),
      edadInput: document.getElementById("edad_meses"),
    };
  }

  // ==================== EVENT LISTENERS ====================

  initializeEventListeners() {
    this.initializeDragAndDrop();
    this.initializeFileHandling();
    this.initializeFormSubmission();
    this.initializeAgeCalculator();
  }

  initializeDragAndDrop() {
    const { dropZone, fileInput } = this.elements;

    if (!dropZone || !fileInput) return;

    // Prevenir comportamientos por defecto
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    // Efectos visuales de drag
    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(
        eventName,
        () => this.highlightDropZone(),
        false
      );
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(
        eventName,
        () => this.unhighlightDropZone(),
        false
      );
    });

    // Eventos principales
    dropZone.addEventListener("drop", (e) => this.handleDrop(e), false);
    dropZone.addEventListener("click", () => fileInput.click());
  }

  initializeFileHandling() {
    const { fileInput, removeBtn } = this.elements;

    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", () => this.removeImage());
    }
  }

  initializeFormSubmission() {
    const { form } = this.elements;

    if (form) {
      form.addEventListener("submit", (e) => this.handleFormSubmission(e));
    }
  }

  initializeAgeCalculator() {
    const { edadInput } = this.elements;

    if (edadInput) {
      edadInput.addEventListener("input", () => this.calculateAgeDisplay());
    }
  }

  // ==================== DRAG AND DROP FUNCTIONALITY ====================

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  highlightDropZone() {
    const { dropZone } = this.elements;
    dropZone?.classList.add("border-primary", "bg-primary/10");
  }

  unhighlightDropZone() {
    const { dropZone } = this.elements;
    dropZone?.classList.remove("border-primary", "bg-primary/10");
  }

  handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    this.handleFiles(files);
  }

  handleFileSelect(e) {
    const files = e.target.files;
    this.handleFiles(files);
  }

  // ==================== FILE HANDLING ====================

  handleFiles(files) {
    if (files.length > 0) {
      const file = files[0];

      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        this.showNotification(
          "Por favor, selecciona un archivo de imagen válido.",
          "error"
        );
        return;
      }

      // Validar tamaño (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        this.showNotification(
          "El archivo es demasiado grande. Máximo 10MB.",
          "error"
        );
        return;
      }

      this.displayImagePreview(file);
    }
  }

  displayImagePreview(file) {
    const { previewImg, imagePreview } = this.elements;

    if (!previewImg || !imagePreview) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      imagePreview.classList.remove("hidden");
      imagePreview.classList.add("animate-scale-in");
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    const { fileInput, imagePreview } = this.elements;

    if (fileInput) {
      fileInput.value = "";
    }

    if (imagePreview) {
      imagePreview.classList.add("hidden");
      imagePreview.classList.remove("animate-scale-in");
    }
  }

  // ==================== FORM SUBMISSION ====================

  handleFormSubmission(e) {
    e.preventDefault();

    const { fileInput } = this.elements;

    if (!fileInput?.files.length) {
      this.showNotification(
        "Por favor, selecciona una imagen para analizar.",
        "warning"
      );
      return;
    }

    // Mostrar modal de carga
    this.showLoadingModal();

    // Simular progreso del análisis
    this.simulateAnalysis();

    // En implementación real, aquí se enviaría el formulario
    setTimeout(() => {
      this.hideLoadingModal();
      this.showNotification("¡Análisis completado exitosamente!", "success");

      // Redirigir a página de resultados
      setTimeout(() => {
        console.log("Redirecting to results page...");
        // window.location.href = "{% url 'resultados' %}";
      }, 2000);
    }, 8000);
  }

  // ==================== LOADING MODAL ====================

  showLoadingModal() {
    const { loadingModal } = this.elements;

    if (loadingModal) {
      loadingModal.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
    }
  }

  hideLoadingModal() {
    const { loadingModal } = this.elements;

    if (loadingModal) {
      loadingModal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    }
  }

  simulateAnalysis() {
    const steps = [
      "Inicializando análisis...",
      "Procesando imagen...",
      "Detectando características corporales...",
      "Evaluando estado nutricional...",
      "Generando recomendaciones...",
      "Finalizando análisis...",
    ];

    const { progressBar, analysisStep } = this.elements;
    let currentStep = 0;
    const totalSteps = steps.length;

    const interval = setInterval(() => {
      const progress = ((currentStep + 1) / totalSteps) * 100;

      if (progressBar) {
        progressBar.style.width = progress + "%";
      }

      if (analysisStep) {
        analysisStep.textContent = steps[currentStep];
      }

      currentStep++;

      if (currentStep >= totalSteps) {
        clearInterval(interval);
      }
    }, 1200);
  }

  // ==================== UTILIDADES ====================

  calculateAgeDisplay() {
    const { edadInput } = this.elements;

    if (!edadInput) return;

    const meses = parseInt(edadInput.value);

    if (meses >= 12) {
      const años = Math.floor(meses / 12);
      const mesesRestantes = meses % 12;
      let ageText = `${años} año${años > 1 ? "s" : ""}`;

      if (mesesRestantes > 0) {
        ageText += ` y ${mesesRestantes} mes${mesesRestantes > 1 ? "es" : ""}`;
      }

      console.log(`Edad: ${ageText}`);
      // Aquí podrías mostrar este texto en un elemento de ayuda
    }
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    const colors = {
      success: "from-primary to-accent",
      error: "from-red-500 to-pink-500",
      warning: "from-warning to-primary",
      info: "from-secondary to-accent",
    };

    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-triangle",
      warning: "fa-exclamation-circle",
      info: "fa-info-circle",
    };

    notification.innerHTML = `
            <div class="fixed top-24 right-8 z-50 animate-slide-in-right">
                <div class="bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm max-w-sm">
                    <div class="flex items-center space-x-3">
                        <i class="fas ${icons[type]} text-xl"></i>
                        <span class="font-semibold">${message}</span>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // ==================== EFECTOS VERDES MEJORADOS ====================

  initializeEnhancements() {
    this.addGreenEffects();
  }

  addGreenEffects() {
    // Efectos de partículas verdes en hover
    this.addCardHoverEffects();

    // Efecto de crecimiento orgánico en botón principal
    this.addSubmitButtonEffects();

    // Efecto de floración al completar análisis
    this.addFormSubmissionEffects();
  }

  addCardHoverEffects() {
    const cards = document.querySelectorAll(".glass");

    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        if (window.NutriScanParticles) {
          const rect = card.getBoundingClientRect();
          window.NutriScanParticles.system.addParticlesAt(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            3
          );
        }
      });
    });
  }

  addSubmitButtonEffects() {
    const { submitBtn } = this.elements;

    if (!submitBtn) return;

    submitBtn.addEventListener("mouseenter", () => {
      if (window.NutriScanParticles && Math.random() < 0.5) {
        const rect = submitBtn.getBoundingClientRect();
        window.NutriScanParticles.effects.organicGrowth(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          40
        );
      }
    });
  }

  addFormSubmissionEffects() {
    const { form, submitBtn } = this.elements;

    if (!form || !submitBtn) return;

    form.addEventListener("submit", () => {
      if (window.NutriScanParticles) {
        const rect = submitBtn.getBoundingClientRect();
        window.NutriScanParticles.effects.bloomEffect(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          6
        );
      }
    });
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  /**
   * Reinicia el formulario a su estado inicial
   */
  resetForm() {
    const { form } = this.elements;

    if (form) {
      form.reset();
      this.removeImage();
    }
  }

  /**
   * Valida que todos los campos requeridos estén completos
   */
  validateForm() {
    const { fileInput } = this.elements;
    const requiredFields = ["nombre_paciente", "edad_meses", "genero"];

    let isValid = true;
    const errors = [];

    // Verificar imagen
    if (!fileInput?.files.length) {
      isValid = false;
      errors.push("Imagen requerida");
    }

    // Verificar campos requeridos
    requiredFields.forEach((fieldName) => {
      const field = document.getElementById(fieldName);
      if (!field?.value.trim()) {
        isValid = false;
        errors.push(`Campo ${fieldName} requerido`);
      }
    });

    return {
      isValid,
      errors,
    };
  }

  /**
   * Establece el estado de carga del formulario
   */
  setLoadingState(isLoading) {
    const { submitBtn, submitText } = this.elements;

    if (!submitBtn || !submitText) return;

    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-50", "cursor-not-allowed");
      submitText.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
      submitText.innerHTML =
        '<i class="fas fa-brain mr-3"></i>Iniciar Análisis Nutricional';
    }
  }
}

// ==================== INICIALIZACIÓN ====================

let nutriscanAnalisis;

function initializeAnalisis() {
  nutriscanAnalisis = new NutriScanAnalisis();

  // Inicializar efectos verdes cuando el sistema de partículas esté listo
  if (window.NutriScanParticles) {
    nutriscanAnalisis.addGreenEffects();
  } else {
    // Esperar a que se cargue el sistema de partículas
    document.addEventListener("particlesReady", () => {
      nutriscanAnalisis.addGreenEffects();
    });
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAnalisis);
} else {
  initializeAnalisis();
}

// Exportar para uso global
window.NutriScanAnalisis = NutriScanAnalisis;
window.nutriscanAnalisis = nutriscanAnalisis;
