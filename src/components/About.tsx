import { useState } from 'react';
import { Reveal } from './Reveal';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { DEV_PAGE, STATS, TOOLS } from '../data/content';
import type { StatDef } from '../data/content';

const COUNT_MS = 1560;
const STAT_STEP_MS = 80;
const MORE_LINKS = 4;

function Stat({ stat, delay }: { stat: StatDef; delay: number }) {
  const [isCounting, setIsCounting] = useState(false);
  const n = useAnimatedNumber(stat.count ?? 0, { duration: COUNT_MS, from: 0, enabled: isCounting });
  const text = stat.count !== undefined && isCounting ? `${n}${stat.suffix ?? ''}` : stat.value;

  return (
    <Reveal className={`stat${stat.accent ? ' stat--accent' : ''}`} delay={delay} onReveal={() => setIsCounting(true)}>
      <p className="stat__num">{text}</p>
      <p className="stat__label">{stat.label}</p>
    </Reveal>
  );
}

export function About() {
  return (
    <section className="section about" id="about">
      <Reveal>
        <h2 className="section-title">Коротко о нас</h2>
        <p className="section-sub">Мы — VITRINA design studio.</p>
      </Reveal>
      <div className="about-row">
        <Reveal className="about-photo" variant="scale">Фото / визуал студии</Reveal>
        <Reveal className="about-card" variant="scale" delay={100}>
          <p className="about-card__label">О студии</p>
          <p className="about-card__title">Мы — VITRINA design studio. Делаем дизайн, который работает на продажи.</p>
          <p className="about-card__text">Знаем маркетплейсы изнутри: как покупатель листает выдачу и что заставляет его кликнуть. Ведём проект от брифа до вёрстки и отдаём все исходники.</p>
          <div className="about-card__tools">
            {TOOLS.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
          <div className="about-more">
            <span className="about-more__label">Больше о нас:</span>
            <div className="about-more__links">
              {Array.from({ length: MORE_LINKS }, (_, i) => (
                <a key={i} href={DEV_PAGE} aria-label={`Больше о нас — ссылка ${i + 1}`} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
      <div className="stats">
        {STATS.map((s, i) => <Stat key={s.label} stat={s} delay={i * STAT_STEP_MS} />)}
      </div>
    </section>
  );
}
