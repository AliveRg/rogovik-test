import { useEffect, useRef, useState } from 'react';
import { reduceMotion } from './useReducedMotion';

export const easeOutQuart = (p: number): number => 1 - Math.pow(1 - p, 4);   // быстро, потом плавно тормозит

interface Options {
  duration: number;
  from?: number;                     // старт первой анимации; без него первое значение ставится сразу
  round?: (v: number) => number;     // округление промежуточных кадров
  enabled?: boolean;
}

// число плавно «доезжает» до target; продолжает с текущего показанного значения
export function useAnimatedNumber(target: number, { duration, from, round = Math.round, enabled = true }: Options): number {
  const [shown, setShown] = useState(from ?? target);
  const shownRef = useRef(from ?? target);
  const roundRef = useRef(round);
  useEffect(() => { roundRef.current = round; });

  useEffect(() => {
    if (!enabled) return;
    if (reduceMotion || shownRef.current === target) { shownRef.current = target; setShown(target); return; }
    const start = shownRef.current, t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const v = start + (target - start) * easeOutQuart(p);
      shownRef.current = p < 1 ? v : target;
      setShown(p < 1 ? roundRef.current(v) : target);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);

  return shown;
}
