"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  size: number;
  /** Phase offset for wave motion */
  phase: number;
  /** Wave amplitude */
  amplitude: number;
  /** Wave speed multiplier */
  speed: number;
  /** Opacity 0-1 */
  opacity: number;
}

interface ParticleWaveBackgroundProps {
  /** Number of particles (default 80) */
  particleCount?: number;
  /** Particle color in rgb format (default "99, 102, 241" = primary) */
  color?: string;
  /** Max particle size (default 4) */
  maxSize?: number;
  /** Mouse influence radius in px (default 150) */
  mouseRadius?: number;
  /** CSS class for the canvas container */
  className?: string;
}

/**
 * Canvas particle system with wave motion + mouse interaction.
 * Inspired by ForteX logo dot pattern.
 * GPU-friendly: uses single canvas, requestAnimationFrame, no DOM updates.
 */
export function ParticleWaveBackground({
  particleCount = 80,
  color = "99, 102, 241",
  maxSize = 4,
  mouseRadius = 150,
  className,
}: ParticleWaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Initialize particles distributed across the canvas
  const initParticles = useCallback(
    (width: number, height: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          baseX: x,
          baseY: y,
          x,
          y,
          size: Math.random() * maxSize + 1,
          phase: Math.random() * Math.PI * 2,
          amplitude: Math.random() * 30 + 10,
          speed: Math.random() * 0.5 + 0.3,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
      particlesRef.current = particles;
    },
    [particleCount, maxSize]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle resize
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      initParticles(w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    // Animation loop
    const animate = () => {
      timeRef.current += 0.016; // ~60fps timestep
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const mouse = mouseRef.current;
      const particles = particlesRef.current;

      for (const p of particles) {
        // Wave motion
        const waveX = Math.sin(timeRef.current * p.speed + p.phase) * p.amplitude;
        const waveY = Math.cos(timeRef.current * p.speed * 0.7 + p.phase) * p.amplitude * 0.5;

        let targetX = p.baseX + waveX;
        let targetY = p.baseY + waveY;

        // Mouse repulsion
        const dx = targetX - mouse.x;
        const dy = targetY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius && dist > 0) {
          const force = (mouseRadius - dist) / mouseRadius;
          const angle = Math.atan2(dy, dx);
          targetX += Math.cos(angle) * force * 60;
          targetY += Math.sin(angle) * force * 60;
        }

        // Smooth interpolation toward target
        p.x += (targetX - p.x) * 0.08;
        p.y += (targetY - p.y) * 0.08;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
        ctx.fill();
      }

      // Draw faint connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const lineOpacity = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${color}, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [color, mouseRadius, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "auto", zIndex: 0 }}
    />
  );
}
