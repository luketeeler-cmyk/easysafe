import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalAddToast: ((message: string, type: ToastType) => void) | null = null;

export const toast = {
  success(message: string) {
    globalAddToast?.(message, 'success');
  },
  error(message: string) {
    globalAddToast?.(message, 'error');
  },
  info(message: string) {
    globalAddToast?.(message, 'info');
  },
};

const TOAST_DURATION = 4000;

const ToastEntry: React.FC<{ item: ToastItem; onRemove: (id: number) => void }> = ({
  item,
  onRemove,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(item.id), 300);
    }, TOAST_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, onRemove]);

  return (
    <div
      className={`${styles.toast} ${styles[item.type]} ${exiting ? styles.exit : styles.enter}`}
      role="alert"
    >
      <span className={styles.message}>{item.message}</span>
      <button
        className={styles.dismiss}
        onClick={() => {
          setExiting(true);
          setTimeout(() => onRemove(item.id), 300);
        }}
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="3" x2="11" y2="11" />
          <line x1="11" y1="3" x2="3" y2="11" />
        </svg>
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div className={styles.container} aria-live="polite">
          {toasts.map((t) => (
            <ToastEntry key={t.id} item={t} onRemove={removeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
};
