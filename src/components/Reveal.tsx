import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AllHTMLAttributes, CSSProperties, ElementType, Ref } from 'react';
import { reduceMotion } from '../hooks/useReducedMotion';

/* Плавное появление блоков (только opacity/transform — не тормозят скролл).
   После анимации data-reveal снимается — дальше работают обычные hover-анимации. */

const SETTLE_MS = 950;
const canObserve = typeof window !== 'undefined' && 'IntersectionObserver' in window;

// true — показать содержимое сразу, без появления по скроллу
export const RevealForceContext = createContext(false);

type Phase = 'hidden' | 'in' | 'done';

type Props = AllHTMLAttributes<HTMLElement> & {
  as?: ElementType;
  variant?: 'scale' | 'fade';
  delay?: number;
  onReveal?: () => void;
  ref?: Ref<HTMLElement>;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

export function Reveal({ as: Tag = 'div', variant, delay = 0, onReveal, ref, className, style, ...rest }: Props) {
  const forced = useContext(RevealForceContext);
  const [phase, setPhase] = useState<Phase>(reduceMotion || !canObserve ? 'done' : 'hidden');
  const elRef = useRef<HTMLElement | null>(null);
  const onRevealRef = useRef(onReveal);
  useEffect(() => { onRevealRef.current = onReveal; });

  const setRefs = useCallback((el: HTMLElement | null) => {
    elRef.current = el;
    assignRef(ref, el);
  }, [ref]);

  useEffect(() => {
    const el = elRef.current;
    if (phase !== 'hidden' || forced || !el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setPhase('in');
      onRevealRef.current?.();
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, [phase, forced]);

  useEffect(() => {
    if (phase !== 'in') return;
    const t = setTimeout(() => setPhase('done'), delay + SETTLE_MS);
    return () => clearTimeout(t);
  }, [phase, delay]);

  const isDone = phase === 'done' || forced;
  const cls = [className, phase === 'in' && !forced ? 'is-in' : ''].filter(Boolean).join(' ') || undefined;
  const css = delay ? ({ '--d': `${delay}ms`, ...style } as CSSProperties) : style;

  return <Tag ref={setRefs} data-reveal={isDone ? undefined : (variant ?? '')} className={cls} style={css} {...rest} />;
}
