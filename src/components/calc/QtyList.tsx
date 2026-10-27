import { useEffect, useRef, useState } from 'react';
import { ORDER, SVC, selected } from '../../lib/calc';
import type { CalcState, SvcKey } from '../../lib/calc';
import { reduceMotion } from '../../hooks/useReducedMotion';

type Phase = 'enter' | 'idle' | 'leave';
interface Row { phase: Phase; q?: number }     // q — снимок количества у уходящей строки
type Rows = Partial<Record<SvcKey, Row>>;

type Props = {
  state: CalcState;
  onQty: (k: SvcKey, delta: number) => void;
};

function nextRows(prev: Rows, sel: SvcKey[], prevQ: CalcState['q']): Rows {
  const out: Rows = {};
  for (const k of ORDER) {
    const row = prev[k];
    if (sel.includes(k)) out[k] = !row || row.phase === 'leave' ? { phase: reduceMotion ? 'idle' : 'enter' } : row;
    else if (row && !reduceMotion) out[k] = row.phase === 'leave' ? row : { phase: 'leave', q: prevQ[k] };
  }
  return out;
}

// строки количества: по одной на каждую выбранную услугу
export function QtyList({ state, onQty }: Props) {
  const sel = selected(state);
  const selKey = sel.join(',');
  const [rows, setRows] = useState<Rows>(() => Object.fromEntries(sel.map((k) => [k, { phase: 'idle' }])));
  const prevQ = useRef(state.q);

  useEffect(() => {
    setRows((prev) => nextRows(prev, selKey.split(',') as SvcKey[], prevQ.current));
  }, [selKey]);
  useEffect(() => { prevQ.current = state.q; }, [state.q]);

  const handleAnimationEnd = (k: SvcKey) => setRows((prev) => {
    const row = prev[k];
    if (!row) return prev;
    if (row.phase === 'leave') { const { [k]: _gone, ...rest } = prev; return rest; }
    return row.phase === 'enter' ? { ...prev, [k]: { phase: 'idle' } } : prev;
  });

  return (
    <div className="calc-qtys">
      {ORDER.filter((k) => rows[k]).map((k) => {
        const row = rows[k] as Row;
        const s = SVC[k];
        const q = state.q[k] ?? row.q ?? 1;
        const phaseCls = row.phase === 'idle' ? '' : ` is-${row.phase}`;
        return (
          <div key={k} className={`calc-box calc-qty${phaseCls}`} onAnimationEnd={() => handleAnimationEnd(k)}>
            <span className="opt__text"><b>{s.qLabel}</b><small>{s.name} · {s.note}</small></span>
            <div className="stepper">
              <button type="button" className="stepper__btn" aria-label="Меньше" disabled={q <= 1} onClick={() => onQty(k, -1)}>
                <svg viewBox="0 0 24 24"><path d="M6 12h12" /></svg>
              </button>
              <output className="stepper__val" aria-live="polite">{q}</output>
              <button type="button" className="stepper__btn" aria-label="Больше" disabled={q >= s.max} onClick={() => onQty(k, 1)}>
                <svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12" /></svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
