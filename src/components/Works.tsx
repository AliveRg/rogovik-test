import { useState } from 'react';
import { Reveal } from './Reveal';
import { useToast } from './Toast';
import { DEV_PAGE, WORK_FILTERS, WORK_ROWS } from '../data/content';
import type { WorkFilter } from '../data/content';

const ALL_WORKS = WORK_ROWS.flat();
const TILE_STEP_MS = 100;

export function Works() {
  const [filter, setFilter] = useState<WorkFilter>('all');
  const toast = useToast();
  const isShown = (cat: string) => filter === 'all' || cat === filter;

  const handleFilter = (f: WorkFilter) => {
    setFilter(f);
    if (!ALL_WORKS.some((w) => f === 'all' || w.cat === f)) toast('В этой категории работы скоро появятся');
  };

  return (
    <section className="section works" id="works">
      <div className="section-head">
        <Reveal>
          <h2 className="section-title">Работы</h2>
          <p className="section-sub">Избранные проекты студии. Полный список — на странице «Работы».</p>
        </Reveal>
        <Reveal className="filters" role="group" aria-label="Фильтр работ" delay={120}>
          {WORK_FILTERS.map((f) => (
            <button key={f.id} type="button" className={`chip chip--square${filter === f.id ? ' is-active' : ''}`} onClick={() => handleFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </Reveal>
      </div>

      <div className="works-grid">
        {WORK_ROWS.map((row, r) => (
          <div key={r} className={`works-row works-row--${r + 1}`}>
            {row.map((w, i) => (
              <Reveal key={w.title} as="a" variant="scale" delay={i * TILE_STEP_MS} href={DEV_PAGE} className={`tile${isShown(w.cat) ? '' : ' is-dimmed'}`}>
                <div className="tile__cover"><span>Обложка работы</span></div>
                <div className="tile__meta"><span className="tile__title">{w.title}</span><span className="tile__cat">{w.catLabel}</span></div>
              </Reveal>
            ))}
          </div>
        ))}
      </div>
      <Reveal className="section-more">
        <a className="btn btn--secondary btn--sm" href={DEV_PAGE}>Все работы</a>
      </Reveal>
    </section>
  );
}
