import { LOGO_SRC, TELEGRAM_URL } from '../data/content';

// заглушка «Раздел в разработке»
export function DevPage() {
  return (
    <main className="dev">
      <div className="dev__card">
        <img className="dev__cube" src={LOGO_SRC} alt="" />
        <h1 className="dev__title">Раздел в разработке</h1>
        <p className="dev__text">Мы уже собираем эту страницу. А пока можно вернуться на главную или сразу написать нам.</p>
        <div className="dev__actions">
          <a className="btn btn--primary" href="index.html">На главную</a>
          <a className="btn btn--secondary" href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">Написать в Telegram</a>
        </div>
      </div>
    </main>
  );
}
