/**
 * NutriScan Kids - Particles System (Tema Verde)
 * Sistema de partículas animadas para el fondo
 */

class ParticleSystem {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.mouse = { x: 0, y: 0 };
    this.config = {
      particleCount: this.getOptimalParticleCount(),
      particleSize: { min: 1, max: 3 },
      particleSpeed: { min: 0.1, max: 0.8 },
      particleOpacity: { min: 0.1, max: 0.6 },
      connectionDistance: 120,
      mouseInteractionRadius: 150,
      colors: [
        "rgba(34, 197, 94, 0.6)", // primary-500
        "rgba(22, 163, 74, 0.6)", // primary-600
        "rgba(16, 185, 129, 0.6)", // accent-500
        "rgba(21, 128, 61, 0.6)", // secondary-700
        "rgba(132, 204, 22, 0.6)", // lime-500
        "rgba(74, 222, 128, 0.6)", // green-400
        "rgba(52, 211, 153, 0.6)", // emerald-400
      ],
    };

    this.init();
  }

  /**
   * Inicializa el sistema de partículas
   */
  init() {
    this.createCanvas();
    this.createParticles();
    this.setupEventListeners();
    this.startAnimation();
  }

  /**
   * Obtiene el número óptimo de partículas según el dispositivo
   */
  getOptimalParticleCount() {
    const isMobile = window.innerWidth < 768;
    const isLowEnd = navigator.hardwareConcurrency <= 2;

    if (isMobile || isLowEnd) return 30;
    if (window.innerWidth < 1200) return 50;
    return 80;
  }

  /**
   * Crea el canvas para las partículas
   */
  createCanvas() {
    const container = document.getElementById("particles-container");
    if (!container) return;

    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "1";

    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    this.resizeCanvas();
  }

  /**
   * Redimensiona el canvas
   */
  resizeCanvas() {
    if (!this.canvas) return;

    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + "px";
    this.canvas.style.height = rect.height + "px";

    this.ctx.scale(dpr, dpr);
  }

  /**
   * Crea las partículas iniciales
   */
  createParticles() {
    this.particles = [];

    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  /**
   * Crea una partícula individual
   */
  createParticle() {
    const rect = this.canvas.getBoundingClientRect();

    return {
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx:
        (Math.random() - 0.5) *
          (this.config.particleSpeed.max - this.config.particleSpeed.min) +
        this.config.particleSpeed.min,
      vy:
        (Math.random() - 0.5) *
          (this.config.particleSpeed.max - this.config.particleSpeed.min) +
        this.config.particleSpeed.min,
      size:
        Math.random() *
          (this.config.particleSize.max - this.config.particleSize.min) +
        this.config.particleSize.min,
      opacity:
        Math.random() *
          (this.config.particleOpacity.max - this.config.particleOpacity.min) +
        this.config.particleOpacity.min,
      color:
        this.config.colors[
          Math.floor(Math.random() * this.config.colors.length)
        ],
      life: Math.random() * 100,
      maxLife: 100,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    };
  }

  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Seguimiento del mouse
    document.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    // Redimensionamiento
    window.addEventListener("resize", () => {
      this.resizeCanvas();
      this.createParticles(); // Recrear partículas para la nueva dimensión
    });

    // Pausa/resume basado en visibilidad
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseAnimation();
      } else {
        this.resumeAnimation();
      }
    });
  }

  /**
   * Actualiza las partículas
   */
  updateParticles() {
    const rect = this.canvas.getBoundingClientRect();

    this.particles.forEach((particle, index) => {
      // Actualizar posición
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Interacción con el mouse
      const mouseDistance = this.getDistance(
        particle.x,
        particle.y,
        this.mouse.x,
        this.mouse.y
      );
      if (mouseDistance < this.config.mouseInteractionRadius) {
        const angle = Math.atan2(
          particle.y - this.mouse.y,
          particle.x - this.mouse.x
        );
        const force =
          (this.config.mouseInteractionRadius - mouseDistance) /
          this.config.mouseInteractionRadius;

        particle.vx += Math.cos(angle) * force * 0.02;
        particle.vy += Math.sin(angle) * force * 0.02;
      }

      // Aplicar fricción
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Límites del canvas con rebote suave
      if (particle.x < 0 || particle.x > rect.width) {
        particle.vx *= -0.8;
        particle.x = Math.max(0, Math.min(rect.width, particle.x));
      }
      if (particle.y < 0 || particle.y > rect.height) {
        particle.vy *= -0.8;
        particle.y = Math.max(0, Math.min(rect.height, particle.y));
      }

      // Efecto de pulsación
      particle.life += particle.pulseSpeed;
      if (particle.life > particle.maxLife) {
        particle.life = 0;
      }

      // Variación de opacidad y tamaño
      const pulseOpacity = Math.sin(particle.life * 0.1) * 0.2;
      particle.currentOpacity = particle.opacity + pulseOpacity;
      particle.currentSize =
        particle.size + Math.sin(particle.life * 0.05) * 0.5;
    });
  }

  /**
   * Dibuja las partículas
   */
  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Dibujar conexiones entre partículas cercanas
    this.drawConnections();

    // Dibujar partículas
    this.particles.forEach((particle) => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.currentOpacity || particle.opacity;
      this.ctx.fillStyle = particle.color;

      // Efecto de brillo verde
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = particle.color;

      this.ctx.beginPath();
      this.ctx.arc(
        particle.x,
        particle.y,
        particle.currentSize || particle.size,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      this.ctx.restore();
    });
  }

  /**
   * Dibuja conexiones entre partículas - Actualizado para tema verde
   */
  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const distance = this.getDistance(p1.x, p1.y, p2.x, p2.y);

        if (distance < this.config.connectionDistance) {
          const opacity =
            (this.config.connectionDistance - distance) /
            this.config.connectionDistance;

          this.ctx.save();
          this.ctx.globalAlpha = opacity * 0.3;
          this.ctx.strokeStyle = "rgba(34, 197, 94, 0.5)"; // Color verde principal
          this.ctx.lineWidth = 1;

          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();

          this.ctx.restore();
        }
      }
    }
  }

  /**
   * Calcula la distancia entre dos puntos
   */
  getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Inicia la animación
   */
  startAnimation() {
    const animate = () => {
      this.updateParticles();
      this.drawParticles();
      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Pausa la animación
   */
  pauseAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Resume la animación
   */
  resumeAnimation() {
    if (!this.animationId) {
      this.startAnimation();
    }
  }

  /**
   * Destruye el sistema de partículas
   */
  destroy() {
    this.pauseAnimation();

    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }

    this.particles = [];
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.createParticles();
  }

  /**
   * Agrega partículas en una posición específica
   */
  addParticlesAt(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const particle = this.createParticle();
      particle.x = x + (Math.random() - 0.5) * 50;
      particle.y = y + (Math.random() - 0.5) * 50;
      particle.vx = (Math.random() - 0.5) * 2;
      particle.vy = (Math.random() - 0.5) * 2;
      particle.opacity = 0.8;

      this.particles.push(particle);

      // Remover partícula después de un tiempo
      setTimeout(() => {
        const index = this.particles.indexOf(particle);
        if (index > -1) {
          this.particles.splice(index, 1);
        }
      }, 3000);
    }
  }

  /**
   * Crea efecto de explosión verde
   */
  createExplosion(x, y, intensity = 1) {
    const particleCount = 20 * intensity;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = Math.random() * 3 + 1;

      const particle = {
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: Math.random() * 3 + 1,
        opacity: 0.8,
        color:
          this.config.colors[
            Math.floor(Math.random() * this.config.colors.length)
          ],
        life: 0,
        maxLife: 60,
        pulseSpeed: 0.1,
      };

      this.particles.push(particle);

      // Remover después de la vida útil
      setTimeout(() => {
        const index = this.particles.indexOf(particle);
        if (index > -1) {
          this.particles.splice(index, 1);
        }
      }, 2000);
    }
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats() {
    return {
      particleCount: this.particles.length,
      fps: this.getFPS(),
      canvasSize: {
        width: this.canvas ? this.canvas.width : 0,
        height: this.canvas ? this.canvas.height : 0,
      },
      isAnimating: !!this.animationId,
    };
  }

  /**
   * Calcula FPS aproximado
   */
  getFPS() {
    if (!this.lastTime) {
      this.lastTime = performance.now();
      this.frameCount = 0;
      return 0;
    }

    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 1000) {
      const fps = (this.frameCount * 1000) / deltaTime;
      this.lastTime = currentTime;
      this.frameCount = 0;
      return Math.round(fps);
    }

    return this.currentFPS || 0;
  }
}

