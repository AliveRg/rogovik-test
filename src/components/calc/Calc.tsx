import { useEffect, useMemo, useRef, useState } from 'react';
import { QtyList } from './QtyList';
import {
  INITIAL_STATE, ORDER, PLATFORMS, SVC, briefChips, briefText, changeQty,
  rub, setOpt, setPlatform, summarize, toggleService
} from '../../lib/calc';
import type { CalcState, OptKey, SvcKey } from '../../lib/calc';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { DEV_PAGE, TELEGRAM_URL } from '../../data/content';

type Props = {
  isOpen: boolean;
  onSend: (text: string, chips: string[]) => void;
};

const TOTAL_MS = 780;
const FOCUS_DELAY_MS = 60;
const CASES = 4;
const STEPS = ['Услуга', 'Параметры', 'Контакты'];
const OPTIONS: Array<{ key: OptKey; title: string; hint: string; mpOnly?: boolean }> = [
  { key: 'urgent', title: 'Срочно — до 3 дней', hint: '+30% к стоимости' },
  { key: 'rich', title: 'Рич-контент / A+ блок', hint: '+5 000 ₽ за каждый блок', mpOnly: true },
  { key: 'sources', title: 'Исходники PSD / Figma', hint: 'бесплатно' }
];
const roundTen = (v: number) => Math.round(v / 10) * 10;

export function Calc({ isOpen, onSend }: Props) {
  const [state, setState] = useState<CalcState>(INITIAL_STATE);
  const [step, setStep] = useState(1);
  const [shake, setShake] = useState<SvcKey | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const summary = useMemo(() => summarize(state), [state]);
  const total = useAnimatedNumber(summary.total, { duration: TOTAL_MS, round: roundTen });
  const disabledCls = summary.hasMp ? '' : ' is-disabled';

  useEffect(() => {
    if (!isOpen) return;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    const t = setTimeout(() => titleRef.current?.focus({ preventScroll: true }), FOCUS_DELAY_MS);
    return () => clearTimeout(t);
  }, [isOpen]);

  const update = (next: CalcState) => { setState(next); setStep(2); };

  const handleService = (k: SvcKey) => {
    const next = toggleService(state, k);
    if (next) { setState(next); return; }
    setShake(null);                                        // хотя бы одна услуга должна остаться
    requestAnimationFrame(() => setShake(k));
  };

  const handleSend = () => {
    setStep(3);
    onSend(briefText(state, summary), briefChips(summary));
  };

  return (
    <div className={`calc${isOpen ? ' is-open' : ''}`} id="calc" role="dialog" aria-modal="true" aria-labelledby="calcTitle" aria-hidden={!isOpen}>
      <div className="calc__backdrop" />
      <div className="calc__scroll" ref={scrollRef}>
        <section className="calc__sheet">
          <header className="calc__head">
            <div>
              <h2 className="calc__title" id="calcTitle" tabIndex={-1} ref={titleRef}>Рассчитать проект</h2>
              <p className="calc__sub">Выберите услугу и параметры — покажем ориентировочную стоимость и срок</p>
            </div>
            <div className="calc__steps" aria-hidden="true">
              {STEPS.map((label, i) => (
                <span key={label} className={`calc__step${i + 1 <= step ? ' is-active' : ''}`}>{i + 1}&nbsp;&nbsp;{label}</span>
              ))}
            </div>
          </header>

          <div className="calc__grid">
            <div className="calc__main">
              <p className={`calc__label${disabledCls}`} id="calcPlatformLabel">Площадка</p>
              <div className={`calc__platforms${disabledCls}`} role="radiogroup" aria-labelledby="calcPlatformLabel">
                {PLATFORMS.map((p) => (
                  <button key={p} type="button" role="radio" aria-checked={state.platform === p} className={`chip${state.platform === p ? ' is-active' : ''}`} onClick={() => update(setPlatform(state, p))}>
                    {p}
                  </button>
                ))}
              </div>

              <p className="calc__label">Что нужно сделать <span className="calc__hint">— можно выбрать несколько</span></p>
              <div className="calc__services" role="group" aria-label="Услуги">
                {ORDER.map((k) => {
                  const on = state.q[k] !== undefined;
                  const cls = `calc-svc${on ? ' is-selected' : ''}${shake === k ? ' is-shake' : ''}`;
                  return (
                    <button key={k} type="button" className={cls} role="checkbox" aria-checked={on} onClick={() => handleService(k)} onAnimationEnd={() => setShake(null)}>
                      <span className="calc-svc__dot" /><span className="calc-svc__check" /><b>{SVC[k].name}</b><small>{SVC[k].priceHint}</small>
                    </button>
                  );
                })}
              </div>

              <p className="calc__label">Параметры</p>
              <QtyList state={state} onQty={(k, d) => update(changeQty(state, k, d))} />
              <div className="calc-box calc-opts">
                {OPTIONS.map((o) => (
                  <label key={o.key} className={`opt${o.mpOnly ? disabledCls : ''}`}>
                    <span className="opt__text"><b>{o.title}</b><small>{o.hint}</small></span>
                    <input type="checkbox" className="switch" checked={state.opts[o.key]} onChange={(e) => update(setOpt(state, o.key, e.target.checked))} />
                  </label>
                ))}
              </div>
            </div>

            <aside className="calc__sum">
              <p className="calc__label calc__label--sum">Итого</p>
              <p className="calc__total">≈ {rub(total)}</p>
              <p className="calc__days">срок ≈ {summary.daysTxt}</p>
              <div className="calc__line" />
              <dl className="calc__rows">
                {summary.rows.map(([a, b]) => [<dt key={`t-${a}`}>{a}</dt>, <dd key={`d-${a}`}>{b}</dd>])}
              </dl>
              <div className="calc__line" />
              <button type="button" className="btn btn--primary btn--pill calc__send" onClick={handleSend}>Отправить расчёт</button>
              <a className="btn btn--secondary btn--pill calc__tg" href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">Написать в Telegram</a>
              <p className="calc__note">Цена ориентировочная — точная после брифа</p>
            </aside>
          </div>

          <div className="calc__cases">
            <div className="calc__cases-head">
              <div>
                <h3 className="calc__h3">Кейс-бар</h3>
                <p className="calc__sub calc__sub--sm">Посмотрите наши лучшие работы в этих направлениях</p>
              </div>
              <a className="btn btn--secondary btn--sm" href={DEV_PAGE}>Смотреть кейсы</a>
            </div>
            {/* подписи — по выбранным направлениям */}
            <div className="case-bar">
              {Array.from({ length: CASES }, (_, i) => (
                <a key={i} className="case-bar__item" href={DEV_PAGE}><span>работа</span><small>{summary.items[i % summary.items.length].svc.name}</small></a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
