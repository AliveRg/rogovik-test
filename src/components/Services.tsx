import type { MouseEvent } from 'react';
import { Reveal } from './Reveal';
import { SERVICES } from '../data/content';

type Props = { onOpenCalc: (from: HTMLElement) => void };

const CARDS_PER_ROW = 4;
const CARD_STEP_MS = 70;

export function Services({ onOpenCalc }: Props) {
  return (
    <section className="section services" id="services">
      <Reveal className="section-head">
        <div>
          <h2 className="section-title">Услуги и цены</h2>
          <p className="section-sub">Цены ориентировочные — точная стоимость после брифа.</p>
        </div>
      </Reveal>

      <div className="services-grid">
        {SERVICES.map((s, i) => (
          <Reveal key={s.name} as="article" className={`svc${s.soon ? ' svc--soon' : ''}`} delay={(i % CARDS_PER_ROW) * CARD_STEP_MS}>
            <div className="svc__top"><span className="svc__dot" /><span className="chip">{s.tag}</span></div>
            <div className="svc__body" style={s.bodyTop ? { top: `${s.bodyTop}px` } : undefined}>
              <h3 className="svc__name">{s.name}</h3><p className="svc__desc">{s.desc}</p>
            </div>
            <p className={`svc__price${s.muted ? ' svc__price--muted' : ''}`}>{s.price}</p>
          </Reveal>
        ))}
      </div>
      <Reveal className="section-more">
        <button type="button" className="btn btn--primary btn--calc" onClick={(e: MouseEvent<HTMLButtonElement>) => onOpenCalc(e.currentTarget)}>
          Рассчитать проект
        </button>
      </Reveal>
    </section>
  );
}
