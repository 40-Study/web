export interface Particle {
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

/** Đọc `--primary` ("221 83% 53%") để canvas đổi màu theo light/dark. */
export function readPrimary(): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const [h, s, l] = raw.split(/\s+/);
  return h && s && l ? `${h}, ${s}, ${l}` : "221, 83%, 53%";
}

/** Số hạt tỉ lệ theo diện tích (24-70) để mobile nhẹ hơn desktop. */
export function createParticles(w: number, h: number): Particle[] {
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
