/* =========================================================
   Линии в hero (canvas). Базовая кривая статична и гладкая;
   анимация — плавное поле смещений поверх неё, поэтому изломов
   не бывает в принципе.
   ========================================================= */

type Pt = [number, number];

interface Wave { f: number; w: number; a: number; p: number }
interface Bulge { cf: number; cp: number; af: number; ap: number; sigma: number; max: number }
interface Line {
  ctrl: Pt[];
  alpha: number;
  waves: Wave[];
  wx: Wave;
  bulges: Bulge[];
  base: Pt[] | null;      // сэмплы базовой кривой (пересчитываются при ресайзе)
  P: Pt[];
  Wd: Float32Array;
  E: Float32Array;
}

// Контуры из макета (frame 1440 × 880). y +26 — отступ экспорта группы.
const FRAME_W = 1440;
const Y0 = 26;
const BASE: Pt[][] = [
  [[-40, 344.093], [52.3333, 387.593], [289.3, 454.393], [498.5, 373.593], [760, 272.593], [807.5, 143.093], [1006, 119.093], [1204.5, 95.0929], [1475, 133.093], [1501, 147.093]],
  [[-59, 55.0929], [-39.3333, 80.5929], [92.4, 140.293], [462, 175.093], [924, 218.593], [901, 59.5929], [1091, 68.5929], [1243, 75.7929], [1453, 223.926], [1539, 297.093]],
  [[-24, 641.875], [80.5, 658.484], [340.8, 644.167], [546, 454.026], [802.5, 216.35], [755.5, 195.921], [968, 47.9337], [1180.5, -100.053], [1506, 153.069], [1583, 196.917]],
  [[-60, 560], [260, 600], [520, 470], [760, 430], [1000, 390], [1180, 300], [1340, 240], [1440, 205], [1500, 190], [1560, 182]]
];

const N = 280;          // точек на линию
const BASE_W = 4;       // толщина как в макете
const GS = 0.2;         // масштаб холста свечения (1/5)
const MAX_DPR = 2;
const LINE_RGB = '110,92,246';

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

function makeLine(pts: Pt[], li: number): Line {
  return {
    ctrl: pts.map(([x, y]) => [x, y + Y0]),
    alpha: li === 3 ? 0.13 : 0.19,
    // волны деформации вдоль линии (гладкие, 0.5–1.6 периода на линию)
    waves: [0, 1, 2].map((k) => ({
      f: rand(0.45, 1.6), w: rand(0.18, 0.34) * (k % 2 ? -1 : 1),
      a: rand(7, 15) / (k + 1) * 1.2, p: rand(0, Math.PI * 2)
    })),
    wx: { f: rand(0.4, 1), w: rand(0.12, 0.22), a: rand(6, 12), p: rand(0, Math.PI * 2) },
    // утолщения: место «гуляет», толщина плавно растёт/спадает
    bulges: [0, 1].map(() => ({
      cf: rand(0.05, 0.1), cp: rand(0, Math.PI * 2),
      af: rand(0.2, 0.38), ap: rand(0, Math.PI * 2),
      sigma: rand(0.09, 0.15), max: rand(4.5, 7)
    })),
    base: null,
    P: Array.from({ length: N }, (): Pt => [0, 0]),
    Wd: new Float32Array(N),
    E: new Float32Array(N)
  };
}

function bez(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

function sampleBase(ctrl: Pt[], sx: number): Pt[] {
  const pts = ctrl.map(([x, y]): Pt => [x * sx, y]);
  const segs = (pts.length - 1) / 3;
  return Array.from({ length: N }, (_, i) => {
    const g = (i / (N - 1)) * segs;
    const s = Math.min(segs - 1, Math.floor(g)), k = s * 3;
    return bez(pts[k], pts[k + 1], pts[k + 2], pts[k + 3], g - s);
  });
}

// лента переменной толщины (нормали считаются по гладкой кривой)
function ribbon(c: CanvasRenderingContext2D, P: Pt[], Wd: Float32Array, grow: number): void {
  const offset = (i: number): Pt => {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)];
    const nx = a[1] - b[1], ny = b[0] - a[0];
    const h = (Wd[i] * grow) / (2 * (Math.hypot(nx, ny) || 1));
    return [nx * h, ny * h];
  };
  c.beginPath();
  for (let i = 0; i < N; i++) {
    const [ox, oy] = offset(i);
    if (i) c.lineTo(P[i][0] + ox, P[i][1] + oy); else c.moveTo(P[i][0] + ox, P[i][1] + oy);
  }
  for (let i = N - 1; i >= 0; i--) {
    const [ox, oy] = offset(i);
    c.lineTo(P[i][0] - ox, P[i][1] - oy);
  }
  c.closePath();
}

