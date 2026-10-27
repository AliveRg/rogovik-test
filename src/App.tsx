import { useCallback, useEffect, useRef, useState } from 'react';
import { SvgSprite } from './components/SvgSprite';
import { Sidebar } from './components/Sidebar';
import { ToTop } from './components/ToTop';
import { Hero } from './components/Hero';
import { Works } from './components/Works';
import { Services } from './components/Services';
import { FloatScene } from './components/FloatScene';
import { About } from './components/About';
import { Contact } from './components/Contact';
import type { BriefState } from './components/Contact';
import { Footer } from './components/Footer';
import { Calc } from './components/calc/Calc';
import { useToast } from './components/Toast';
import { useCalcDialog } from './hooks/useCalcDialog';
import { useDocked } from './hooks/useDocked';
import { reduceMotion } from './hooks/useReducedMotion';

const SENT_MESSAGE = 'Расчёт перенесён в заявку — осталось оставить контакт';

// «Отправить расчёт»: всё приглушается, форма с расчётом светится и мерцает, потом всё проявляется
const SPOT = { glowAt: 750, dimOffAt: 3300, endAt: 3950, toastMs: 4000 };

export function App() {
  const calc = useCalcDialog();
  const isDocked = useDocked();
  const toast = useToast();
  const [brief, setBrief] = useState<BriefState>({ task: '', chips: [] });
  const [isContactForced, setIsContactForced] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [isSpot, setIsSpot] = useState(false);
  const formRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const handleCalcSend = useCallback((text: string, chips: string[]) => {
    setBrief((prev) => ({
      task: prev.task.trim() ? `${prev.task.trim()}\n${text}` : text,
      chips: [...new Set([...prev.chips, ...chips])]
    }));
    setIsContactForced(true);         // блок заявки сразу видим, чтобы подсветка легла поверх
    calc.close('replace');

    const form = () => formRef.current;
    if (reduceMotion) {
      requestAnimationFrame(() => form()?.scrollIntoView({ block: 'center' }));
      toast(SENT_MESSAGE);
      return;
    }
    setIsDimmed(true);
    requestAnimationFrame(() => form()?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => { setIsSpot(true); toast(SENT_MESSAGE, SPOT.toastMs); }, SPOT.glowAt),
      setTimeout(() => setIsDimmed(false), SPOT.dimOffAt),
      setTimeout(() => { setIsSpot(false); nameRef.current?.focus({ preventScroll: true }); }, SPOT.endAt)
    ];
  }, [calc, toast]);

  const isBehind = calc.isOpen;     // сайт за поп-апом недоступен

  return (
    <>
      <SvgSprite />
      <Sidebar isDocked={isDocked} isCalcOpen={calc.isOpen} onCloseCalc={calc.close} />
      <ToTop isShown={isDocked} isInert={isBehind} />
      <Hero isInert={isBehind} />

      <main className="page" inert={isBehind}>
        <Works />
        <Services onOpenCalc={calc.open} />
        <FloatScene />
        <About />
        <Contact brief={brief} onBriefChange={setBrief} isForced={isContactForced} isSpot={isSpot} formRef={formRef} nameRef={nameRef} />
        <Footer />
      </main>

      <Calc isOpen={calc.isOpen} onSend={handleCalcSend} />
      <div className={`spotlight${isDimmed ? ' is-on' : ''}`} aria-hidden="true" />
    </>
  );
}
