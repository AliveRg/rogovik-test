import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type ShowToast = (content: ReactNode, ms?: number) => void;

const DEFAULT_MS = 3200;
const ToastContext = createContext<ShowToast>(() => {});

export const useToast = (): ShowToast => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode>(null);
  const [isShown, setIsShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback<ShowToast>((next, ms = DEFAULT_MS) => {
    setContent(next);
    setIsShown(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIsShown(false), ms);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast${isShown ? ' is-shown' : ''}`} role="status" aria-live="polite">{content}</div>
    </ToastContext.Provider>
  );
}
