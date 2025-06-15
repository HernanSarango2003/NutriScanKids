/**
 * NutriScan Kids - Animation Manager (Tema Verde)
 * Maneja todas las animaciones avanzadas y efectos visuales
 */

class AnimationManager {
  constructor() {
    this.animationQueue = [];
    this.isAnimating = false;
    this.observers = new Map();

    this.init();
  }

  /**
   * Inicializa el gestor de animaciones
   */
  init() {
    this.setupIntersectionObservers();
    this.setupScrollAnimations();
    this.setupParallaxEffects();
    this.setupMorphingEffects();
    this.setupFloatingElements();
    this.setupGlowEffects();
  }

  /**
   * Configura observadores de intersección para animaciones
   */
  setupIntersectionObservers() {
    // Observer para elementos que aparecen desde abajo
    const slideUpObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !entry.target.classList.contains("animate-slide-up")
          ) {
            this.animateSlideUp(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observer para elementos que se escalan
    const scaleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateScaleIn(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    // Observer para elementos que se desvanecen
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateFadeIn(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    // Aplicar observers a elementos específicos
    document.querySelectorAll(".feature-card").forEach((el, index) => {
      el.style.animationDelay = `${index * 0.15}s`;
      slideUpObserver.observe(el);
    });

    document.querySelectorAll(".auth-forms").forEach((el) => {
      scaleObserver.observe(el);
    });

    document.querySelectorAll(".auth-info").forEach((el) => {
      fadeObserver.observe(el);
    });

    // Guardar referencias
    this.observers.set("slideUp", slideUpObserver);
    this.observers.set("scale", scaleObserver);
    this.observers.set("fade", fadeObserver);
  }

  /**
   * Configura animaciones de scroll
   */
  setupScrollAnimations() {
    let ticking = false;
    let lastScrollY = window.scrollY;

    const updateScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > lastScrollY ? "down" : "up";
      const scrollProgress = Math.min(currentScrollY / window.innerHeight, 1);

      // Efecto parallax en el fondo
      this.updateParallaxBackground(scrollProgress);

      // Efecto de desplazamiento en elementos
      this.updateScrollElements(scrollProgress, scrollDirection);

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const requestScrollUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  }

  /**
   * Actualiza el fondo parallax
   */
  updateParallaxBackground(progress) {
    const particles = document.getElementById("particles-container");
    if (particles) {
      const translateY = progress * 20;
      particles.style.transform = `translateY(${translateY}px)`;
    }
  }

  /**
   * Actualiza elementos durante el scroll
   */
  updateScrollElements(progress, direction) {
    // Efecto en las características
    const featureCards = document.querySelectorAll(".feature-card");
    featureCards.forEach((card, index) => {
      const offset = progress * 30 + index * 5;
      card.style.transform = `translateY(${offset}px) perspective(1000px) rotateX(${
        progress * 2
      }deg)`;
    });

    // Efecto en el panel de autenticación
    const authPanel = document.querySelector(".bg-white\\/90.backdrop-blur-xl");
    if (authPanel) {
      const scale = 1 - progress * 0.02;
      authPanel.style.transform = `scale(${scale})`;
    }
  }

  /**
   * Configura efectos parallax
   */
  setupParallaxEffects() {
    const parallaxElements = document.querySelectorAll("[data-parallax]");

    parallaxElements.forEach((element) => {
      const speed = element.dataset.parallax || 0.5;

      const updateParallax = () => {
        const rect = element.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * -speed;

        element.style.transform = `translate3d(0, ${rate}px, 0)`;
      };

      window.addEventListener("scroll", updateParallax, { passive: true });
    });
  }

  /**
   * Configura efectos de morphing
   */
  setupMorphingEffects() {
    // Morphing en botones
    const buttons = document.querySelectorAll("button, .btn");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", () => {
        this.morphButton(button, "hover");
      });

      button.addEventListener("mouseleave", () => {
        this.morphButton(button, "normal");
      });

      button.addEventListener("mousedown", () => {
        this.morphButton(button, "active");
      });

      button.addEventListener("mouseup", () => {
        this.morphButton(button, "hover");
      });
    });

