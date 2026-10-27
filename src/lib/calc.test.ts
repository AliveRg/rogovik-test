import { describe, expect, test } from 'vitest';
import {
  INITIAL_STATE, briefChips, briefText, changeQty, plural, rub, selected,
  setOpt, setPlatform, summarize, toggleService, type CalcState
} from './calc';

const DAYS = ['день', 'дня', 'дней'] as const;
const nbsp = (s: string) => s.replace(/[  ]/g, ' ');

describe('plural', () => {
  test.each([[1, 'день'], [2, 'дня'], [5, 'дней'], [11, 'дней'], [21, 'день'], [104, 'дня']])(
    '%i → %s', (n, word) => expect(plural(n, DAYS)).toBe(word)
  );
});

describe('rub', () => {
  test('formats rubles with group separators', () => {
    expect(nbsp(rub(13650))).toBe('13 650 ₽');
  });
});

describe('summarize', () => {
  test('default state: one infographic slide with urgency', () => {
    // 1500 + 30% срочности, без A+
    const s = summarize(INITIAL_STATE);
    expect(s.total).toBe(1950);
    expect(s.urgent).toBe(450);
    expect(s.daysTxt).toBe('1–2 дня');
    expect(s.rows.map(([a]) => a)).toEqual(['Инфографика × 1 слайд', 'Срочность +30%', 'Исходники', 'Площадка']);
  });

  test('adds A+ per marketplace unit and applies urgency on top', () => {
    const state = setOpt(changeQty(INITIAL_STATE, 'info', 4), 'rich', true);   // 5 слайдов
    const s = summarize(state);
    expect(s.mpQty).toBe(5);
    expect(s.rich).toBe(25000);
    expect(s.urgent).toBe(Math.round((7500 + 25000) * 0.3));
    expect(s.total).toBe(7500 + 25000 + 9750);
  });

  test('ignores platform and A+ when no marketplace service is selected', () => {
    const withSite = toggleService(INITIAL_STATE, 'layout') as CalcState;
    const onlySite = toggleService(setOpt(withSite, 'rich', true), 'info') as CalcState;
    const s = summarize(setOpt(onlySite, 'urgent', false));
    expect(s.hasMp).toBe(false);
    expect(s.rich).toBe(0);
    expect(s.total).toBe(25000);
    expect(s.daysTxt).toBe('5–7 дней');
    expect(s.rows.some(([a]) => a === 'Площадка')).toBe(false);
  });
});

describe('state transitions', () => {
  test('does not allow removing the last selected service', () => {
    expect(toggleService(INITIAL_STATE, 'info')).toBeNull();
  });

  test('re-selecting a service starts its quantity from 1 again', () => {
    const a = changeQty(toggleService(INITIAL_STATE, 'ui') as CalcState, 'ui', 5);
    const b = toggleService(toggleService(a, 'ui') as CalcState, 'ui') as CalcState;
    expect(b.q.ui).toBe(1);
  });

  test('clamps quantity between 1 and service max', () => {
    expect(changeQty(INITIAL_STATE, 'info', -3).q.info).toBe(1);
    expect(changeQty(INITIAL_STATE, 'info', 100).q.info).toBe(40);
  });

  test('never mutates the previous state', () => {
    const before = JSON.stringify(INITIAL_STATE);
    toggleService(INITIAL_STATE, 'ui');
    changeQty(INITIAL_STATE, 'info', 2);
    setOpt(INITIAL_STATE, 'rich', true);
    setPlatform(INITIAL_STATE, 'Ozon');
    expect(JSON.stringify(INITIAL_STATE)).toBe(before);
  });

  test('keeps services in catalog order regardless of click order', () => {
    const s = toggleService(toggleService(INITIAL_STATE, 'ui') as CalcState, 'banners') as CalcState;
    expect(selected(s)).toEqual(['info', 'banners', 'ui']);
  });
});

describe('brief', () => {
  test('builds the text that goes into the request form', () => {
    const state = setPlatform(INITIAL_STATE, 'Ozon');
    const text = nbsp(briefText(state, summarize(state)));
    expect(text).toBe('Расчёт с сайта: Инфографика × 1 слайд (срочно, с исходниками, Ozon) — ≈ 1 950 ₽, срок ≈ 1–2 дня.');
  });

  test('deduplicates form chips for site services', () => {
    const s = toggleService(toggleService(INITIAL_STATE, 'layout') as CalcState, 'dev') as CalcState;
    expect(briefChips(summarize(s))).toEqual(['Инфографика', 'Сайт']);
  });
});
