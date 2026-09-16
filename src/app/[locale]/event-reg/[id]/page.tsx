'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { BackButton } from '@/components/BackButton';
import { API_BASE_URL } from '@/lib/api-client';

type TicketDetail = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string; // YYYY-MM-DD
  eventStartTime: string; // HH:mm:ss
  locationName: string;
  fullAddress: string | null;
  participantName: string;
  participantEmail: string;
  participantPhone: string;
  referredByUsername: string | null;
  registeredAt: string;
};

const renderAddress = (address: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(address)) {
    const parts = address.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-extrabold hover:underline break-all inline-flex items-center gap-1 mt-1 bg-primary-50 px-2 py-1 rounded-lg border border-primary-200/50"
          >
            🗺️ Buka Peta Lokasi ↗
          </a>
        );
      }
      return part;
    });
  }
  return address;
};

export default function EventTicketPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const locale = String(params?.locale || 'id');
  const { show } = useToast();

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/events/registration/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Tiket tidak ditemukan');
        const json = await res.json();
        if (json.isSuccess && json.data) {
          setTicket(json.data);
        } else {
          throw new Error(json.message || 'Tiket tidak ditemukan');
        }
      })
      .catch((err) => {
        show(err.message || 'Gagal memuat detail tiket');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-primary animate-spin" />
        <p className="text-xs text-zinc-500">Memuat detail tiket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="text-4xl">🎟️</div>
        <h2 className="text-lg font-bold">Tiket Tidak Ditemukan</h2>
        <p className="text-xs text-zinc-500">Data pendaftaran tidak valid atau telah dihapus.</p>
        <div className="pt-2">
          <BackButton />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-up max-w-md mx-auto pb-16">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
          E-Tiket Event
        </h1>
      </div>

      {/* Ticket Design */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Top Header Card decoration */}
        <div className="bg-gradient-to-r from-primary to-primary-700 p-5 text-white text-center space-y-1 relative">
          <div className="absolute top-2 right-3 text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Verified Pass
          </div>
          <h2 className="text-xs font-bold tracking-widest uppercase opacity-90">Alfian Tour Event Pass</h2>
          <p className="text-sm font-black line-clamp-1">{ticket.eventTitle}</p>
        </div>

        {/* Ticket Body */}
        <div className="p-5 space-y-5">
          {/* QR Code Placeholder / Icon check */}
          <div className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950 space-y-2">
            <div className="text-4xl text-green-500">🎫</div>
            <div className="text-center">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-400">Kode Pendaftaran</span>
              <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 select-all">{ticket.id}</p>
            </div>
            <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-green-500/20">
              Terverifikasi & Aktif
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b pb-1">Detail Pelaksanaan</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-500">Tanggal</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  {new Date(ticket.eventDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-zinc-500">Waktu</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  {ticket.eventStartTime.substring(0, 5)} WIB
                </p>
              </div>
              <div className="col-span-2 space-y-0.5">
                <span className="text-[10px] text-zinc-500">Tempat</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{ticket.locationName}</p>
                {ticket.fullAddress && (
                  <div className="text-[10px] text-zinc-550 font-medium leading-relaxed mt-0.5 whitespace-pre-wrap">
                    {renderAddress(ticket.fullAddress)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Participant Details */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b pb-1">Data Pendaftar</h3>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Nama Lengkap:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{ticket.participantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Alamat Email:</span>
                <span className="font-bold text-zinc-950 dark:text-white">{ticket.participantEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Nomor WhatsApp:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{ticket.participantPhone}</span>
              </div>
              {ticket.referredByUsername && (
                <div className="flex justify-between p-2 rounded-lg bg-primary-50 dark:bg-zinc-950 border border-primary-200/50 text-primary font-bold">
                  <span>Direferensikan Oleh:</span>
                  <span>@{ticket.referredByUsername}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Footer Cut decoration */}
        <div className="relative flex items-center justify-between px-5 py-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20">
          {/* Half circles decoration */}
          <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800" />
          <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800" />
          
          <div className="text-[10px] text-zinc-400 font-medium">
            Terdaftar pada {new Date(ticket.registeredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-right text-[10px] font-bold text-primary">
            Tunjukkan Pas Ini ke Panitia
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => window.print()}
          className="w-full bg-primary hover:bg-primary-600 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg transition-colors text-xs flex items-center justify-center gap-2"
        >
          <span>🖨️</span> Cetak / Simpan PDF E-Tiket
        </button>
        <a
          href={`/${locale}/events/${ticket.eventId}`}
          className="w-full block text-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold py-3 px-4 rounded-2xl transition-colors text-xs"
        >
          Kembali ke Halaman Event
        </a>
      </div>
    </div>
  );
}
