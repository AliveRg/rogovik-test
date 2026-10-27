# VITRINA design studio — сайт

Лендинг студии на React 19 + Vite + TypeScript.

## Команды

```bash
npm install
npm run dev        # дев-сервер
npm run build      # проверка типов + сборка в dist/
npm run preview    # локальный просмотр сборки
npm test           # unit-тесты (логика калькулятора)
```

## Структура

- `index.html`, `dev.html` — точки входа (главная и заглушка «Раздел в разработке»)
- `src/App.tsx` — сборка главной, связка калькулятора и формы заявки
- `src/components/` — секции страницы, сайдбар, поп-ап калькулятора (`calc/`)
- `src/hooks/` — поп-ап с историей `#calc`, скролл-спай, док бара, анимация чисел
- `src/lib/calc.ts` — цены и сроки калькулятора (правятся здесь), `calc.test.ts` — тесты
- `src/lib/heroLines.ts` — анимация линий в hero на canvas
- `src/data/content.ts` — тексты, услуги, работы, FAQ, контакты
- `src/styles/` — стили (классы состояний `is-*` ставят компоненты)
- `public/assets/` — статика
