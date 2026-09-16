'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRef } from 'react';

type Rect = { top: number; left: number; width: number; height: number };

type ModalShellProps = {
  open: boolean;
  children: React.ReactNode;
  zIndexClass?: string;
  onBackdropClick?: () => void;
  overlayClassName?: string;
  contentWrapperClassName?: string;
};

export function ModalShell({
  open,
  children,
  zIndexClass = 'z-[1200]',
  onBackdropClick,
  overlayClassName = 'bg-black/50',
  contentWrapperClassName = 'relative h-full w-full flex items-center justify-center p-3 pointer-events-none',
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const backdropActionRef = useRef<(() => void) | undefined>(onBackdropClick);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open]);

  useEffect(() => {
    backdropActionRef.current = onBackdropClick;
  }, [onBackdropClick]);

  useEffect(() => {
    if (!open) return;

    const updateRect = () => {
      const host = document.getElementById('app-shell-container');
      if (!host) {
        setRect(null);
        return;
      }
      const r = host.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const key = 'data-modal-open-count';
    const prev = Number(body.getAttribute(key) || '0');
    const next = prev + 1;
    body.setAttribute(key, String(next));
    body.style.overflow = 'hidden';
    return () => {
      const current = Number(body.getAttribute(key) || '1');
      const left = Math.max(0, current - 1);
      if (left === 0) {
        body.removeAttribute(key);
        body.style.overflow = '';
      } else {
        body.setAttribute(key, String(left));
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!shellRef.current) return;
      if (e.key === 'Escape') {
        if (backdropActionRef.current) backdropActionRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const container = shellRef.current;
      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (!active || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!active || active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const t = setTimeout(() => {
      const container = shellRef.current;
      if (!container) return;
      const first = container.querySelector<HTMLElement>(
        '[data-autofocus], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (first) first.focus();
      else container.focus();
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKeyDown);
      const last = lastFocusedRef.current;
      if (last && typeof last.focus === 'function') {
        setTimeout(() => last.focus(), 0);
      }
    };
  }, [open]);

  const style = useMemo(() => {
    if (!rect) return undefined;
    return {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    };
  }, [rect]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className={`fixed ${zIndexClass} ${rect ? '' : 'inset-0'}`} style={style}>
      <div className={`absolute inset-0 ${overlayClassName}`} onClick={onBackdropClick} />
      <div ref={shellRef} className={contentWrapperClassName} role="dialog" aria-modal="true" tabIndex={-1}>
        <div className="pointer-events-auto w-full">{children}</div>
      </div>
    </div>,
    document.body
  );
}
