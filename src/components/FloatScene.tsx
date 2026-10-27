import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Wordmark } from './Icon';
import { reduceMotion } from '../hooks/useReducedMotion';

interface FloatItem { mod: string; speed: number; max?: number; inner: ReactNode }

const EASE = 0.12;          // мягкое догоняние, без рывков
const EPS = 0.05;

const ITEMS: FloatItem[] = [
  { mod: 'blue', speed: 0.22, inner: <div className="fl__in" /> },
  { mod: 'dot-accent', speed: 0.38, inner: <div className="fl__in dot dot--accent" /> },
  { mod: 'dot-grey', speed: 0.26, inner: <div className="fl__in dot dot--grey" /> },
  {
    mod: 'logo', speed: 0.08, inner: (
      <div className="fl__in sel">
        <span className="sel__box" />
        <Wordmark className="sel__logo" />
        <span className="sel__h sel__h--tl" /><span className="sel__h sel__h--tr" />
        <span className="sel__h sel__h--bl" /><span className="sel__h sel__h--br" />
        <svg className="sel__cursor" viewBox="0 0 26 26" fill="none"><path d="M0.0681705 2.44441C-0.318392 1.00174 1.00174 -0.318392 2.44441 0.0681706L22.732 5.5042C24.1746 5.89076 24.6578 7.6941 23.6017 8.75021L8.75021 23.6017C7.6941 24.6578 5.89076 24.1746 5.5042 22.732L0.0681705 2.44441Z" fill="white" /><path d="M11.8887 16.6904C11.131 15.9327 11.131 14.7043 11.8887 13.9466L13.9466 11.8887C14.7043 11.131 15.9327 11.131 16.6904 11.8887L24.922 20.1202C25.6797 20.8779 25.6797 22.1064 24.922 22.8641L22.8641 24.922C22.1064 25.6797 20.8779 25.6797 20.1202 24.922L11.8887 16.6904Z" fill="white" /></svg>
      </div>
    )
  },
  { mod: 'text', speed: -0.18, max: 60, inner: <div className="fl__in">text</div> },
  { mod: 'grey', speed: -0.1, max: 30, inner: <div className="fl__in" /> }
];

// парящие блоки (параллакс): transform пишется напрямую, без ре-рендеров
export function FloatScene() {
  const sceneRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || reduceMotion) return;
    const ys = ITEMS.map(() => 0);
    let visible = false, raf = 0;

    const tick = () => {
      raf = 0;
      const r = scene.getBoundingClientRect();
      const delta = (r.top + r.height / 2) - window.innerHeight / 2;   // >0 — блок ниже центра экрана
      let moving = false;
      ITEMS.forEach((it, i) => {
        const target = Math.min(delta * it.speed, it.max ?? Infinity);  // предел смещения вниз
        ys[i] += (target - ys[i]) * EASE;
        if (Math.abs(target - ys[i]) > EPS) moving = true;
        const el = itemRefs.current[i];
        if (el) el.style.transform = `translate3d(0, ${ys[i].toFixed(2)}px, 0)`;
      });
      if (visible && moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (visible && !raf) raf = requestAnimationFrame(tick); };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }, { rootMargin: '200px 0px' });
    io.observe(scene);
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
    };
  }, []);

  return (
    <section className="float-scene" id="floatScene" ref={sceneRef} aria-hidden="true">
      {ITEMS.map((it, i) => (
        <div key={it.mod} className={`fl fl--${it.mod}`} ref={(el) => { itemRefs.current[i] = el; }}>{it.inner}</div>
      ))}
    </section>
  );
}
