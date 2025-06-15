/**
 * NutriScan Kids - JavaScript Principal
 * Sistema de gestión nutricional para niños
 */

class NutriScanApp {
  constructor() {
    this.init();
  }

  init() {
    this.initializeEventListeners();
    this.initializeAnimations();
    this.initializeParticleSystem();
    this.initializeObservers();
    this.initializeKeyboardShortcuts();
    this.preloadResources();
    this.registerServiceWorker();

    console.log("🌱 NutriScan Kids - Tema Verde Activado!");
  }

  // ==================== MENU Y NAVEGACIÓN ====================

  initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    if (mobileMenuBtn && sidebar && overlay) {
      mobileMenuBtn.addEventListener("click", () => this.toggleMobileMenu());
      overlay.addEventListener("click", () => this.toggleMobileMenu());
    }
  }

  toggleMobileMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    sidebar?.classList.toggle("-translate-x-full");
    overlay?.classList.toggle("hidden");
    document.body.classList.toggle("overflow-hidden");
  }

  initializeUserDropdown() {
    const userMenuBtn = document.getElementById("user-menu-btn");
    const userDropdown = document.getElementById("user-dropdown");

    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleUserDropdown();
      });

      // Cerrar dropdown al hacer clic fuera
      document.addEventListener("click", (e) => {
        if (
          !userDropdown.contains(e.target) &&
          !userMenuBtn.contains(e.target)
        ) {
          if (!userDropdown.classList.contains("hidden")) {
            this.toggleUserDropdown();
          }
        }
      });
    }
  }

  toggleUserDropdown() {
    const userDropdown = document.getElementById("user-dropdown");

    if (userDropdown.classList.contains("hidden")) {
      userDropdown.classList.remove("hidden");
      setTimeout(() => {
        userDropdown.classList.remove("opacity-0", "scale-95");
        userDropdown.classList.add("opacity-100", "scale-100");
      }, 10);
    } else {
      userDropdown.classList.remove("opacity-100", "scale-100");
      userDropdown.classList.add("opacity-0", "scale-95");
      setTimeout(() => {
        userDropdown.classList.add("hidden");
      }, 300);
    }
  }

  initializeSidebarActiveState() {
    const currentPath = window.location.pathname;
    const sidebarItems = document.querySelectorAll(".menu-item");

    sidebarItems.forEach((item) => {
      if (item.getAttribute("href") === currentPath) {
        item.classList.add(
          "bg-white/20",
          "border-l-4",
          "border-primary",
          "shadow-lg"
        );
        item.querySelector("i")?.classList.add("text-primary", "animate-pulse");
      }
    });
  }

  // ==================== ANIMACIONES ====================

  initializeAnimations() {
    this.addPageLoadAnimations();
    this.addSmoothScrolling();
    this.addMouseParallax();
  }

  addPageLoadAnimations() {
    document.addEventListener("DOMContentLoaded", () => {
      const animatedElements = document.querySelectorAll(".menu-item, .glass");

      animatedElements.forEach((el, index) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";

        setTimeout(() => {
          el.style.transition = "all 0.6s ease-out";
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, index * 100);
      });
    });
  }

  addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });
  }

  addMouseParallax() {
    document.addEventListener("mousemove", (e) => {
      const mouseX = e.clientX / window.innerWidth;
      const mouseY = e.clientY / window.innerHeight;

      const blobs = document.querySelectorAll(".animate-blob");
      blobs.forEach((blob, index) => {
        const speed = (index + 1) * 0.5;
        const x = (mouseX - 0.5) * speed * 50;
        const y = (mouseY - 0.5) * speed * 50;
        blob.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
  }

  // ==================== SISTEMA DE PARTÍCULAS ====================

  initializeParticleSystem() {
    this.addParticleAnimation();
    this.startParticleGeneration();
  }

  addParticleAnimation() {
    const style = document.createElement("style");
    style.textContent = `
            @keyframes particleFloat {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 0.7;
                }
                100% {
                    transform: translateY(-${
                      window.innerHeight + 100
                    }px) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
    document.head.appendChild(style);
  }

  createParticle() {
    const particle = document.createElement("div");
    const size = Math.random() * 6 + 2;
    const colors = ["#22C55E", "#16A34A", "#10B981", "#15803D", "#84CC16"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 5;
            left: ${Math.random() * window.innerWidth}px;
            top: ${window.innerHeight + 10}px;
            opacity: 0.7;
            animation: particleFloat ${3 + Math.random() * 4}s linear forwards;
        `;

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 7000);
  }

  startParticleGeneration() {
    setInterval(() => this.createParticle(), 2000);
  }

  // ==================== FLOATING ACTION BUTTON ====================

  initializeFloatingActionButton() {
    const fab = document.getElementById("fab");

    fab?.addEventListener("click", () => {
      console.log("FAB clicked!");
      this.showNotification("¡Acción rápida activada!", "success");
    });
  }

  // ==================== SISTEMA DE NOTIFICACIONES ====================

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    const colors = {
      success: "from-primary to-accent",
      error: "from-red-500 to-pink-500",
      warning: "from-warning to-primary",
      info: "from-secondary to-success",
    };

    notification.innerHTML = `
            <div class="fixed top-24 right-8 z-50 animate-slide-in-right">
                <div class="bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-check-circle text-xl"></i>
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
    }, 3000);
  }

  // ==================== LOADING OVERLAY ====================

  showLoading() {
    document.getElementById("loading-overlay")?.classList.remove("hidden");
  }

  hideLoading() {
    document.getElementById("loading-overlay")?.classList.add("hidden");
  }

  // ==================== INTERSECTION OBSERVER ====================

  initializeObservers() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in");
        }
      });
    }, observerOptions);

    // Observar todos los elementos con clases de animación
    document.querySelectorAll(".hover-lift, .glass").forEach((el) => {
      observer.observe(el);
    });
  }

  // ==================== ATAJOS DE TECLADO ====================

  initializeKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + K para búsqueda
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }

      // Escape para cerrar menú móvil y dropdown
      if (e.key === "Escape") {
        const sidebar = document.getElementById("sidebar");
        const userDropdown = document.getElementById("user-dropdown");

        if (sidebar && !sidebar.classList.contains("-translate-x-full")) {
          this.toggleMobileMenu();
        }
        if (userDropdown && !userDropdown.classList.contains("hidden")) {
          this.toggleUserDropdown();
        }
      }
    });
  }

  // ==================== UTILIDADES ====================

  getDynamicGreeting() {
    const currentHour = new Date().getHours();

    if (currentHour < 12) return "Buenos días";
    else if (currentHour < 18) return "Buenas tardes";
    else return "Buenas noches";
  }

  // ==================== OPTIMIZACIONES DE RENDIMIENTO ====================

  preloadResources() {
    const preloadLinks = ["/dashboard/", "/analisis/", "/recursos/"];

    preloadLinks.forEach((link) => {
      const preloadLink = document.createElement("link");
      preloadLink.rel = "prefetch";
      preloadLink.href = link;
      document.head.appendChild(preloadLink);
    });
  }

  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => console.log("SW registered"))
          .catch((error) => console.log("SW registration failed"));
      });
    }
  }

  // ==================== INICIALIZACIÓN DE EVENTOS ====================

  initializeEventListeners() {
    // Esperar a que el DOM esté cargado
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.bindEvents();
      });
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    this.initializeMobileMenu();
    this.initializeUserDropdown();
    this.initializeSidebarActiveState();
    this.initializeFloatingActionButton();
  }
}

// ==================== INICIALIZACIÓN GLOBAL ====================

// Configuración de Tailwind CSS
if (typeof tailwind !== "undefined") {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: "#22C55E",
          secondary: "#16A34A",
          accent: "#10B981",
          success: "#15803D",
          warning: "#84CC16",
          dark: "#14532D",
          light: "#F0FDF4",
          neutral: "#F8FAFC",
        },
        fontFamily: {
          display: ["Inter", "system-ui", "sans-serif"],
        },
        animation: {
          float: "float 6s ease-in-out infinite",
          glow: "glow 2s ease-in-out infinite alternate",
          "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          "bounce-slow": "bounce 3s infinite",
          wiggle: "wiggle 1s ease-in-out infinite",
          "slide-up": "slideUp 0.5s ease-out",
          "slide-in-right": "slideInRight 0.6s ease-out",
          "fade-in": "fadeIn 0.8s ease-out",
          "scale-in": "scaleIn 0.4s ease-out",
          "rotate-slow": "rotate 20s linear infinite",
          "gradient-x": "gradient-x 15s ease infinite",
          "gradient-y": "gradient-y 15s ease infinite",
          "gradient-xy": "gradient-xy 15s ease infinite",
          shimmer: "shimmer 2.5s linear infinite",
          morph: "morph 8s ease-in-out infinite",
          blob: "blob 7s infinite",
        },
        backdropBlur: {
          xs: "2px",
          xl: "24px",
        },
        boxShadow: {
          glow: "0 0 20px rgba(34, 197, 94, 0.3)",
          "glow-lg": "0 0 40px rgba(34, 197, 94, 0.4)",
          "inner-glow": "inset 0 0 20px rgba(34, 197, 94, 0.1)",
          neumorphism: "20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff",
          "neumorphism-inset":
            "inset 20px 20px 60px #d1d9e6, inset -20px -20px 60px #ffffff",
        },
      },
    },
  };
}

// Inicializar la aplicación cuando la página esté lista
let nutriscanApp;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    nutriscanApp = new NutriScanApp();
  });
} else {
  nutriscanApp = new NutriScanApp();
}

// Exportar para uso global
window.NutriScanApp = NutriScanApp;
