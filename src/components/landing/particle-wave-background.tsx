"use client";

import { useEffect, useRef } from "react";

interface Particle {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  size: number;
  phase: number;
  amplitude: number;
  speed: number;
  alpha: number;
}

interface ParticleWaveBackgroundProps {
  /** Tạm dừng do người dùng bấm nút dừng hiệu ứng (WCAG 2.2.2). */
  paused?: boolean;
  className?: string;
}

const MAX_DPR = 2;
const LINK_DIST = 120;
const MOUSE_RADIUS = 140;

/** Đọc `--primary` ("221 83% 53%") để canvas đổi màu theo light/dark. */
function readPrimary(): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const [h, s, l] = raw.split(/\s+/);
  return h && s && l ? `${h}, ${s}, ${l}` : "221, 83%, 53%";
}

function createParticles(w: number, h: number): Particle[] {
  const count = Math.max(24, Math.min(70, Math.round((w * h) / 20000)));
  return Array.from({ length: count }, () => {
    const x = Math.random() * w;
    const y = Math.random() * h;
    return {
      baseX: x,
      baseY: y,
      x,
      y,
      size: Math.random() * 2.5 + 1,
      phase: Math.random() * Math.PI * 2,
      amplitude: Math.random() * 28 + 10,
      speed: Math.random() * 0.5 + 0.3,
      alpha: Math.random() * 0.4 + 0.25,
    };
  });
}

/**
 * Canvas particle wave cho hero: sóng + đẩy theo chuột + nối line gần nhau.
 * Loop chỉ chạy khi: trong viewport, tab đang mở, không reduced-motion, không bị tạm dừng.
 * Khi dừng (kể cả reduced-motion) canvas giữ một khung tĩnh.
 */
export function ParticleWaveBackground({ paused = false, className }: ParticleWaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let color = readPrimary();
    let inView = true;
    let raf = 0;
    let last = 0;
    let time = 0;
    const mouse = { x: -9999, y: -9999 };

    const draw = (dt: number) => {
      time += dt;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        let tx = p.baseX + Math.sin(time * p.speed + p.phase) * p.amplitude;
        let ty = p.baseY + Math.cos(time * p.speed * 0.7 + p.phase) * p.amplitude * 0.5;
        const dx = tx - mouse.x;
        const dy = ty - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * 50;
          tx += (dx / dist) * force;
          ty += (dy / dist) * force;
        }
        p.x += (tx - p.x) * 0.08;
        p.y += (ty - p.y) * 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${color}, ${p.alpha})`;
        ctx.fill();
      }
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
          if (d2 < LINK_DIST * LINK_DIST) {
            ctx.strokeStyle = `hsla(${color}, ${(1 - Math.sqrt(d2) / LINK_DIST) * 0.24})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };

    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      draw(dt);
      raf = requestAnimationFrame(frame);
    };

    const shouldRun = () =>
      inView && !document.hidden && !reducedMq.matches && !pausedRef.current;

    /** Bật/tắt loop theo điều kiện; khi dừng thì giữ một khung tĩnh. */
    const sync = () => {
      if (shouldRun()) {
        if (!raf) {
          last = 0;
          raf = requestAnimationFrame(frame);
        }
        return;
      }
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (w) draw(0);
    };
    syncRef.current = sync;

    const resize = () => {
      w = host.clientWidth;
      h = host.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(w, h);
      time = 0;
      draw(0);
      sync();
    };

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    });
    ro.observe(host);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(host);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const themeObserver = new MutationObserver(() => {
      color = readPrimary();
      if (!raf && w) draw(0);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", sync);
    reducedMq.addEventListener("change", sync);

    resize();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", sync);
      reducedMq.removeEventListener("change", sync);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden data-testid="hero-particles" className={className} />;
}
