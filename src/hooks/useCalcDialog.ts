import { useCallback, useEffect, useRef, useState } from 'react';

// 'back' — крестик/Esc (шаг назад в истории), 'replace' — уход в раздел сайта, 'pop' — кнопка «назад»
export type CloseMode = 'back' | 'replace' | 'pop';

export interface CalcDialog {
  isOpen: boolean;
  open: (from?: HTMLElement | null) => void;
  close: (mode?: CloseMode) => void;
}

const HASH = '#calc';

export function useCalcDialog(): CalcDialog {
  const [isOpen, setIsOpen] = useState(false);
  const openRef = useRef(false);
  const pushedRef = useRef(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const focusBackRef = useRef(false);

  const open = useCallback((from?: HTMLElement | null) => {
    if (openRef.current) return;
    const root = document.documentElement;
    openRef.current = true;
    openerRef.current = from ?? (document.activeElement as HTMLElement | null);
    root.style.setProperty('--sbw', `${window.innerWidth - root.clientWidth}px`);
    root.classList.add('calc-open');                         // блокируем скролл сайта
    if (location.hash !== HASH) { history.pushState({ calc: true }, '', HASH); pushedRef.current = true; }
    setIsOpen(true);
  }, []);

  const close = useCallback((mode: CloseMode = 'back') => {
    if (!openRef.current) return;
    openRef.current = false;
    document.documentElement.classList.remove('calc-open');
    if (mode !== 'pop') {
      const state = history.state as { calc?: boolean } | null;
      if (mode === 'back' && pushedRef.current && state?.calc) history.back();
      else if (location.hash === HASH) history.replaceState(null, '', location.pathname + location.search);
    }
    pushedRef.current = false;
    focusBackRef.current = mode === 'back';
    setIsOpen(false);
  }, []);

  // фокус возвращаем после того, как с сайта снят inert
  useEffect(() => {
    if (isOpen || !focusBackRef.current) return;
    focusBackRef.current = false;
    openerRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && openRef.current) close('back'); };
    const onPop = () => {
      if (openRef.current && location.hash !== HASH) close('pop');
      else if (!openRef.current && location.hash === HASH) open();
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    if (location.hash === HASH) open();
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
    };
  }, [open, close]);

  return { isOpen, open, close };
}
