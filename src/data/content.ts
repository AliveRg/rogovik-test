/* Контент главной: правится здесь, разметка — в компонентах */

export const DEV_PAGE = 'dev.html';
export const TELEGRAM_URL = 'https://t.me/rogovuk';
export const LOGO_SRC = `${import.meta.env.BASE_URL}assets/img/logo-cube.png`;

export type IconName = 'home' | 'grid' | 'layers' | 'user' | 'send' | 'chat' | 'up' | 'mail';
export type SectionId = 'top' | 'works' | 'services' | 'about' | 'contact';

export interface NavItem { id: SectionId; label: string; icon: IconName }

export const NAV: NavItem[] = [
  { id: 'top', label: 'Главная', icon: 'home' },
  { id: 'works', label: 'Работы', icon: 'grid' },
  { id: 'services', label: 'Услуги', icon: 'layers' },
  { id: 'about', label: 'О нас', icon: 'user' },
  { id: 'contact', label: 'Контакты', icon: 'send' }
];

export type WorkCat = 'info' | 'sites' | 'banners' | 'ui' | 'anim';
export type WorkFilter = 'all' | WorkCat;

export const WORK_FILTERS: Array<{ id: WorkFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'info', label: 'Инфографика' },
  { id: 'sites', label: 'Сайты' },
  { id: 'banners', label: 'Баннеры' },
  { id: 'ui', label: 'UI / UX' },
  { id: 'anim', label: 'Анимация' }
];

export interface Work { title: string; cat: WorkCat; catLabel: string }

// ряды сетки: 2 + 3 плитки
export const WORK_ROWS: Work[][] = [
  [
    { title: 'Карточки колёсных болтов', cat: 'info', catLabel: 'Инфографика' },
    { title: 'Лендинг морепродуктов', cat: 'sites', catLabel: 'Сайты' }
  ],
  [
    { title: 'Баннеры для магазина', cat: 'banners', catLabel: 'Баннеры' },
    { title: 'UI мобильного приложения', cat: 'ui', catLabel: 'UI / UX' },
    { title: 'Сайт студии', cat: 'sites', catLabel: 'Сайты' }
  ]
];

export interface ServiceCard {
  tag: string;
  name: string;
  desc: string;
  price: string;
  muted?: boolean;
  soon?: boolean;
  bodyTop?: number;       // подгонка под макет во втором ряду
}

export const SERVICES: ServiceCard[] = [
  { tag: 'Маркетплейсы', name: 'Инфографика', desc: 'за слайд · комплект 5–7 слайдов ≈ от 8 000 ₽', price: '≈ от 1 500 ₽' },
  { tag: 'Креативы', name: 'Баннеры', desc: 'маркетплейсы, сайты, реклама', price: '≈ от 2 000 ₽' },
  { tag: 'Сайты', name: 'Макет сайта', desc: 'лендинг или многостраничник в Figma', price: '≈ от 25 000 ₽' },
  { tag: 'Сайты', name: 'Вёрстка', desc: 'адаптив, веб-приложение (PWA)', price: '≈ от 20 000 ₽' },
  { tag: 'Сайты', name: 'Сайт под ключ', desc: 'дизайн + вёрстка + запуск', price: '≈ от 60 000 ₽', bodyTop: 104.5 },
  { tag: 'Продукты', name: 'UI / UX', desc: 'за экран · продукты и приложения', price: '≈ от 3 000 ₽', bodyTop: 104.5 },
  { tag: 'В разработке', name: 'Векторная анимация', desc: 'направление в разработке', price: 'скоро', muted: true, soon: true, bodyTop: 104.5 },
  { tag: 'Индивидуально', name: 'Свой проект', desc: 'нестандартная задача — напишите', price: 'обсудим', muted: true }
];

export const TOOLS = ['Figma', 'Photoshop', 'Illustrator', 'After Effects', 'VS Code'];

export interface StatDef { value: string; label: string; count?: number; suffix?: string; accent?: boolean }

export const STATS: StatDef[] = [
  { value: '300+', count: 300, suffix: '+', label: 'проектов сдано', accent: true },
  { value: '6 лет', count: 6, suffix: ' лет', label: 'в дизайне' },
  { value: '≈ 2 дня', label: 'срок карточки' },
  { value: '4 площадки', count: 4, suffix: ' площадки', label: 'WB · Ozon · ЯМ · Авито' }
];

export interface ContactDef { href: string; icon: IconName; label: string; value: string; external: boolean }

export const CONTACTS: ContactDef[] = [
  { href: TELEGRAM_URL, icon: 'send', label: 'Telegram', value: '@rogovuk', external: true },
  { href: 'https://wa.me/79205893727', icon: 'chat', label: 'WhatsApp', value: '8 920 589-37-27', external: true },
  { href: 'mailto:rogovekartem@gmail.com', icon: 'mail', label: 'Почта', value: 'rogovekartem@gmail.com', external: false }
];

export const BRIEF_CHIPS = ['Инфографика', 'Баннеры', 'Сайт', 'UI / UX', 'Другое'];

export const FAQ: Array<{ q: string; a: string }> = [
  { q: 'Сколько времени занимает проект?', a: 'Карточка для маркетплейса — 1–3 дня, комплект баннеров — 2–4 дня, лендинг — 1–2 недели, сайт под ключ — от 3 недель. Точный срок называем после брифа.' },
  { q: 'Сколько правок входит в стоимость?', a: 'Два круга правок включены в цену. Дополнительные правки обсуждаем отдельно — обычно до них не доходит, потому что концепцию согласовываем заранее.' },
  { q: 'Как проходит оплата?', a: '50% предоплата перед стартом и 50% после согласования результата. Для небольших задач возможна полная оплата после сдачи.' },
  { q: 'Вы передаёте исходники?', a: 'Да. Отдаём все исходники (Figma, PSD, AI), готовые файлы под нужные площадки и шрифты/ассеты, которые использовались в проекте.' }
];
