import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api-client';

type ProgramListCardProps = {
  item: Record<string, any>;
  trashMode?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  onEdit: () => void;
  onSoftDelete: () => void;
  onRestore?: () => void;
  onHardDelete?: () => void;
  onJsonData?: () => void;
  onImages?: () => void;
  onToggleActive?: () => void;
  onConfigure?: () => void;
  onLabels?: () => void;
  onToggleFeatured?: () => void;
  onFlashSale?: () => void;
  isFlashSale?: boolean;
  onDuplicate?: () => void;
  detailUrl?: string;
  shareUrl?: string;
  onCopyShare?: () => void;
  deleting?: boolean;
};

export function ProgramListCard({ item, trashMode = false, isActive = true, isFeatured = false, onEdit, onSoftDelete, onRestore, onHardDelete, onJsonData, onImages, onToggleActive, onConfigure, onLabels, onToggleFeatured, onFlashSale, isFlashSale = false, onDuplicate, detailUrl, shareUrl, onCopyShare, deleting = false }: ProgramListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toAbsoluteUrl = (raw?: string): string => {
    const val = String(raw || '').trim();
    if (!val) return '';
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    return `${API_BASE_URL}${val.startsWith('/') ? '' : '/'}${val}`;
  };
  const periodLabel = (() => {
    const startRaw = item?.departurePeriodStart;
    const endRaw = item?.departurePeriodEnd;
    if (!startRaw || !endRaw) return '';
    const start = new Date(startRaw);
    const end = new Date(endRaw);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const startDay = start.getDate();
    const startMonth = start.toLocaleString('id-ID', { month: 'long' });
    const endMonth = end.toLocaleString('id-ID', { month: 'long' });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    if (sameMonth) return `Berangkat mulai ${startDay} ${startMonth} ${startYear}`;
    if (startYear === endYear) return `Mulai ${startDay} ${startMonth}-${endMonth} ${startYear}`;
    return `Mulai ${startDay} ${startMonth} ${startYear}-${endMonth} ${endYear}`;
  })();

  const coverImageUrl = (() => {
    try {
      if (typeof item.coverImageUrl === 'string' && item.coverImageUrl.trim()) return item.coverImageUrl;
      if (typeof item.metadata !== 'string' || !item.metadata.trim()) return '';
      const parsed = JSON.parse(item.metadata) as { images?: Array<{ url?: string; isCover?: boolean }> };
      const images = Array.isArray(parsed.images) ? parsed.images : [];
      const cover = images.find((x) => x?.isCover) ?? images[0];
      return cover?.url ?? '';
    } catch {
      return '';
    }
  })();
  const coverImage = toAbsoluteUrl(coverImageUrl);

  const labelTags = Array.isArray(item?.labelTags) ? item.labelTags : [];

  return (
    <div className="border rounded-2xl p-3 space-y-2 relative">
      <div className="absolute right-2 top-2">
        <button
          type="button"
          className="h-7 w-7 inline-flex items-center justify-center rounded-lg border text-xs"
          title="Menu aksi"
          onClick={() => setMenuOpen((v) => !v)}
        >
          ⋯
        </button>
        {menuOpen ? (
          <div className="absolute right-0 mt-1 w-40 rounded-xl border bg-white shadow-md z-20 p-1 text-[11px]">
            {!trashMode ? (
              <button
                type="button"
                className="w-full text-left px-2 py-1 rounded-lg hover:bg-zinc-50"
                onClick={() => {
                  setMenuOpen(false);
                  onSoftDelete();
                }}
              >
                Soft Delete
              </button>
            ) : (
              <button
                type="button"
                className="w-full text-left px-2 py-1 rounded-lg hover:bg-emerald-50 text-emerald-700"
                onClick={() => {
                  setMenuOpen(false);
                  onRestore?.();
                }}
              >
                Restore
              </button>
            )}
            <button
              type="button"
              className="w-full text-left px-2 py-1 rounded-lg hover:bg-red-50 text-red-700 inline-flex items-center justify-between"
              onClick={() => {
                setMenuOpen(false);
                onHardDelete?.();
              }}
            >
              <span>Hard Delete</span>
              <span className="inline-flex rounded-full bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 text-[9px] font-semibold">permanen</span>
            </button>
            <button
              type="button"
              className="w-full text-left px-2 py-1 rounded-lg hover:bg-zinc-50"
              onClick={() => {
                setMenuOpen(false);
                onJsonData?.();
              }}
            >
              JSON Data
            </button>
          </div>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
          {isActive ? 'Aktif' : 'Nonaktif'}
        </div>
        {isFeatured ? (
          <div className="ml-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700">
            Unggulan
          </div>
        ) : null}
        {isFlashSale ? (
          <div className="ml-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">
            Flash Sale
          </div>
        ) : null}
        <div className="text-xs font-semibold line-clamp-2">{item.title || item.name}</div>
        {detailUrl ? (
          <a
            href={detailUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-blue-600 underline break-all"
            title="Buka detail paket di tab baru"
          >
            /{item.slug || item.id}
          </a>
        ) : (
          <div className="text-[11px] text-zinc-500">/{item.slug || item.id}</div>
        )}
        {periodLabel ? <div className="text-[11px] text-zinc-500 mt-0.5">{periodLabel}</div> : null}
        {labelTags.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {labelTags.slice(0, 4).map((t: any, i: number) => (
              <span key={`${t.packageLabelTagId ?? t.id ?? i}`} className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                {t.icon ? <span className="mr-1">{String(t.icon)}</span> : null}
                {String(t.badgeText || t.name || 'Label')}
              </span>
            ))}
          </div>
        ) : null}
        {coverImage ? (
          <div className="mt-2">
            <img src={coverImage} alt={item.title || item.name || 'Cover'} className="h-16 w-24 object-cover rounded-lg border" />
          </div>
        ) : null}
        {shareUrl ? (
          <div className="mt-1 flex items-center gap-1.5">
            <div className="text-[10px] text-zinc-500 truncate">{shareUrl}</div>
            <button type="button" className="text-[10px] border rounded-md px-1.5 py-0.5" onClick={onCopyShare}>Copy</button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {!trashMode && onDuplicate ? (
          <button className="border rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap" onClick={onDuplicate}>
            Duplicate
          </button>
        ) : null}
        {!trashMode && onImages ? (
          <button className="border rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap" onClick={onImages}>
            Images
          </button>
        ) : null}
        {!trashMode && onConfigure ? (
          <button className="border rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap" onClick={onConfigure}>
            Atur Harga
          </button>
        ) : null}
        {!trashMode && onLabels ? (
          <button className="border rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap" onClick={onLabels}>
            Labels
          </button>
        ) : null}
        {!trashMode && onToggleFeatured ? (
          <button className={`border rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap ${isFeatured ? 'border-amber-300 text-amber-700' : 'border-zinc-300 text-zinc-700'}`} onClick={onToggleFeatured}>
            {isFeatured ? 'Unset Unggulan' : 'Set Unggulan'}
          </button>
        ) : null}
        {!trashMode && onFlashSale ? (
          <button className={`border rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap ${isFlashSale ? 'border-red-300 text-red-700' : 'border-zinc-300 text-zinc-700'}`} onClick={onFlashSale}>
            {isFlashSale ? 'Atur Flash Sale' : 'Set Flash Sale'}
          </button>
        ) : null}
        {!trashMode ? (
          <button className="border rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap" onClick={onEdit}>
            Edit
          </button>
        ) : null}
        {!trashMode && onToggleActive ? (
          <button className={`border rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap ${isActive ? 'border-amber-300 text-amber-700' : 'border-emerald-300 text-emerald-700'}`} onClick={onToggleActive}>
            {isActive ? 'Set Nonaktif' : 'Set Aktif'}
          </button>
        ) : null}
        {!trashMode ? (
          <button
            className="border border-red-200 text-red-600 rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap inline-flex items-center gap-1.5 disabled:opacity-60"
            onClick={onSoftDelete}
            disabled={deleting}
          >
            {deleting ? <span className="inline-block h-3 w-3 rounded-full border border-red-300 border-t-red-600 animate-spin" /> : null}
            {deleting ? 'Menghapus...' : 'Delete'}
          </button>
        ) : (
          <button
            className="border border-emerald-200 text-emerald-700 rounded-lg px-2 py-1 text-[11px] leading-none whitespace-nowrap"
            onClick={onRestore}
          >
            Restore
          </button>
        )}
      </div>
    </div>
  );
}
