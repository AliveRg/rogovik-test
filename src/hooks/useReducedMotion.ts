const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

// как и в исходной версии — читается один раз при загрузке
export const reduceMotion: boolean = query?.matches ?? false;

export const scrollBehavior = (): ScrollBehavior => (reduceMotion ? 'auto' : 'smooth');

export function scrollToSection(hash: string): void {
  if (hash === '#top') { window.scrollTo({ top: 0, behavior: scrollBehavior() }); return; }
  document.querySelector(hash)?.scrollIntoView({ behavior: scrollBehavior() });
}