/**
 * Clase para efectos de partículas especiales - Tema Verde
 */
class SpecialEffects {
  constructor(particleSystem) {
    this.particleSystem = particleSystem;
    this.effects = new Map();
  }

  /**
   * Crea efecto de lluvia de hojas (tema verde)
   */
  leafRain(duration = 5000) {
    const effectId = "leafRain_" + Date.now();
    let startTime = Date.now();

    const createLeaves = () => {
      if (Date.now() - startTime > duration) {
        this.effects.delete(effectId);
        return;
      }

      // Crear hoja desde arriba
      const x = Math.random() * window.innerWidth;
      const particle = {
        x: x,
        y: -10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 1.5 + 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        color: "rgba(34, 197, 94, 0.7)", // Verde hoja
        life: 0,
        maxLife: 100,
        pulseSpeed: 0.03,
      };

      this.particleSystem.particles.push(particle);

      // Programar siguiente hoja
      setTimeout(createLeaves, Math.random() * 300 + 150);
    };

    this.effects.set(effectId, createLeaves);
    createLeaves();

    return effectId;
  }

  /**
   * Crea efecto de ondas verdes
   */
  rippleEffect(x, y, maxRadius = 100) {
    const ripples = [];
    const rippleCount = 3;

    for (let i = 0; i < rippleCount; i++) {
      ripples.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: maxRadius,
        opacity: 1 - i * 0.3,
        speed: 2 + i * 0.5,
        delay: i * 200,
      });
    }

    const animateRipples = () => {
      const canvas = this.particleSystem.canvas;
      const ctx = this.particleSystem.ctx;

      if (!canvas || !ctx) return;

      ripples.forEach((ripple, index) => {
        if (ripple.delay > 0) {
          ripple.delay -= 16; // ~60fps
          return;
        }

        ripple.radius += ripple.speed;
        ripple.opacity = 1 - ripple.radius / ripple.maxRadius;

        if (ripple.radius < ripple.maxRadius) {
          ctx.save();
          ctx.globalAlpha = ripple.opacity;
          ctx.strokeStyle = "rgba(34, 197, 94, 0.6)"; // Verde principal
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          requestAnimationFrame(animateRipples);
        } else {
          ripples.splice(index, 1);
        }
      });
    };

    animateRipples();
  }

  /**
   * Efecto de crecimiento orgánico (tema verde)
   */
  organicGrowth(x, y, maxSize = 50) {
    const branches = [];
    const branchCount = 8;

    for (let i = 0; i < branchCount; i++) {
      const angle = (Math.PI * 2 * i) / branchCount;
      branches.push({
        x: x,
        y: y,
        angle: angle,
        length: 0,
        maxLength: Math.random() * maxSize + 20,
        speed: Math.random() * 2 + 1,
        thickness: Math.random() * 3 + 1,
        opacity: 0.8,
      });
    }

    const animateBranches = () => {
      const canvas = this.particleSystem.canvas;
      const ctx = this.particleSystem.ctx;

      if (!canvas || !ctx) return;

      let activeBranches = 0;

      branches.forEach((branch) => {
        if (branch.length < branch.maxLength) {
          branch.length += branch.speed;
          activeBranches++;

          const endX = branch.x + Math.cos(branch.angle) * branch.length;
          const endY = branch.y + Math.sin(branch.angle) * branch.length;

          ctx.save();
          ctx.globalAlpha = branch.opacity;
          ctx.strokeStyle = `rgba(34, 197, 94, ${branch.opacity})`;
          ctx.lineWidth = branch.thickness;
          ctx.lineCap = "round";

          ctx.beginPath();
          ctx.moveTo(branch.x, branch.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.restore();

          // Agregar partículas en el extremo
          if (Math.random() < 0.3) {
            this.particleSystem.addParticlesAt(endX, endY, 1);
          }
        }
      });

      if (activeBranches > 0) {
        requestAnimationFrame(animateBranches);
      }
    };

    animateBranches();
  }

  /**
   * Efecto de floración (tema verde)
   */
  bloomEffect(x, y, petals = 6) {
    const particles = [];

    for (let i = 0; i < petals; i++) {
      const angle = (Math.PI * 2 * i) / petals;
      const distance = Math.random() * 30 + 20;

      particles.push({
        x: x,
        y: y,
        targetX: x + Math.cos(angle) * distance,
        targetY: y + Math.sin(angle) * distance,
        size: Math.random() * 4 + 2,
        color: `rgba(${
          Math.random() > 0.5 ? "34, 197, 94" : "16, 185, 129"
        }, 0.8)`,
        life: 0,
        maxLife: 60,
        phase: 0,
      });
    }

    const animateBloom = () => {
      const canvas = this.particleSystem.canvas;
      const ctx = this.particleSystem.ctx;

      if (!canvas || !ctx) return;

      let activeParticles = 0;

      particles.forEach((particle) => {
        if (particle.life < particle.maxLife) {
          particle.life++;
          particle.phase = particle.life / particle.maxLife;
          activeParticles++;

          // Interpolación suave hacia la posición objetivo
          const progress = this.easeOutQuart(particle.phase);
          particle.currentX =
            particle.x + (particle.targetX - particle.x) * progress;
          particle.currentY =
            particle.y + (particle.targetY - particle.y) * progress;

          // Efecto de opacidad
          const opacity = Math.sin(particle.phase * Math.PI) * 0.8;

          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = particle.color;
          ctx.shadowBlur = 15;
          ctx.shadowColor = particle.color;

          ctx.beginPath();
          ctx.arc(
            particle.currentX,
            particle.currentY,
            particle.size,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        }
      });

      if (activeParticles > 0) {
        requestAnimationFrame(animateBloom);
      }
    };

    animateBloom();
  }

  /**
   * Función de easing para animaciones suaves
   */
  easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  /**
   * Detiene todos los efectos
   */
  stopAllEffects() {
    this.effects.clear();
  }
}

// Inicializar sistema de partículas cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  // Solo inicializar si el contenedor existe
  const container = document.getElementById("particles-container");
  if (container) {
    const particleSystem = new ParticleSystem();
    const specialEffects = new SpecialEffects(particleSystem);

    // Exponer globalmente para debugging y control
    window.NutriScanParticles = {
      system: particleSystem,
      effects: specialEffects,
    };

    // Debug info
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.log(
        "[NutriScan Particles] Particle System initialized (Tema Verde)",
        particleSystem.getStats()
      );

      // Mostrar stats cada 5 segundos en desarrollo
      setInterval(() => {
        console.log("[NutriScan Particles] Stats:", particleSystem.getStats());
      }, 5000);
    }

    // Efectos especiales en interacciones - Actualizados para tema verde
    document.addEventListener("click", (e) => {
      if (e.target.matches("button, .btn, .social-btn")) {
        // Efecto de ondas verdes en clics de botones
        specialEffects.rippleEffect(e.clientX, e.clientY, 80);

        // Efecto de floración ocasional
        if (Math.random() < 0.3) {
          specialEffects.bloomEffect(e.clientX, e.clientY, 5);
        }
      }
    });

    // Efecto especial de hojas al cargar
    setTimeout(() => {
      specialEffects.leafRain(4000);
    }, 1000);

    // Efectos de crecimiento orgánico en hover de elementos importantes
    document.querySelectorAll(".feature-card").forEach((card) => {
      card.addEventListener("mouseenter", (e) => {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        if (Math.random() < 0.4) {
          specialEffects.organicGrowth(centerX, centerY, 30);
        }
      });
    });

    // Efecto de floración en envío de formularios
    document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          const rect = submitBtn.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          specialEffects.bloomEffect(centerX, centerY, 8);
        }
      });
    });

    // Efecto de partículas verdes en inputs focus
    document.querySelectorAll("input").forEach((input) => {
      input.addEventListener("focus", (e) => {
        const rect = input.getBoundingClientRect();
        particleSystem.addParticlesAt(
          rect.right - 10,
          rect.top + rect.height / 2,
          3
        );
      });
    });
  }
});
