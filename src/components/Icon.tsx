import type { IconName } from '../data/content';

type Props = { name: IconName };

// иконки из спрайта SvgSprite
export function Icon({ name }: Props) {
  return <svg><use href={`#i-${name}`} /></svg>;
}

type WordmarkProps = { className?: string; label?: string };

// вордмарк «VITRINA design studio» из трёх частей спрайта
export function Wordmark({ className, label }: WordmarkProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : {};
  return (
    <svg className={className} viewBox="0 0 791.7 284.7" {...a11y}>
      <use className="wm-part wm-vitrina" href="#wm-vitrina" x="0" y="0" width="792" height="124" />
      <use className="wm-part wm-design" href="#wm-design" x="28.6" y="50.2" width="511" height="235" />
      <use className="wm-part wm-studio" href="#wm-studio" x="513.3" y="125.4" width="276" height="66" />
    </svg>
  );
}
