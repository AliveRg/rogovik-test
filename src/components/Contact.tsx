import { useState } from 'react';
import type { FormEvent, Ref } from 'react';
import { Icon } from './Icon';
import { Reveal, RevealForceContext } from './Reveal';
import { useToast } from './Toast';
import { BRIEF_CHIPS, CONTACTS, DEV_PAGE, FAQ, TELEGRAM_URL } from '../data/content';

export interface BriefState { task: string; chips: string[] }

type Props = {
  brief: BriefState;
  onBriefChange: (next: BriefState) => void;
  isForced: boolean;            // показать блок сразу (после «Отправить расчёт»)
  isSpot: boolean;              // подсветка формы с расчётом
  formRef: Ref<HTMLElement>;
  nameRef: Ref<HTMLInputElement>;
};

const STEP_MS = 60;
const FAQ_STEP_MS = 70;

const TelegramLink = ({ children }: { children: string }) => (
  <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">{children}</a>
);

function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="faq" id="faq">
      <div className="contact-card__glow" aria-hidden="true" />
      <Reveal>
        <h2 className="faq__title">Частые вопросы</h2>
        <p className="faq__sub">Не нашли ответ — напишите в <TelegramLink>Telegram</TelegramLink>.</p>
      </Reveal>
      <div className="faq__items">
        {FAQ.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <Reveal key={item.q} className={`qa${isOpen ? ' is-open' : ''}`} delay={i * FAQ_STEP_MS}>
              <button type="button" className="qa__q" aria-expanded={isOpen} onClick={() => setOpenIdx(isOpen ? null : i)}>
                {item.q}<span className="qa__icon" aria-hidden="true" />
              </button>
              <div className="qa__a"><div><p>{item.a}</p></div></div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

export function Contact({ brief, onBriefChange, isForced, isSpot, formRef, nameRef }: Props) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const toast = useToast();

  const toggleChip = (chip: string) => {
    const chips = brief.chips.includes(chip) ? brief.chips.filter((c) => c !== chip) : [...brief.chips, chip];
    onBriefChange({ ...brief, chips });
  };

  // бэкенд ещё не подключён
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast(<>Отправка формы скоро заработает — пока напишите нам в <TelegramLink>Telegram</TelegramLink></>, 4500);
  };

  return (
    <section className="section contact" id="contact">
      <RevealForceContext.Provider value={isForced}>
        <Reveal className="contact-card" variant="fade">
          <div className="contact-top">
            <div>
              <Reveal as="h2" className="contact-title">Есть задача? Обсудим</Reveal>
              <Reveal as="p" className="contact-sub" delay={80}>Ответим в течение пары часов.</Reveal>
              <div className="contacts">
                {CONTACTS.map((c, i) => (
                  <Reveal key={c.label} as="a" className="contact-link" href={c.href} delay={140 + i * STEP_MS}
                    {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <span className="contact-link__dot"><Icon name={c.icon} /></span>
                    <span><small>{c.label}</small><strong>{c.value}</strong></span>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal as="form" ref={formRef} className={`brief${isSpot ? ' is-spot' : ''}`} id="brief" noValidate delay={120} onSubmit={handleSubmit}>
              <label className="field">
                <span className="field__label">Имя</span>
                <input ref={nameRef} className="input" type="text" name="name" placeholder="Как к вам обращаться" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="field">
                <span className="field__label">Telegram или телефон</span>
                <input className="input" type="text" name="contact" placeholder="@username / +7" autoComplete="tel" value={contact} onChange={(e) => setContact(e.target.value)} />
              </label>
              <div className="field">
                <span className="field__label">Что нужно</span>
                <div className="brief__chips" role="group" aria-label="Что нужно">
                  {BRIEF_CHIPS.map((chip) => (
                    <button key={chip} type="button" className={`chip${brief.chips.includes(chip) ? ' is-active' : ''}`} aria-pressed={brief.chips.includes(chip)} onClick={() => toggleChip(chip)}>
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
              <label className="field">
                <span className="field__label">Задача</span>
                <textarea className="input" name="task" placeholder="Ссылка на товар / референсы / пара слов о проекте" value={brief.task} onChange={(e) => onBriefChange({ ...brief, task: e.target.value })} />
              </label>
              <button type="submit" className="btn btn--primary">Отправить заявку</button>
              <p className="brief__note">Нажимая кнопку, вы соглашаетесь с <a href={DEV_PAGE}>политикой конфиденциальности</a></p>
            </Reveal>
          </div>

          <Faq />
        </Reveal>
      </RevealForceContext.Provider>
    </section>
  );
}