    // Morphing en campos de entrada
    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        this.morphInput(input, "focus");
      });

      input.addEventListener("blur", () => {
        this.morphInput(input, "blur");
      });
    });
  }

  /**
   * Aplica morphing a botones
   */
  morphButton(button, state) {
    button.style.transition = "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";

    switch (state) {
      case "hover":
        button.style.transform = "scale(1.05) translateY(-2px)";
        button.style.filter = "brightness(1.1)";
        break;
      case "active":
        button.style.transform = "scale(0.98) translateY(0px)";
        button.style.filter = "brightness(0.9)";
        break;
      case "normal":
        button.style.transform = "scale(1) translateY(0px)";
        button.style.filter = "brightness(1)";
        break;
    }
  }

  /**
   * Aplica morphing a inputs
   */
  morphInput(input, state) {
    const parent = input.closest(".form-group");

    if (state === "focus") {
      input.style.transform = "scale(1.02)";
      input.style.boxShadow = "0 0 20px rgba(34, 197, 94, 0.3)";
      if (parent) {
        parent.style.transform = "translateY(-2px)";
      }
    } else {
      input.style.transform = "scale(1)";
      input.style.boxShadow = "none";
      if (parent) {
        parent.style.transform = "translateY(0px)";
      }
    }
  }

  /**
   * Configura elementos flotantes
   */
  setupFloatingElements() {
    const floatingElements = document.querySelectorAll(".feature-icon");

    floatingElements.forEach((element, index) => {
      const delay = index * 0.5;
      const duration = 3 + index * 0.5;

      element.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
    });

    // Agregar efecto de flotación a iconos sociales
    const socialIcons = document.querySelectorAll(".social-btn i");
    socialIcons.forEach((icon, index) => {
      icon.style.animation = `float ${2 + index * 0.3}s ease-in-out ${
        index * 0.2
      }s infinite`;
    });
  }

  /**
   * Configura efectos de brillo
   */
  setupGlowEffects() {
    // Efecto de brillo en elementos importantes
    const glowElements = document.querySelectorAll(".animate-glow");

    glowElements.forEach((element) => {
      this.addGlowEffect(element);
    });

    // Efecto de brillo interactivo
    const interactiveElements = document.querySelectorAll(
      ".feature-card, .social-btn"
    );
    interactiveElements.forEach((element) => {
      element.addEventListener("mouseenter", () => {
        this.addInteractiveGlow(element);
      });

      element.addEventListener("mouseleave", () => {
        this.removeInteractiveGlow(element);
      });
    });
  }

  /**
   * Agrega efecto de brillo
   */
  addGlowEffect(element) {
    element.style.animation = "glow 2s ease-in-out infinite alternate";
  }

  /**
   * Agrega brillo interactivo - Actualizado para tema verde
   */
  addInteractiveGlow(element) {
    element.style.boxShadow = "0 0 30px rgba(34, 197, 94, 0.4)";
    element.style.transition = "box-shadow 0.3s ease";
  }

  /**
   * Remueve brillo interactivo
   */
  removeInteractiveGlow(element) {
    element.style.boxShadow = "";
  }

  /**
   * Animación de deslizamiento hacia arriba
   */
  animateSlideUp(element) {
    element.style.opacity = "0";
    element.style.transform = "translateY(50px)";
    element.style.transition = "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)";

    setTimeout(() => {
      element.style.opacity = "1";
      element.style.transform = "translateY(0px)";
      element.classList.add("animate-slide-up");
    }, 100);
  }

  /**
   * Animación de escalado hacia adentro
   */
  animateScaleIn(element) {
    element.style.opacity = "0";
    element.style.transform = "scale(0.8)";
    element.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";

    setTimeout(() => {
      element.style.opacity = "1";
      element.style.transform = "scale(1)";
    }, 150);
  }

  /**
   * Animación de desvanecimiento
   */
  animateFadeIn(element) {
    element.style.opacity = "0";
    element.style.transition = "opacity 1s ease-out";

    setTimeout(() => {
      element.style.opacity = "1";
    }, 200);
  }

  /**
   * Anima elementos en secuencia
   */
  animateSequence(elements, animationType = "slideUp", delay = 200) {
    elements.forEach((element, index) => {
      setTimeout(() => {
        switch (animationType) {
          case "slideUp":
            this.animateSlideUp(element);
            break;
          case "scaleIn":
            this.animateScaleIn(element);
            break;
          case "fadeIn":
            this.animateFadeIn(element);
            break;
        }
      }, index * delay);
    });
  }

  /**
   * Efecto de pulso en elementos
   */
  addPulseEffect(element, duration = 1000) {
    element.style.animation = `pulse ${duration}ms ease-in-out`;

    setTimeout(() => {
      element.style.animation = "";
    }, duration);
  }

  /**
   * Efecto de vibración
   */
  addShakeEffect(element, duration = 500) {
    element.style.animation = `shake ${duration}ms ease-in-out`;

    setTimeout(() => {
      element.style.animation = "";
    }, duration);
  }

  /**
   * Efecto de rotación
   */
  addRotateEffect(element, degrees = 360, duration = 1000) {
    element.style.transition = `transform ${duration}ms ease-in-out`;
    element.style.transform = `rotate(${degrees}deg)`;

    setTimeout(() => {
      element.style.transform = "rotate(0deg)";
    }, duration);
  }

  /**
   * Limpia todas las animaciones
   */
  clearAllAnimations() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

    // Remover estilos de animación
    const animatedElements = document.querySelectorAll(
      '[style*="animation"], [style*="transform"], [style*="transition"]'
    );
    animatedElements.forEach((element) => {
      element.style.animation = "";
      element.style.transform = "";
      element.style.transition = "";
    });
  }

  /**
   * Obtiene información de rendimiento
   */
  getPerformanceInfo() {
    return {
      activeObservers: this.observers.size,
      animationQueue: this.animationQueue.length,
      isAnimating: this.isAnimating,
      memoryUsage: performance.memory
        ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576),
            total: Math.round(performance.memory.totalJSHeapSize / 1048576),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
          }
        : null,
    };
  }

  /**
   * Optimiza rendimiento basado en el dispositivo
   */
  optimizeForDevice() {
    const isLowEndDevice =
      navigator.hardwareConcurrency <= 2 ||
      navigator.deviceMemory <= 2 ||
      /Android.*(?:4\.[0-3]|[0-3]\.|[0-2]\.)/.test(navigator.userAgent);

    if (isLowEndDevice) {
      // Reducir animaciones para dispositivos de gama baja
      this.disableExpensiveAnimations();
    }
  }

  /**
   * Deshabilita animaciones costosas
   */
  disableExpensiveAnimations() {
    const expensiveAnimations = document.querySelectorAll(
      ".animate-float, .animate-glow"
    );
    expensiveAnimations.forEach((element) => {
      element.style.animation = "none";
    });

    // Deshabilitar parallax
    window.removeEventListener("scroll", this.updateScroll);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const animationManager = new AnimationManager();

  // Optimizar para el dispositivo
  animationManager.optimizeForDevice();

  // Exponer globalmente para debugging
  window.NutriScanAnimations = animationManager;

  // Debug info
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    console.log(
      "[NutriScan Animations] Animation Manager initialized (Tema Verde)",
      animationManager.getPerformanceInfo()
    );
  }
});