// горизонтальный градиент: прозрачность меняется плавно вдоль линии
function alongGradient(c: CanvasRenderingContext2D, P: Pt[], alphaAt: (i: number) => number, rgb: string): CanvasGradient {
  let minX = Infinity, maxX = -Infinity;
  for (const p of P) { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; }
  const g = c.createLinearGradient(minX, 0, maxX, 0);
  const span = maxX - minX || 1;
  let last = -1;
  for (let i = 0; i < N; i += 6) {
    const o = (P[i][0] - minX) / span;
    if (o <= last + 0.004) continue;
    g.addColorStop(Math.min(1, o), `rgba(${rgb},${alphaAt(i).toFixed(3)})`);
    last = o;
  }
  return g;
}

// 1. гладкая деформация + толщина; возвращает пик утолщения
function deform(ln: Line, t: number, sx: number): number {
  const base = ln.base as Pt[];
  const bs = ln.bulges.map((b) => ({
    c: 0.5 + 0.4 * Math.sin(t * b.cf + b.cp) + 0.06 * Math.sin(t * b.cf * 2.3 + b.cp),
    a: b.max * (0.5 + 0.5 * Math.sin(t * b.af + b.ap)),
    s2: 2 * b.sigma * b.sigma
  }));
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    let dy = 0;
    for (const w of ln.waves) dy += w.a * Math.sin(Math.PI * 2 * w.f * u + t * w.w + w.p);
    const dx = ln.wx.a * Math.sin(Math.PI * 2 * ln.wx.f * u + t * ln.wx.w + ln.wx.p);
    ln.P[i][0] = base[i][0] + dx * sx;
    ln.P[i][1] = base[i][1] + dy;
    let e = 0;
    for (const b of bs) { const d = u - b.c; e += b.a * Math.exp(-(d * d) / b.s2); }
    ln.E[i] = e; ln.Wd[i] = BASE_W + e;
    if (e > peak) peak = e;
  }
  return peak;
}

/** Запускает анимацию; возвращает функцию остановки. */
export function startHeroLines(canvas: HTMLCanvasElement, glow: HTMLCanvasElement, hero: HTMLElement, reduceMotion: boolean): () => void {
  const ctx = canvas.getContext('2d');
  const gctx = glow.getContext('2d');
  if (!ctx || !gctx) return () => {};

  const lines = BASE.map(makeLine);
  let W = 0, H = 0, dpr = 1, sx = 1;
  let running = false, visible = true, raf = 0;
  const t0 = performance.now();

  function draw(t: number): void {
    if (!ctx || !gctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0;
    ctx.clearRect(0, 0, W, H);
    gctx.setTransform(1, 0, 0, 1, 0, 0);
    gctx.clearRect(0, 0, glow.width, glow.height);

    for (const ln of lines) {
      if (!ln.base) continue;
      const peak = deform(ln, t, sx);
      const { P, Wd, E } = ln;

      // 2. сама линия: в толстых местах чуть ярче
      ctx.fillStyle = alongGradient(ctx, P, (i) => ln.alpha + 0.1 * Math.min(1, E[i] / 7), LINE_RGB);
      ribbon(ctx, P, Wd, 1);
      ctx.fill();

      // 3. маска свечения — на маленький холст (дёшево); показывается слоем .hero__glow (mix-blend-mode: screen)
      if (peak > 0.6) {
        const OFF = W + 400;
        gctx.save();
        gctx.setTransform(GS, 0, 0, GS, 0, 0);
        gctx.translate(-OFF, 0);
        gctx.shadowOffsetX = OFF * GS;
        gctx.fillStyle = alongGradient(gctx, P, (i) => Math.pow(Math.min(1, E[i] / 6.5), 1.4), '255,255,255');
        gctx.shadowColor = 'rgba(70,52,255,0.26)';    // широкий мягкий ореол
        gctx.shadowBlur = 24 * GS;
        ribbon(gctx, P, Wd, 3); gctx.fill();
        gctx.shadowColor = 'rgba(92,76,255,0.24)';    // плотное ядро
        gctx.shadowBlur = 7 * GS;
        ribbon(gctx, P, Wd, 1.3); gctx.fill();
        gctx.restore();
      }
    }
  }

  function resize(): void {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    sx = W / FRAME_W;
    glow.width = Math.ceil(W * GS);
    glow.height = Math.ceil(H * GS);
    lines.forEach((ln) => { ln.base = sampleBase(ln.ctrl, sx); });
    draw((performance.now() - t0) / 1000);
  }

  function loop(now: number): void {
    raf = 0;
    if (!running) return;
    draw((now - t0) / 1000);
    raf = requestAnimationFrame(loop);
  }

  function update(): void {
    const should = visible && !document.hidden && !reduceMotion;
    if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
    if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  }

  const ro = new ResizeObserver(resize);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); });
  ro.observe(hero);
  io.observe(hero);
  document.addEventListener('visibilitychange', update);
  resize();
  update();

  return () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', update);
  };
}
