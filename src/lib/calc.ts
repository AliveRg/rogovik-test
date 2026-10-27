/* =========================================================
   Калькулятор: цены и сроки (черновые, правятся здесь)
   ========================================================= */

export type SvcKey = 'info' | 'banners' | 'layout' | 'dev' | 'turnkey' | 'ui';
export type OptKey = 'urgent' | 'rich' | 'sources';
export type PluralForms = readonly [string, string, string];

export interface ServiceDef {
  name: string;
  unit: PluralForms;
  qLabel: string;
  note: string;
  priceHint: string;
  max: number;
  mp: boolean;            // услуга для маркетплейсов (к ней относятся площадка и A+)
  brief: string;          // какой чип отметить в форме заявки
  price: (q: number) => number;
  days: (q: number) => readonly [number, number];
}

export interface CalcState {
  q: Partial<Record<SvcKey, number>>;   // выбранные услуги и их количество
  opts: Record<OptKey, boolean>;
  platform: string;
}

export interface CalcItem {
  key: SvcKey;
  svc: ServiceDef;
  q: number;
  base: number;
}

export interface CalcSummary {
  items: CalcItem[];
  total: number;
  daysTxt: string;
  rich: number;
  urgent: number;
  mpQty: number;
  hasMp: boolean;
  rows: Array<readonly [string, string]>;
}

const DAYS: PluralForms = ['день', 'дня', 'дней'];
const PAGES: PluralForms = ['страница', 'страницы', 'страниц'];
export const RICH_PRICE = 5000;   // A+ / рич-контент — за каждый блок (на каждую единицу маркетплейс-услуги)
export const URGENT = 0.3;        // срочность +30%
const URGENT_DAYS = 0.6;          // срочно — сроки ×0.6

export const SVC: Record<SvcKey, ServiceDef> = {
  info:    { name: 'Инфографика',   unit: ['слайд', 'слайда', 'слайдов'],    qLabel: 'Количество слайдов',  note: '≈ 1 500 ₽ за слайд',                     priceHint: '≈ от 1 500 ₽ / слайд', max: 40, mp: true,  brief: 'Инфографика', price: (q) => 1500 * q,                days: (q) => [Math.ceil(q / 4), Math.ceil(q / 3) + 1] },
  banners: { name: 'Баннеры',       unit: ['баннер', 'баннера', 'баннеров'], qLabel: 'Количество баннеров', note: '≈ 2 000 ₽ за баннер',                    priceHint: '≈ от 2 000 ₽',         max: 30, mp: true,  brief: 'Баннеры',     price: (q) => 2000 * q,                days: (q) => [Math.ceil(q / 3), Math.ceil(q / 2) + 1] },
  layout:  { name: 'Макет сайта',   unit: PAGES,                             qLabel: 'Количество страниц',  note: '≈ 25 000 ₽, каждая следующая +8 000 ₽',  priceHint: '≈ от 25 000 ₽',        max: 20, mp: false, brief: 'Сайт',        price: (q) => 25000 + 8000 * (q - 1),  days: (q) => [5 + 2 * (q - 1), 7 + 3 * (q - 1)] },
  dev:     { name: 'Вёрстка',       unit: PAGES,                             qLabel: 'Количество страниц',  note: '≈ 20 000 ₽, каждая следующая +7 000 ₽',  priceHint: '≈ от 20 000 ₽',        max: 20, mp: false, brief: 'Сайт',        price: (q) => 20000 + 7000 * (q - 1),  days: (q) => [5 + 2 * (q - 1), 8 + 3 * (q - 1)] },
  turnkey: { name: 'Сайт под ключ', unit: PAGES,                             qLabel: 'Количество страниц',  note: '≈ 60 000 ₽, каждая следующая +15 000 ₽', priceHint: '≈ от 60 000 ₽',        max: 20, mp: false, brief: 'Сайт',        price: (q) => 60000 + 15000 * (q - 1), days: (q) => [14 + 3 * (q - 1), 21 + 4 * (q - 1)] },
  ui:      { name: 'UI / UX',       unit: ['экран', 'экрана', 'экранов'],    qLabel: 'Количество экранов',  note: '≈ 3 000 ₽ за экран',                     priceHint: '≈ от 3 000 ₽ / экран', max: 60, mp: false, brief: 'UI / UX',     price: (q) => 3000 * q,                days: (q) => [Math.ceil(q / 3), Math.ceil(q / 2) + 1] }
};

