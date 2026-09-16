'use client';

import { useEffect, useRef, useState } from 'react';
import { BackButton } from '@/components/BackButton';
import { Skeleton } from '@/components/Skeleton';

export default function FormulirCetakPage() {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    const loadPdf = async () => {
      try {
        setLoading(true);
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        const loadingTask = pdfjs.getDocument('/docs/Formulir-cetak.pdf');
        const pdf = await loadingTask.promise;
        if (!mounted) return;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages || 1);
        setPage(1);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Gagal memuat dokumen PDF');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadPdf();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const renderPage = async () => {
      const pdf = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!pdf || !canvas) return;
      setLoading(true);
      setError('');
      try {
        const pg = await pdf.getPage(page);
        const viewport = pg.getViewport({ scale: 1.35 });
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await pg.render({ canvasContext: ctx, viewport }).promise;
      } catch (e: any) {
        setError(e?.message || 'Gagal render halaman PDF');
      } finally {
        setLoading(false);
      }
    };
    void renderPage();
  }, [page, totalPages]);

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">Formulir Cetak</h1>
      </div>

      <p className="text-xs text-zinc-500">
        Dokumen dibuka dalam mode preview. Download hanya melalui tombol di bawah.
      </p>

      <div className="bg-white border rounded-3xl p-3">
        <div className="flex items-center justify-between gap-2 pb-2">
          <button type="button" className="border rounded-lg px-2 py-1 text-xs disabled:opacity-50" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</button>
          <div className="text-xs text-zinc-600">Halaman {page}/{totalPages}</div>
          <button type="button" className="border rounded-lg px-2 py-1 text-xs disabled:opacity-50" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Berikutnya</button>
        </div>
        <div className="w-full h-[68vh] rounded-2xl border bg-zinc-50 overflow-auto flex items-start justify-center">
          {loading ? (
            <div className="w-full px-4 pt-6 space-y-2">
              <Skeleton className="h-8 w-40 mx-auto" />
              <Skeleton className="h-72 w-full rounded-2xl" />
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
                Memuat preview PDF...
              </div>
            </div>
          ) : null}
          {error ? <div className="text-xs text-red-500 mt-6 px-3 text-center">{error}</div> : null}
          <canvas ref={canvasRef} className="max-w-full h-auto" />
        </div>
      </div>

      <a
        href="/docs/Formulir-cetak.pdf"
        download
        className="w-full inline-flex items-center justify-center border rounded-2xl py-3 text-sm font-semibold"
      >
        Download Formulir PDF
      </a>
    </div>
  );
}
