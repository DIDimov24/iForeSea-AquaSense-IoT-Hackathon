'use client';

import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
};

const COUNT = 900;
const CELL = 28;

function hash2(x: number, y: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return h - Math.floor(h);
}

function noise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function AlgalDrift({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let density: Float32Array = new Float32Array(0);
    const particles: Particle[] = [];
    let raf = 0;
    let t = 0;

    const reset = (p: Particle) => {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.vx = 0;
      p.vy = 0;
      p.life = 100 + Math.random() * 300;
      p.size = 0.6 + Math.random() * 1.6;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL) + 1;
      rows = Math.ceil(h / CELL) + 1;
      density = new Float32Array(cols * rows);
      if (particles.length === 0) {
        for (let i = 0; i < COUNT; i++) {
          const p: Particle = { x: 0, y: 0, vx: 0, vy: 0, life: 0, size: 0 };
          reset(p);
          particles.push(p);
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - r.left;
      mouseRef.current.y = e.clientY - r.top;
      mouseRef.current.active = true;
    };
    const onLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    const tick = () => {
      t += 0.004;
      density.fill(0);

      const trailColor =
        getComputedStyle(document.documentElement).getPropertyValue('--particle-bg').trim() ||
        'rgba(6, 15, 28, 0.18)';
      ctx.fillStyle = trailColor;
      ctx.fillRect(0, 0, w, h);

      const m = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const nx = p.x * 0.0035;
        const ny = p.y * 0.0035;
        const angle = noise(nx + t, ny - t) * Math.PI * 4;
        const flowX = Math.cos(angle);
        const flowY = Math.sin(angle);

        let ax = flowX * 0.06;
        let ay = flowY * 0.06;

        if (m.active) {
          const dx = m.x - p.x;
          const dy = m.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 28000 && d2 > 1) {
            const f = 28000 / (d2 + 200);
            ax += (dx / Math.sqrt(d2)) * f * 0.012;
            ay += (dy / Math.sqrt(d2)) * f * 0.012;
          }
        }

        p.vx = p.vx * 0.94 + ax;
        p.vy = p.vy * 0.94 + ay;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;

        if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10 || p.life <= 0) {
          reset(p);
          continue;
        }

        const cx = Math.floor(p.x / CELL);
        const cy = Math.floor(p.y / CELL);
        if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
          density[cy * cols + cx] += 1;
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const cx = Math.floor(p.x / CELL);
        const cy = Math.floor(p.y / CELL);
        const dens = cx >= 0 && cx < cols && cy >= 0 && cy < rows ? density[cy * cols + cx] : 0;

        const norm = Math.min(dens / 8, 1);
        let r: number, g: number, b: number;
        if (norm < 0.5) {
          const k = norm / 0.5;
          r = 0 + k * 255;
          g = 229 + k * (182 - 229);
          b = 160 + k * (39 - 160);
        } else {
          const k = (norm - 0.5) / 0.5;
          r = 255;
          g = 182 + k * (59 - 182);
          b = 39 + k * (92 - 39);
        }

        const alpha = 0.35 + norm * 0.55;
        ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + norm * 1.4, 0, Math.PI * 2);
        ctx.fill();

        if (norm > 0.6) {
          ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, 0.08)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + 6 + norm * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden />;
}
