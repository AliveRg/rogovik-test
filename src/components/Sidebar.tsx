import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { Icon } from './Icon';
import { LOGO_SRC, NAV } from '../data/content';
import type { CloseMode } from '../hooks/useCalcDialog';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { scrollToSection } from '../hooks/useReducedMotion';

type Props = {
  isDocked: boolean;
  isCalcOpen: boolean;
  onCloseCalc: (mode: CloseMode) => void;
};

const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
const SPY_IDS = NAV.map((n) => n.id);
const navStyle = (i: number) => ({ '--i': i }) as CSSProperties;

export function Sidebar({ isDocked, isCalcOpen, onCloseCalc }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);          // раскрыт тапом (тач-устройства)
  const [noExpand, setNoExpand] = useState(false);
  const wasCalcOpen = useRef(isCalcOpen);
  const active = useScrollSpy(SPY_IDS);

  // свернуть раскрытый бар вместе с поп-апом, даже если курсор на нём
  useEffect(() => {
    if (wasCalcOpen.current && !isCalcOpen) {
      const el = ref.current;
      setIsOpen(false);
      if (el?.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
      if (el?.matches(':hover')) setNoExpand(true);
    }
    wasCalcOpen.current = isCalcOpen;
  }, [isCalcOpen]);

  useEffect(() => {
    if (!isTouch) return;
    const onDocClick = (e: globalThis.MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleLogoClick = (e: MouseEvent) => {
    if (isCalcOpen) { e.preventDefault(); onCloseCalc('back'); return; }   // в поп-апе лого = «Закрыть»
    if (isTouch && !isOpen) { e.preventDefault(); setIsOpen(true); }
  };

  // пункты бара в поп-апе: закрыть и перейти к разделу
  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isTouch) setIsOpen(false);
    if (!isCalcOpen) return;
    e.preventDefault();
    const hash = e.currentTarget.getAttribute('href') ?? '#top';
    onCloseCalc('replace');
    requestAnimationFrame(() => scrollToSection(hash));
  };

  const cls = ['sidebar', isDocked && 'is-docked', isOpen && 'is-open', isCalcOpen && 'is-calc', noExpand && 'no-expand']
    .filter(Boolean).join(' ');

  return (
    <aside className={cls} id="sidebar" aria-label="Навигация" ref={ref} onMouseLeave={() => setNoExpand(false)}>
      <div className="sidebar__head">
        <a className="sidebar__logo" href="#top" aria-label={isCalcOpen ? 'Закрыть калькулятор' : 'VITRINA — на главную'} onClick={handleLogoClick}>
          <img className="sidebar__cube" src={LOGO_SRC} alt="" width="36" height="39" />
          <svg className="sidebar__x" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M7 7 17 17" /><path pathLength="1" d="M17 7 7 17" /></svg>
          <span className="sidebar__close-label">Закрыть</span>
        </a>
        <div className="sidebar__brand" aria-hidden="true"><b>VITRINA</b><span>design studio</span></div>
      </div>
      <div className="sidebar__divider" />
      <nav className="sidebar__nav">
        {NAV.map((n, i) => (
          <a key={n.id} className={`navbtn${active === n.id ? ' is-active' : ''}`} href={`#${n.id}`} style={navStyle(i)} onClick={handleNavClick}>
            <Icon name={n.icon} /><span className="navbtn__label">{n.label}</span>
          </a>
        ))}
      </nav>
      <div className="sidebar__divider sidebar__divider--cta" />
      <a className="navbtn navbtn--cta" href="#contact" style={navStyle(NAV.length)} onClick={handleNavClick}>
        <Icon name="chat" /><span className="navbtn__label">Обсудить проект</span>
      </a>
    </aside>
  );
}
