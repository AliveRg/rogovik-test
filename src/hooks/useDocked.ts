import { useEffect, useState } from 'react';

const DOCK_ON = 80;     // небольшой гистерезис, чтобы бар не дёргался
const DOCK_OFF = 40;

// бар: сверху на первом экране, по центру при прокрутке
export function useDocked(): boolean {
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    let current = false, ticking = false;
    const check = () => {
      ticking = false;
      const y = window.scrollY;
      const want = current ? y > DOCK_OFF : y > DOCK_ON;
      if (want === current) return;
      current = want;
      setDocked(want);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    check();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return docked;
}
