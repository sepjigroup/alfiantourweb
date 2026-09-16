'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { BackButton } from '@/components/BackButton';
import { Link } from '@/i18n/routing-patch';
import { API_BASE_URL } from '@/lib/api-client';

type EventItem = {
  id: string;
  title: string;
  slug: string;
  imageUrlWebp: string | null;
  locationName: string;
  fullAddress: string | null;
  eventDate: string; // YYYY-MM-DD
  eventStartTime: string; // HH:mm:ss
  quota: number;
  viewCount: number;
  registrationCount: number;
};

export default function PublicEventsPage() {
  const { show } = useToast();
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/events?onlyActive=true&pageNumber=1&pageSize=50`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal mengambil data event');
        const json = await res.json();
        if (json.isSuccess) {
          setItems(json.data || []);
        } else {
          throw new Error(json.message || 'Gagal memuat event');
        }
      })
      .catch((err) => {
        show(err.message || 'Terjadi kesalahan saat memuat event');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getEventImageUrl = (imageUrlWebp: string | null) => {
    if (!imageUrlWebp) {
      return 'https://placehold.co/600x340/7C3AED/FFFFFF.png?text=Event+Alfian+Tour';
    }
    if (imageUrlWebp.startsWith('http://') || imageUrlWebp.startsWith('https://')) return imageUrlWebp;
    return `${API_BASE_URL}${imageUrlWebp.startsWith('/') ? '' : '/'}${imageUrlWebp}`;
  };

  return (
    <div className="p-4 space-y-5 animate-fade-up max-w-xl mx-auto pb-16 bg-zinc-50 text-zinc-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold text-zinc-900">
          Agenda Event & Kegiatan
        </h1>
      </div>
      <p className="text-xs text-zinc-550">
        Temukan dan ikuti berbagai program seminar, manasik umroh akbar, dan event seru kami di bawah ini.
      </p>

      {/* Event List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <div className="h-7 w-7 rounded-full border-2 border-zinc-200 border-t-primary animate-spin" />
          <span className="text-[10px] text-zinc-500">Memuat daftar event...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-650 text-xs shadow-sm">
          <p className="text-2xl mb-2">📅</p>
          <p className="font-bold text-zinc-800">Belum Ada Event Aktif</p>
          <p className="text-[10px] text-zinc-500 mt-1">Nantikan rilis agenda event terbaru kami dalam waktu dekat.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const seatsLeft = Math.max(0, item.quota - item.registrationCount);
            const percentage = item.quota > 0 ? Math.min(100, (item.registrationCount / item.quota) * 100) : 0;
            return (
              <div 
                key={item.id} 
                className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary-300 transition-all flex flex-col"
              >
                {/* Cover Image */}
                <div className="relative aspect-[16/9] w-full bg-zinc-100 border-b border-zinc-200">
                  <img
                    src={getEventImageUrl(item.imageUrlWebp)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Event Body Info */}
                <div className="p-4 space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-black text-zinc-900 line-clamp-2">
                      {item.title}
                    </h2>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-600 font-bold pt-1">
                      <span>📅 {new Date(item.eventDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>⏰ {item.eventStartTime.substring(0, 5)} WIB</span>
                      <span>📍 {item.locationName}</span>
                    </div>
                  </div>

                  {/* Seat quota bar */}
                  {item.quota > 0 ? (
                    <div className="space-y-1.5">
                      <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden border border-zinc-200">
                        <div 
                          className={`h-full transition-all duration-500 ${percentage > 85 ? 'bg-red-500' : percentage > 60 ? 'bg-amber-500' : 'bg-primary-600'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-extrabold text-zinc-700">
                        <span>Tersisa: {seatsLeft} Kursi</span>
                        <span>Kuota: {item.quota}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-extrabold">✓ Kuota Tidak Terbatas</p>
                  )}

                  {/* Details Link button */}
                  <Link
                    href={`/events/${item.slug}`}
                    className="w-full block text-center bg-primary hover:bg-primary-600 text-white font-extrabold py-2.5 rounded-xl transition-colors text-xs"
                  >
                    Detail & Daftar Event
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