export const ORDER = Object.keys(SVC) as SvcKey[];
export const PLATFORMS = ['WB', 'Ozon', 'Яндекс Маркет', 'Авито', 'Другое'] as const;

export const INITIAL_STATE: CalcState = {
  q: { info: 1 },
  opts: { urgent: true, rich: false, sources: true },
  platform: 'WB'
};

export function plural(n: number, f: PluralForms): string {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return f[2];
  if (b > 1 && b < 5) return f[1];
  if (b === 1) return f[0];
  return f[2];
}

export const rub = (n: number): string => Math.round(n).toLocaleString('ru-RU') + ' ₽';

export const selected = (state: CalcState): SvcKey[] => ORDER.filter((k) => state.q[k] !== undefined);

const itemLabel = (it: CalcItem): string => `${it.svc.name} × ${it.q} ${plural(it.q, it.svc.unit)}`;

/* --- переходы состояния (всегда возвращают новый объект) --- */

// null — нельзя снять последнюю услугу
export function toggleService(state: CalcState, k: SvcKey): CalcState | null {
  if (state.q[k] === undefined) return { ...state, q: { ...state.q, [k]: 1 } };
  if (selected(state).length === 1) return null;
  const { [k]: _removed, ...rest } = state.q;      // сброс: при повторном выборе снова с 1
  return { ...state, q: rest };
}

export function changeQty(state: CalcState, k: SvcKey, delta: number): CalcState {
  const cur = state.q[k];
  if (cur === undefined) return state;
  const next = Math.min(SVC[k].max, Math.max(1, cur + delta));
  return { ...state, q: { ...state.q, [k]: next } };
}

export const setOpt = (state: CalcState, k: OptKey, on: boolean): CalcState =>
  ({ ...state, opts: { ...state.opts, [k]: on } });

export const setPlatform = (state: CalcState, platform: string): CalcState => ({ ...state, platform });

/* --- расчёт --- */

export function summarize(state: CalcState): CalcSummary {
  const o = state.opts;
  const items: CalcItem[] = selected(state).map((key) => {
    const q = state.q[key] as number;
    return { key, svc: SVC[key], q, base: SVC[key].price(q) };
  });
  const baseSum = items.reduce((a, it) => a + it.base, 0);
  const mpQty = items.filter((it) => it.svc.mp).reduce((a, it) => a + it.q, 0);
  const hasMp = mpQty > 0;
  const rich = hasMp && o.rich ? RICH_PRICE * mpQty : 0;     // 5 000 ₽ × каждый блок
  const urgent = o.urgent ? Math.round((baseSum + rich) * URGENT) : 0;
  const total = baseSum + rich + urgent;

  // срок: самая долгая услуга задаёт минимум, сумма — максимум
  let d1 = Math.max(...items.map((it) => it.svc.days(it.q)[0]));
  let d2 = items.reduce((a, it) => a + it.svc.days(it.q)[1], 0);
  if (o.urgent) { d1 = Math.max(1, Math.ceil(d1 * URGENT_DAYS)); d2 = Math.max(d1, Math.ceil(d2 * URGENT_DAYS)); }
  const daysTxt = d1 === d2 ? `${d1} ${plural(d1, DAYS)}` : `${d1}–${d2} ${plural(d2, DAYS)}`;

  const rows: Array<readonly [string, string]> = items.map((it) => [itemLabel(it), rub(it.base)] as const);
  if (rich) rows.push([`Рич-контент / A+ × ${mpQty}`, rub(rich)]);
  if (urgent) rows.push(['Срочность +30%', rub(urgent)]);
  rows.push(['Исходники', o.sources ? 'бесплатно' : 'не нужны']);
  if (hasMp) rows.push(['Площадка', state.platform]);

  return { items, total, daysTxt, rich, urgent, mpQty, hasMp, rows };
}

// текст, который уходит в поле «Задача» формы заявки
export function briefText(state: CalcState, s: CalcSummary): string {
  const list = s.items.map(itemLabel).join(', ');
  const extra = [
    s.urgent ? 'срочно' : '',
    s.rich ? `A+ × ${s.mpQty}` : '',
    state.opts.sources ? 'с исходниками' : '',
    s.hasMp ? state.platform : ''
  ].filter(Boolean).join(', ');
  return `Расчёт с сайта: ${list}${extra ? ' (' + extra + ')' : ''} — ≈ ${rub(s.total)}, срок ≈ ${s.daysTxt}.`;
}

export const briefChips = (s: CalcSummary): string[] => [...new Set(s.items.map((it) => it.svc.brief))];
