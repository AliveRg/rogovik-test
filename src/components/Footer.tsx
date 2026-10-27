import { DEV_PAGE } from '../data/content';

const SOCIALS = 4;

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__line" />
      <div className="footer__row">
        <div className="footer__brand"><b>VITRINA</b><span>© 2026 VITRINA design studio</span></div>
        <nav className="footer__nav" aria-label="Нижнее меню">
          <a href="#works">Работы</a><a href="#services">Услуги</a><a href="#about">О нас</a><a href="#contact">Контакты</a>
        </nav>
        <div className="footer__right">
          <div className="socials" aria-label="Соцсети (скоро)">
            {Array.from({ length: SOCIALS }, (_, i) => <a key={i} href={DEV_PAGE} aria-label="Соцсеть" />)}
          </div>
          <a className="muted" href={DEV_PAGE}>Политика конфиденциальности</a>
        </div>
      </div>
    </footer>
  );
}
