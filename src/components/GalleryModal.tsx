'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ModalShell } from '@/components/ui/ModalShell';

interface GalleryModalProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  mode?: 'carousel' | 'stack';
}

export function GalleryModal({ open, onClose, images, mode = 'carousel' }: GalleryModalProps) {
  const [current, setCurrent] = useState(0);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [zoomLoading, setZoomLoading] = useState(false);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const onCloseRef = useRef(onClose);
  const zoomIndexRef = useRef<number | null>(null);
  const pushedMainRef = useRef(false);
  const pushedZoomRef = useRef(false);
  const closeViaBackRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    zoomIndexRef.current = zoomIndex;
  }, [zoomIndex]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    if (!pushedMainRef.current) {
      window.history.pushState({ ...(window.history.state || {}), __gallery_main__: Date.now() }, '');
      pushedMainRef.current = true;
    }
    const onPopState = () => {
      if (zoomIndexRef.current !== null) {
        setZoomIndex(null);
        return;
      }
      closeViaBackRef.current = true;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      pushedMainRef.current = false;
      pushedZoomRef.current = false;
      closeViaBackRef.current = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    if (zoomIndex !== null && !pushedZoomRef.current) {
      window.history.pushState({ ...(window.history.state || {}), __gallery_zoom__: Date.now() }, '');
      pushedZoomRef.current = true;
      return;
    }
    if (zoomIndex === null) {
      pushedZoomRef.current = false;
    }
  }, [open, zoomIndex]);

  const requestClose = useCallback(() => {
    if (typeof window === 'undefined' || closeViaBackRef.current) {
      onCloseRef.current();
      return;
    }
    window.history.back();
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  }, [images.length]);

  if (!open) return null;

  if (mode === 'stack') {
    const openZoom = (idx: number) => {
      setZoomLoading(true);
      setZoomIndex(idx);
    };
    const zoomPrev = () => setZoomIndex((z) => (z == null ? 0 : (z === 0 ? images.length - 1 : z - 1)));
    const zoomNext = () => setZoomIndex((z) => (z == null ? 0 : (z === images.length - 1 ? 0 : z + 1)));
    return (
      <>
        <ModalShell open={open} onBackdropClick={requestClose} zIndexClass="z-[10000]" overlayClassName="bg-black/90 backdrop-blur-sm">
          <div className="pointer-events-auto mx-auto w-full max-w-4xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/30">
              <div className="text-sm font-bold text-white">Galeri Foto ({images.length})</div>
              <button onClick={requestClose} aria-label="Tutup galeri" className="text-zinc-400 hover:text-white text-xl leading-none p-1 transition-colors duration-200">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((img, i) => (
                  <div
                    key={`${img}-${i}`}
                    className="relative group aspect-[4/3] bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-primary-500/50 transition-all duration-300"
                    onClick={() => openZoom(i)}
                  >
                    <img
                      src={img}
                      alt={`Gallery ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour.Com';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white/90 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur">
                      Foto {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalShell>
        <ModalShell open={zoomIndex !== null} onBackdropClick={() => setZoomIndex(null)} zIndexClass="z-[10100]" overlayClassName="bg-black/95">
          <div className="pointer-events-auto h-full w-full flex flex-col">
            <div className="flex justify-between items-center p-4">
              <div className="text-white/80 text-xs font-semibold">
                {(zoomIndex ?? 0) + 1} / {images.length}
              </div>
              <button onClick={() => setZoomIndex(null)} aria-label="Tutup preview" className="text-white text-3xl leading-none p-2 hover:text-white/80 transition-colors">
                ✕
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
              {zoomIndex !== null ? (
                <>
                  {zoomLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="inline-block w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : null}
                  <img
                    src={images[zoomIndex]}
                    alt={`Gallery ${zoomIndex + 1}`}
                    className="w-full h-full object-contain"
                    onLoad={() => setZoomLoading(false)}
                    onError={(e) => {
                      setZoomLoading(false);
                      e.currentTarget.src = 'https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour.Com';
                    }}
                  />
                </>
              ) : null}
              {images.length > 1 ? (
                <>
                  <button
                    onClick={zoomPrev}
                    className="absolute left-4 text-white text-4xl z-20 w-10 h-10 flex items-center justify-center bg-black/20 rounded-full backdrop-blur hover:bg-black/40 transition-colors"
                  >
                    ‹
                  </button>
                  <button
                    onClick={zoomNext}
                    className="absolute right-4 text-white text-4xl z-20 w-10 h-10 flex items-center justify-center bg-black/20 rounded-full backdrop-blur hover:bg-black/40 transition-colors"
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </ModalShell>
      </>
    );
  }

  return (
    <ModalShell open={open} onBackdropClick={requestClose} zIndexClass="z-[10000]" overlayClassName="bg-black/95" contentWrapperClassName="relative h-full w-full flex flex-col pointer-events-none">
      <div className="pointer-events-auto h-full flex flex-col">
      {/* Close */}
      <div className="flex justify-between items-center p-4">
        <div className="text-white/80 text-xs font-semibold">
          {current + 1} / {images.length}
        </div>
        <button onClick={requestClose} aria-label="Tutup galeri" className="text-white text-3xl leading-none p-2 hover:text-white/80 transition-colors">
          ✕
        </button>
      </div>

      {/* Slides */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {carouselLoading ? (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="inline-block w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        ) : null}
        <div
          className="flex h-full w-full transition-transform duration-500"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((img, i) => (
            <div key={i} className="min-w-full h-full flex-shrink-0 relative">
              <img
                src={img}
                alt={`Gallery ${i + 1}`}
                className="w-full h-full object-contain"
                loading={i === current ? 'eager' : 'lazy'}
                onLoad={() => {
                  if (i === current) setCarouselLoading(false);
                }}
                onError={(e) => {
                  if (i === current) setCarouselLoading(false);
                  e.currentTarget.src = 'https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour.Com';
                }}
              />
            </div>
          ))}
        </div>

        {/* Nav buttons */}
        <button
          onClick={() => {
            setCarouselLoading(true);
            prev();
          }}
          className="absolute left-4 text-white text-4xl z-20 w-10 h-10 flex items-center justify-center bg-black/20 rounded-full backdrop-blur hover:bg-black/45 transition-colors"
        >
          ‹
        </button>
        <button
          onClick={() => {
            setCarouselLoading(true);
            next();
          }}
          className="absolute right-4 text-white text-4xl z-20 w-10 h-10 flex items-center justify-center bg-black/20 rounded-full backdrop-blur hover:bg-black/45 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-8">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCarouselLoading(true);
              setCurrent(i);
            }}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              i === current ? 'bg-white w-6' : 'bg-white/40'
            )}
          />
        ))}
      </div>
      </div>
    </ModalShell>
  );
}
