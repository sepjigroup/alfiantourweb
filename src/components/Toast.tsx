'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface ToastContextType {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((message: string) => {
    setToast(message);
    setVisible(true);
    setTimeout(() => setVisible(false), 2500);
  }, []);

  useEffect(() => {
    if (!visible && toast) {
      const timer = setTimeout(() => setToast(null), 300);
      return () => clearTimeout(timer);
    }
  }, [visible, toast]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          onClick={() => setVisible(false)}
          className={cn(
            'fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000]',
            'bg-zinc-800 text-white px-6 py-3.5 rounded-full text-sm font-semibold',
            'shadow-2xl cursor-pointer whitespace-nowrap transition-all duration-300',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
        >
          {toast}
        </div>
      )}
    </ToastContext.Provider>
  );
}
