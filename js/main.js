/* =========================================================
   VITRINA — главная: анимации и интерактив
   Скролл нативный: ничего не перехватываем, только читаем
   позицию и двигаем transform на GPU.
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- старт ---------- */
  requestAnimationFrame(() => root.classList.add('is-loaded'));

  /* ---------- тост ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(html, ms = 3200) {
    if (!toastEl) return;
    toastEl.innerHTML = html;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), ms);
  }

  /* ---------- плавное появление блоков ---------- */
  const revealEls = $$('[data-reveal]');

  function finishReveal(el) {
    const delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    setTimeout(() => {
      el.removeAttribute('data-reveal');
      el.classList.remove('is-in');
    }, delay + 950);
  }

  function reveal(el) {
    el.classList.add('is-in');
    finishReveal(el);
    if (el.matches('.stat')) countUp(el);
    $$('.stat', el).forEach(countUp);
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.removeAttribute('data-reveal'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        reveal(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- счётчики в цифрах ---------- */
  function countUp(stat) {
    const num = $('[data-count]', stat) || (stat.matches('[data-count]') ? stat : null);
    if (!num || num.dataset.done || reduceMotion) return;
    num.dataset.done = '1';
    const target = parseFloat(num.dataset.count);
    const suffix = num.dataset.suffix || '';
    const dur = 1560;                          // +30% к длительности
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);       // плавнее тормозит под конец
      num.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- сайдбар: активный пункт по скроллу ---------- */
  const spyLinks = $$('.navbtn[data-spy]');
  const spyTargets = spyLinks
    .map((a) => (a.dataset.spy === 'top' ? $('#hero') : document.getElementById(a.dataset.spy)))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.id === 'hero' ? 'top' : e.target.id;
        spyLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.spy === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyTargets.forEach((t) => spy.observe(t));
  }

  // на тач-устройствах сайдбар раскрывается тапом по логотипу
  const sidebar = $('#sidebar');
  if (sidebar && window.matchMedia('(hover: none)').matches) {
    $('.sidebar__logo', sidebar).addEventListener('click', (e) => {
      if (root.classList.contains('calc-open')) return; // в поп-апе лого = «Закрыть»
      if (!sidebar.classList.contains('is-open')) { e.preventDefault(); sidebar.classList.add('is-open'); }
    });
    $$('.navbtn', sidebar).forEach((a) => a.addEventListener('click', () => sidebar.classList.remove('is-open')));
    document.addEventListener('click', (e) => { if (!sidebar.contains(e.target)) sidebar.classList.remove('is-open'); });
  }

  /* ---------- бар: сверху на первом экране, по центру при прокрутке ---------- */
  const toTop = $('#toTop');
  if (sidebar) {
    let docked = false, ticking = false;
    const dock = () => {
      ticking = false;
      const y = window.scrollY;
      const want = docked ? y > 40 : y > 80;     // небольшой гистерезис, чтобы не дёргался
      if (want === docked) return;
      docked = want;
      sidebar.classList.toggle('is-docked', docked);
      if (toTop) toTop.classList.toggle('is-shown', docked);
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(dock); } }, { passive: true });
    dock();
  }
  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      toTop.blur();
    });
  }

  /* ---------- поп-ап «Рассчитать проект» ---------- */
  const calc = $('#calc');
  if (calc && sidebar) {
    const scroller = $('#calcScroll', calc);
    const title = $('#calcTitle', calc);
    const logo = $('.sidebar__logo', sidebar);
    const behind = $$('.page, #hero, #toTop');
    let opener = null;
    let pushed = false;
    const isOpen = () => root.classList.contains('calc-open');

    function openCalc(from) {
      if (isOpen()) return;
      opener = from || document.activeElement;
      root.style.setProperty('--sbw', (window.innerWidth - root.clientWidth) + 'px');
      root.classList.add('calc-open');                // блокируем скролл сайта
      calc.classList.add('is-open');
      calc.setAttribute('aria-hidden', 'false');
      sidebar.classList.add('is-calc');               // лого → «Закрыть» (анимация в CSS)
      logo.setAttribute('aria-label', 'Закрыть калькулятор');
      behind.forEach((el) => { el.inert = true; });
      scroller.scrollTop = 0;
      if (location.hash !== '#calc') { history.pushState({ calc: true }, '', '#calc'); pushed = true; }
      setTimeout(() => title.focus({ preventScroll: true }), 60);
    }

    // mode: 'back' — крестик/Esc (шаг назад в истории), 'replace' — уход в раздел сайта, 'pop' — кнопка «назад»
    function closeCalc(mode = 'back') {
      if (!isOpen()) return;
      calc.classList.remove('is-open');
      calc.setAttribute('aria-hidden', 'true');
      sidebar.classList.remove('is-calc', 'is-open');
      // свернуть раскрытый бар вместе с поп-апом, даже если курсор на нём
      if (sidebar.contains(document.activeElement)) document.activeElement.blur();
      if (sidebar.matches(':hover')) sidebar.classList.add('no-expand');
      logo.setAttribute('aria-label', 'VITRINA — на главную');
      behind.forEach((el) => { el.inert = false; });
      root.classList.remove('calc-open');
      if (mode !== 'pop') {
        if (mode === 'back' && pushed && history.state && history.state.calc) history.back();
        else if (location.hash === '#calc') history.replaceState(null, '', location.pathname + location.search);
      }
      pushed = false;
      if (mode === 'back' && opener && opener.focus) opener.focus({ preventScroll: true });
    }

    $$('[data-open-calc]').forEach((b) => b.addEventListener('click', () => openCalc(b)));
    sidebar.addEventListener('mouseleave', () => sidebar.classList.remove('no-expand'));
    logo.addEventListener('click', (e) => { if (isOpen()) { e.preventDefault(); closeCalc('back'); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) closeCalc('back'); });
    window.addEventListener('popstate', () => {
      if (isOpen() && location.hash !== '#calc') closeCalc('pop');
      else if (!isOpen() && location.hash === '#calc') openCalc();
    });

    // пункты бара в поп-апе: закрыть и перейти к разделу
    function goTo(hash) {
      if (hash === '#top') window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      else { const t = $(hash); if (t) t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }
    }
    $$('.navbtn', sidebar).forEach((a) => a.addEventListener('click', (e) => {
      if (!isOpen()) return;
      e.preventDefault();
      closeCalc('replace');
      requestAnimationFrame(() => goTo(a.getAttribute('href')));
    }));

    /* --- расчёт (цены черновые, правятся здесь) --- */
    const plural = (n, f) => {
      const a = Math.abs(n) % 100, b = a % 10;
      if (a > 10 && a < 20) return f[2];
      if (b > 1 && b < 5) return f[1];
      if (b === 1) return f[0];
      return f[2];
    };
    const rub = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
    const DAYS = ['день', 'дня', 'дней'];
    const PAGES = ['страница', 'страницы', 'страниц'];
    const RICH_PRICE = 5000;   // A+ / рич-контент — за каждый блок (на каждую единицу маркетплейс-услуги)
    const URGENT = 0.3;        // срочность +30%
    // mp: true — услуга для маркетплейсов (к ней относятся площадка и A+)
    const SVC = {
      info:    { name: 'Инфографика',   unit: ['слайд', 'слайда', 'слайдов'],    qLabel: 'Количество слайдов',  note: '≈ 1 500 ₽ за слайд',                        max: 40, mp: true,  brief: 'Инфографика', price: (q) => 1500 * q,                days: (q) => [Math.ceil(q / 4), Math.ceil(q / 3) + 1] },
      banners: { name: 'Баннеры',       unit: ['баннер', 'баннера', 'баннеров'], qLabel: 'Количество баннеров', note: '≈ 2 000 ₽ за баннер',                       max: 30, mp: true,  brief: 'Баннеры',     price: (q) => 2000 * q,                days: (q) => [Math.ceil(q / 3), Math.ceil(q / 2) + 1] },
      layout:  { name: 'Макет сайта',   unit: PAGES,                             qLabel: 'Количество страниц',  note: '≈ 25 000 ₽, каждая следующая +8 000 ₽',     max: 20, mp: false, brief: 'Сайт',        price: (q) => 25000 + 8000 * (q - 1),  days: (q) => [5 + 2 * (q - 1), 7 + 3 * (q - 1)] },
      dev:     { name: 'Вёрстка',       unit: PAGES,                             qLabel: 'Количество страниц',  note: '≈ 20 000 ₽, каждая следующая +7 000 ₽',     max: 20, mp: false, brief: 'Сайт',        price: (q) => 20000 + 7000 * (q - 1),  days: (q) => [5 + 2 * (q - 1), 8 + 3 * (q - 1)] },
      turnkey: { name: 'Сайт под ключ', unit: PAGES,                             qLabel: 'Количество страниц',  note: '≈ 60 000 ₽, каждая следующая +15 000 ₽',    max: 20, mp: false, brief: 'Сайт',        price: (q) => 60000 + 15000 * (q - 1), days: (q) => [14 + 3 * (q - 1), 21 + 4 * (q - 1)] },
      ui:      { name: 'UI / UX',       unit: ['экран', 'экрана', 'экранов'],    qLabel: 'Количество экранов',  note: '≈ 3 000 ₽ за экран',                        max: 60, mp: false, brief: 'UI / UX',     price: (q) => 3000 * q,                days: (q) => [Math.ceil(q / 3), Math.ceil(q / 2) + 1] }
    };
    const ORDER = Object.keys(SVC);
    // выбранные услуги и их количество; количество всегда стартует с 1
    const state = { q: { info: 1 }, opts: { urgent: true, rich: false, sources: true }, platform: 'WB' };
    const selected = () => ORDER.filter((k) => k in state.q);
    let summary = null;

    const elTotal = $('#calcTotal'), elDays = $('#calcDays'), elRows = $('#calcRows');
    const elQtys = $('#calcQtys'), elPlatforms = $('#calcPlatforms'), elPlatformLabel = $('#calcPlatformLabel');
    const elRich = $('#calcRichOpt');
    const caseCats = $$('[data-case-cat]', calc);
    const step = (n) => $$('.calc__step', calc).forEach((s) => s.classList.toggle('is-active', +s.dataset.step <= n));

    let shownTotal = null, totalRaf = 0;
    function animateTotal(to) {
      cancelAnimationFrame(totalRaf);
      if (shownTotal === null || reduceMotion) { shownTotal = to; elTotal.textContent = '≈ ' + rub(to); return; }
      const from = shownTotal, dur = 780, t0 = performance.now();
      const stepFn = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 4);              // как у цифр в «О нас»: быстро, потом плавно тормозит
        const v = from + (to - from) * eased;
        shownTotal = p < 1 ? v : to;
        elTotal.textContent = '≈ ' + rub(p < 1 ? Math.round(v / 10) * 10 : to);
        if (p < 1) totalRaf = requestAnimationFrame(stepFn);
      };
      totalRaf = requestAnimationFrame(stepFn);
    }

    // строки количества: по одной на каждую выбранную услугу
    function qtyRow(k) {
      const s = SVC[k];
      const row = document.createElement('div');
      row.className = 'calc-box calc-qty';
      row.dataset.row = k;
      row.innerHTML = `
        <span class="opt__text"><b>${s.qLabel}</b><small>${s.name} · ${s.note}</small></span>
        <div class="stepper">
          <button type="button" class="stepper__btn" data-qty="-1" aria-label="Меньше"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button>
          <output class="stepper__val" aria-live="polite">1</output>
          <button type="button" class="stepper__btn" data-qty="1" aria-label="Больше"><svg viewBox="0 0 24 24"><path d="M6 12h12M12 6v12"/></svg></button>
        </div>`;
      return row;
    }
    function syncRows(animate) {
      const sel = selected();
      $$('.calc-qty', elQtys).forEach((row) => {
        if (!sel.includes(row.dataset.row) && !row.classList.contains('is-leave')) {
          row.classList.add('is-leave');
          row.addEventListener('animationend', () => row.remove(), { once: true });
          if (!animate || reduceMotion) row.remove();
        }
      });
      sel.forEach((k, i) => {
        let row = $(`.calc-qty[data-row="${k}"]:not(.is-leave)`, elQtys);
        if (!row) {
          row = qtyRow(k);
          if (animate && !reduceMotion) { row.classList.add('is-enter'); row.addEventListener('animationend', () => row.classList.remove('is-enter'), { once: true }); }
          const next = sel.slice(i + 1).map((n) => $(`.calc-qty[data-row="${n}"]:not(.is-leave)`, elQtys)).find(Boolean);
          elQtys.insertBefore(row, next || null);
        }
        const s = SVC[k], q = state.q[k];
        $('.stepper__val', row).textContent = q;
        $('[data-qty="-1"]', row).disabled = q <= 1;
        $('[data-qty="1"]', row).disabled = q >= s.max;
      });
    }

    function render() {
      const sel = selected();
      const o = state.opts;
      const items = sel.map((k) => ({ k, s: SVC[k], q: state.q[k], base: SVC[k].price(state.q[k]) }));
      const baseSum = items.reduce((a, it) => a + it.base, 0);
      const mpQty = items.filter((it) => it.s.mp).reduce((a, it) => a + it.q, 0);
      const hasMp = mpQty > 0;
      const rich = hasMp && o.rich ? RICH_PRICE * mpQty : 0;     // 5 000 ₽ × каждый блок
      const urgent = o.urgent ? Math.round((baseSum + rich) * URGENT) : 0;
      const total = baseSum + rich + urgent;

      // срок: самая долгая услуга задаёт минимум, сумма — максимум
      let d1 = Math.max(...items.map((it) => it.s.days(it.q)[0]));
      let d2 = items.reduce((a, it) => a + it.s.days(it.q)[1], 0);
      if (o.urgent) { d1 = Math.max(1, Math.ceil(d1 * 0.6)); d2 = Math.max(d1, Math.ceil(d2 * 0.6)); }
      const daysTxt = d1 === d2 ? `${d1} ${plural(d1, DAYS)}` : `${d1}–${d2} ${plural(d2, DAYS)}`;

      syncRows(true);
      elPlatforms.classList.toggle('is-disabled', !hasMp);
      elPlatformLabel.classList.toggle('is-disabled', !hasMp);
      elRich.classList.toggle('is-disabled', !hasMp);

      animateTotal(total);
      elDays.textContent = 'срок ≈ ' + daysTxt;
      const rows = items.map((it) => [`${it.s.name} × ${it.q} ${plural(it.q, it.s.unit)}`, rub(it.base)]);
      if (rich) rows.push([`Рич-контент / A+ × ${mpQty}`, rub(rich)]);
      if (urgent) rows.push(['Срочность +30%', rub(urgent)]);
      rows.push(['Исходники', o.sources ? 'бесплатно' : 'не нужны']);
      if (hasMp) rows.push(['Площадка', state.platform]);
      elRows.innerHTML = rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');

      // подписи в кейс-баре — по выбранным направлениям
      caseCats.forEach((el, i) => { el.textContent = items[i % items.length].s.name; });

      summary = { items, total, daysTxt, rich, urgent, mpQty, hasMp };
    }

    $$('.calc-svc', calc).forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.svc;
      if (k in state.q) {
        if (selected().length === 1) {                     // хотя бы одна услуга должна остаться
          b.classList.remove('is-shake'); void b.offsetWidth; b.classList.add('is-shake');
          return;
        }
        delete state.q[k];                                 // сброс: при повторном выборе снова с 1
      } else {
        state.q[k] = 1;
      }
      const on = k in state.q;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', String(on));
      render();
    }));
    elQtys.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-qty]');
      if (!btn) return;
      const k = btn.closest('.calc-qty').dataset.row;
      const s = SVC[k];
      state.q[k] = Math.min(s.max, Math.max(1, state.q[k] + +btn.dataset.qty));
      step(2); render();
    });
    $$('[data-opt]', calc).forEach((c) => c.addEventListener('change', () => {
      state.opts[c.dataset.opt] = c.checked; step(2); render();
    }));
    $$('[data-platform]', calc).forEach((b) => b.addEventListener('click', () => {
      state.platform = b.dataset.platform;
      $$('[data-platform]', calc).forEach((x) => x.classList.toggle('is-active', x === b));
      step(2); render();
    }));
    render();

    // «Отправить расчёт» → поп-ап закрывается, расчёт уходит в форму, форма подсвечивается
    const spot = $('#spotlight');
    $('#calcSend').addEventListener('click', () => {
      const { items, total, daysTxt, rich, urgent, mpQty, hasMp } = summary;
      const list = items.map((it) => `${it.s.name} × ${it.q} ${plural(it.q, it.s.unit)}`).join(', ');
      const extra = [urgent ? 'срочно' : '', rich ? `A+ × ${mpQty}` : '', state.opts.sources ? 'с исходниками' : '', hasMp ? state.platform : ''].filter(Boolean).join(', ');
      const text = `Расчёт с сайта: ${list}${extra ? ' (' + extra + ')' : ''} — ≈ ${rub(total)}, срок ≈ ${daysTxt}.`;
      const brief = $('#brief');
      const task = $('textarea[name="task"]', brief);
      if (task) task.value = task.value.trim() ? task.value.trim() + '\n' + text : text;
      const briefs = new Set(items.map((it) => it.s.brief));
      $$('[data-toggle]', brief).forEach((c) => { if (briefs.has(c.textContent.trim())) c.classList.add('is-active'); });
      step(3);

      // показать блок заявки сразу (без появления по скроллу), чтобы подсветка легла поверх
      $$('#contact [data-reveal]').forEach((el) => { el.removeAttribute('data-reveal'); el.classList.remove('is-in'); });
      closeCalc('replace');
      if (reduceMotion) {
        brief.scrollIntoView({ block: 'center' });
        toast('Расчёт перенесён в заявку — осталось оставить контакт');
        return;
      }
      spot.classList.add('is-on');                 // всё остаётся приглушённым
      requestAnimationFrame(() => brief.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      setTimeout(() => {
        brief.classList.add('is-spot');            // форма с расчётом светится и мерцает
        toast('Расчёт перенесён в заявку — осталось оставить контакт', 4000);
      }, 750);
      setTimeout(() => spot.classList.remove('is-on'), 3300);   // потом всё проявляется
      setTimeout(() => {
        brief.classList.remove('is-spot');
        const n = $('input[name="name"]', brief);
        if (n) n.focus({ preventScroll: true });
      }, 3950);
    });

    /* --- До / После: перетаскивание --- */
    const ba = $('#ba');
    if (ba) {
      const set = (p) => ba.style.setProperty('--p', Math.min(0.98, Math.max(0.02, p)).toFixed(4));
      const fromX = (x) => { const r = ba.getBoundingClientRect(); set((x - r.left - 8) / (r.width - 16)); };
      ba.addEventListener('pointerdown', (e) => { ba.setPointerCapture(e.pointerId); ba.classList.add('is-drag'); fromX(e.clientX); });
      ba.addEventListener('pointermove', (e) => { if (ba.classList.contains('is-drag')) fromX(e.clientX); });
      ['pointerup', 'pointercancel'].forEach((t) => ba.addEventListener(t, () => ba.classList.remove('is-drag')));
      $('.ba__handle', ba).addEventListener('keydown', (e) => {
        const p = parseFloat(getComputedStyle(ba).getPropertyValue('--p')) || 0.5;
        if (e.key === 'ArrowLeft') { set(p - 0.05); e.preventDefault(); }
        if (e.key === 'ArrowRight') { set(p + 0.05); e.preventDefault(); }
      });
    }

    if (location.hash === '#calc') openCalc();
  }

  /* ---------- язык (EN пока в разработке) ---------- */
  const lang = $('.lang');
  if (lang) {
    $('[data-lang-btn="en"]', lang).addEventListener('click', () => {
      toast('Английская версия сайта в разработке');
    });
  }

  /* ---------- фильтр работ ---------- */
  const filterBtns = $$('[data-filter]');
  const tiles = $$('.tile[data-cat]');
  filterBtns.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
    let shown = 0;
    tiles.forEach((t) => {
      const on = f === 'all' || t.dataset.cat === f;
      t.classList.toggle('is-dimmed', !on);
      if (on) shown++;
    });
    if (!shown) toast('В этой категории работы скоро появятся');
  }));

  /* ---------- FAQ ---------- */
  $$('.qa').forEach((qa) => {
    const btn = $('.qa__q', qa);
    btn.addEventListener('click', () => {
      const open = !qa.classList.contains('is-open');
      $$('.qa.is-open').forEach((o) => { if (o !== qa) { o.classList.remove('is-open'); $('.qa__q', o).setAttribute('aria-expanded', 'false'); } });
      qa.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- форма-бриф (бэкенд ещё не подключён) ---------- */
  $$('[data-toggle]').forEach((c) => c.addEventListener('click', () => c.classList.toggle('is-active')));
  const brief = $('#brief');
  if (brief) {
    brief.addEventListener('submit', (e) => {
      e.preventDefault();
      toast('Отправка формы скоро заработает — пока напишите нам в <a href="https://t.me/rogovuk" target="_blank" rel="noopener">Telegram</a>', 4500);
    });
  }

  /* ---------- парящие блоки (параллакс) ---------- */
  const scene = $('#floatScene');
  if (scene && !reduceMotion) {
    const items = $$('.fl', scene).map((el) => ({
      el,
      speed: parseFloat(el.dataset.speed) || 0,
      max: el.dataset.max ? parseFloat(el.dataset.max) : Infinity, // предел смещения вниз
      y: 0
    }));
    let visible = false;
    let raf = 0;

    const tick = () => {
      raf = 0;
      const r = scene.getBoundingClientRect();
      const vh = window.innerHeight;
      const delta = (r.top + r.height / 2) - vh / 2; // >0 — блок ниже центра экрана
      let moving = false;
      items.forEach((it) => {
        const target = Math.min(delta * it.speed, it.max);
        it.y += (target - it.y) * 0.12;            // мягкое догоняние, без рывков
        if (Math.abs(target - it.y) > 0.05) moving = true;
        it.el.style.transform = `translate3d(0, ${it.y.toFixed(2)}px, 0)`;
      });
      if (visible && moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (visible && !raf) raf = requestAnimationFrame(tick); };

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }, { rootMargin: '200px 0px' }).observe(scene);
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });
  }

  /* ---------- линии в hero ---------- */
  initHeroLines();

  function initHeroLines() {
    const canvas = $('#heroLines');
    const hero = $('#hero');
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');

    // Контуры из макета (frame 1440 × 880). y +26 — отступ экспорта группы.
    // Базовая кривая статична и гладкая; анимация — плавное поле смещений
    // поверх неё, поэтому изломов не бывает в принципе.
    const Y0 = 26;
    const BASE = [
      [[-40, 344.093], [52.3333, 387.593], [289.3, 454.393], [498.5, 373.593], [760, 272.593], [807.5, 143.093], [1006, 119.093], [1204.5, 95.0929], [1475, 133.093], [1501, 147.093]],
      [[-59, 55.0929], [-39.3333, 80.5929], [92.4, 140.293], [462, 175.093], [924, 218.593], [901, 59.5929], [1091, 68.5929], [1243, 75.7929], [1453, 223.926], [1539, 297.093]],
      [[-24, 641.875], [80.5, 658.484], [340.8, 644.167], [546, 454.026], [802.5, 216.35], [755.5, 195.921], [968, 47.9337], [1180.5, -100.053], [1506, 153.069], [1583, 196.917]],
      [[-60, 560], [260, 600], [520, 470], [760, 430], [1000, 390], [1180, 300], [1340, 240], [1440, 205], [1500, 190], [1560, 182]]
    ];

    const N = 280;          // точек на линию
    const BASE_W = 4;       // толщина как в макете
    const rand = (a, b) => a + Math.random() * (b - a);

    const lines = BASE.map((pts, li) => ({
      ctrl: pts.map(([x, y]) => [x, y + Y0]),
      alpha: li === 3 ? 0.13 : 0.19,
      // волны деформации вдоль линии (гладкие, 0.5–1.6 периода на линию)
      waves: [0, 1, 2].map((k) => ({
        f: rand(0.45, 1.6), w: rand(0.18, 0.34) * (k % 2 ? -1 : 1),
        a: rand(7, 15) / (k + 1) * 1.2, p: rand(0, Math.PI * 2)
      })),
      wx: { f: rand(0.4, 1), w: rand(0.12, 0.22), a: rand(6, 12), p: rand(0, Math.PI * 2) },
      // утолщения: место «гуляет», толщина плавно растёт/спадает
      bulges: [0, 1].map(() => ({
        cf: rand(0.05, 0.1), cp: rand(0, Math.PI * 2),
        af: rand(0.2, 0.38), ap: rand(0, Math.PI * 2),
        sigma: rand(0.09, 0.15), max: rand(4.5, 7)
      })),
      base: null, // сэмплы базовой кривой (пересчитываются при ресайзе)
      P: Array.from({ length: N }, () => [0, 0]),
      Wd: new Float32Array(N),
      E: new Float32Array(N)
    }));

    const GS = 0.2;                                   // масштаб холста свечения (1/5)
    // отдельный слой свечения поверх линий: маленький холст, растягивает GPU
    const glow = document.createElement('canvas');
    glow.className = 'hero__glow';
    glow.setAttribute('aria-hidden', 'true');
    canvas.after(glow);
    const gctx = glow.getContext('2d');
    let glowDirty = false;

    let W = 0, H = 0, dpr = 1, sx = 1;
    let running = false, visible = true, raf = 0;
    const t0 = performance.now();

    function bez(p0, p1, p2, p3, t) {
      const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
    }
    function sampleBase(ctrl) {
      const pts = ctrl.map(([x, y]) => [x * sx, y]);
      const segs = (pts.length - 1) / 3;
      const out = [];
      for (let i = 0; i < N; i++) {
        const g = (i / (N - 1)) * segs;
        const s = Math.min(segs - 1, Math.floor(g)), k = s * 3;
        out.push(bez(pts[k], pts[k + 1], pts[k + 2], pts[k + 3], g - s));
      }
      return out;
    }

    function resize() {
      const r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      sx = W / 1440;
      glow.width = Math.ceil(W * GS);
      glow.height = Math.ceil(H * GS);
      lines.forEach((ln) => { ln.base = sampleBase(ln.ctrl); });
      draw((performance.now() - t0) / 1000);
    }

    // лента переменной толщины (нормали считаются по гладкой кривой)
    function ribbon(P, Wd, grow, c = ctx) {
      c.beginPath();
      for (let i = 0; i < N; i++) {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)];
        let nx = a[1] - b[1], ny = b[0] - a[0];
        const l = Math.hypot(nx, ny) || 1;
        const h = (Wd[i] * grow) / (2 * l);
        i ? c.lineTo(P[i][0] + nx * h, P[i][1] + ny * h) : c.moveTo(P[i][0] + nx * h, P[i][1] + ny * h);
      }
      for (let i = N - 1; i >= 0; i--) {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)];
        let nx = a[1] - b[1], ny = b[0] - a[0];
        const l = Math.hypot(nx, ny) || 1;
        const h = (Wd[i] * grow) / (2 * l);
        c.lineTo(P[i][0] - nx * h, P[i][1] - ny * h);
      }
      c.closePath();
    }

    // горизонтальный градиент: прозрачность меняется плавно вдоль линии
    function alongGradient(c, P, alphaAt, rgb) {
      let minX = Infinity, maxX = -Infinity;
      for (const p of P) { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; }
      const g = c.createLinearGradient(minX, 0, maxX, 0);
      const span = maxX - minX || 1;
      let last = -1;
      for (let i = 0; i < N; i += 6) {
        const o = (P[i][0] - minX) / span;
        if (o <= last + 0.004) continue;
        g.addColorStop(Math.min(1, o), `rgba(${rgb},${alphaAt(i).toFixed(3)})`);
        last = o;
      }
      return g;
    }

    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0;
      ctx.clearRect(0, 0, W, H);
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.clearRect(0, 0, glow.width, glow.height);
      glowDirty = false;

      for (const ln of lines) {
        if (!ln.base) continue;
        const { P, Wd, E } = ln;

        // 1. гладкая деформация + толщина
        const bs = ln.bulges.map((b) => ({
          c: 0.5 + 0.4 * Math.sin(t * b.cf + b.cp) + 0.06 * Math.sin(t * b.cf * 2.3 + b.cp),
          a: b.max * (0.5 + 0.5 * Math.sin(t * b.af + b.ap)),
          s2: 2 * b.sigma * b.sigma
        }));
        let peak = 0;
        for (let i = 0; i < N; i++) {
          const u = i / (N - 1);
          let dy = 0;
          for (const w of ln.waves) dy += w.a * Math.sin(Math.PI * 2 * w.f * u + t * w.w + w.p);
          const dx = ln.wx.a * Math.sin(Math.PI * 2 * ln.wx.f * u + t * ln.wx.w + ln.wx.p);
          P[i][0] = ln.base[i][0] + dx * sx;
          P[i][1] = ln.base[i][1] + dy;
          let e = 0;
          for (const b of bs) { const d = u - b.c; e += b.a * Math.exp(-(d * d) / b.s2); }
          E[i] = e; Wd[i] = BASE_W + e;
          if (e > peak) peak = e;
        }

        // 2. сама линия: в толстых местах чуть ярче
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = alongGradient(ctx, P, (i) => ln.alpha + 0.1 * Math.min(1, E[i] / 7), '110,92,246');
        ribbon(P, Wd, 1);
        ctx.fill();

        // 3. маска свечения — на маленький холст (дёшево), см. ниже
        if (peak > 0.6) {
          const OFF = W + 400;
          gctx.save();
          gctx.setTransform(GS, 0, 0, GS, 0, 0);
          gctx.translate(-OFF, 0);
          gctx.shadowOffsetX = OFF * GS;
          gctx.fillStyle = alongGradient(gctx, P, (i) => Math.pow(Math.min(1, E[i] / 6.5), 1.4), '255,255,255');
          gctx.shadowColor = 'rgba(70,52,255,0.26)';    // широкий мягкий ореол
          gctx.shadowBlur = 24 * GS;
          ribbon(P, Wd, 3, gctx); gctx.fill();
          gctx.shadowColor = 'rgba(92,76,255,0.24)';    // плотное ядро
          gctx.shadowBlur = 7 * GS;
          ribbon(P, Wd, 1.3, gctx); gctx.fill();
          gctx.restore();
          glowDirty = true;
        }
      }

      // 4. свечение показывается слоем .hero__glow (mix-blend-mode: screen)
      if (!glowDirty) gctx.clearRect(0, 0, glow.width, glow.height);
    }

    function loop(now) {
      raf = 0;
      if (!running) return;
      draw((now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    }
    function update() {
      const should = visible && !document.hidden && !reduceMotion;
      if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
      if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    }

    new ResizeObserver(resize).observe(hero);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }).observe(hero);
    document.addEventListener('visibilitychange', update);
    resize();
    update();
  }
})();
