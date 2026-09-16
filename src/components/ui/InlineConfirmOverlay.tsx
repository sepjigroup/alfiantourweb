'use client';

type InlineConfirmOverlayProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function InlineConfirmOverlay({
  open,
  title = 'Konfirmasi',
  message,
  confirmLabel = 'Ya',
  cancelLabel = 'Tidak',
  onConfirm,
  onCancel,
}: InlineConfirmOverlayProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 bg-black/20 flex items-center justify-center p-3 rounded-3xl">
      <div className="w-full max-w-md bg-zinc-900 text-white rounded-2xl px-4 py-3 shadow-2xl">
        <div className="text-[11px] uppercase tracking-wide text-zinc-300">{title}</div>
        <div className="text-xs font-semibold mt-1">{message}</div>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="text-xs border border-white/30 rounded-lg px-3 py-1.5">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="text-xs bg-white text-zinc-900 rounded-lg px-3 py-1.5 font-semibold">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
