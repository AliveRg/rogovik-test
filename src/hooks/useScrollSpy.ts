import { useEffect, useState } from 'react';
import type { SectionId } from '../data/content';

// активный пункт сайдбара по скроллу; «top» соответствует блоку #hero
export function useScrollSpy(ids: SectionId[]): SectionId {
  const [active, setActive] = useState<SectionId>('top');

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const targets = ids
      .map((id) => document.getElementById(id === 'top' ? 'hero' : id))
      .filter((el): el is HTMLElement => el !== null);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setActive((e.target.id === 'hero' ? 'top' : e.target.id) as SectionId);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach((t) => spy.observe(t));
    return () => spy.disconnect();
  }, [ids]);

  return active;
}
