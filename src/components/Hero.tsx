import { useEffect, useRef } from 'react';
import { Reveal } from './Reveal';
import { Wordmark } from './Icon';
import { useToast } from './Toast';
import { startHeroLines } from '../lib/heroLines';
import { reduceMotion } from '../hooks/useReducedMotion';

type Props = { isInert: boolean };

// линии на canvas привязаны только к этому блоку
export function Hero({ isInert }: Props) {
  const heroRef = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);
  const toast = useToast();

  useEffect(() => {
    const hero = heroRef.current, lines = linesRef.current, glow = glowRef.current;
    if (!hero || !lines || !glow) return;
    return startHeroLines(lines, glow, hero, reduceMotion);
  }, []);

  return (
    <header className="hero" id="hero" ref={heroRef} inert={isInert}>
      <canvas className="hero__lines" ref={linesRef} aria-hidden="true" />
      <canvas className="hero__glow" ref={glowRef} aria-hidden="true" />

      {/* EN пока в разработке */}
      <div className="lang" data-lang="ru" role="group" aria-label="Язык">
        <span className="lang__pill" />
        <button type="button" className="is-active">РУ</button>
        <button type="button" onClick={() => toast('Английская версия сайта в разработке')}>EN</button>
      </div>

      <h1 className="sr-only">VITRINA design studio</h1>
      <Wordmark className="wordmark" label="VITRINA design studio" />

      <div className="hero__content">
        <Reveal as="p" className="hero__title" delay={150}>Дизайн для вашего бизнеса, который продаёт</Reveal>
        <Reveal as="p" className="hero__lead" delay={250}>Инфографика для маркетплейсов, сайты под ключ, баннеры и UI для продуктов. Делаем быстро, понятно и с цифрами.</Reveal>
        <Reveal className="hero__actions" delay={350}>
          <a className="btn btn--primary" href="#contact">Обсудить проект</a>
          <a className="btn btn--secondary" href="#works">Смотреть работы</a>
        </Reveal>
      </div>
    </header>
  );
}
