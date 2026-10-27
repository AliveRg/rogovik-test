import type { MouseEvent } from 'react';
import { Icon } from './Icon';
import { scrollBehavior } from '../hooks/useReducedMotion';

type Props = { isShown: boolean; isInert: boolean };

export function ToTop({ isShown, isInert }: Props) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    e.currentTarget.blur();
  };

  return (
    <button type="button" className={`to-top${isShown ? ' is-shown' : ''}`} id="toTop" aria-label="Наверх" inert={isInert} onClick={handleClick}>
      <span className="to-top__in"><Icon name="up" /></span>
    </button>
  );
}
