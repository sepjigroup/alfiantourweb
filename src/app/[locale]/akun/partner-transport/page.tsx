'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/routing-patch';
import { JsonPayloadConsole } from '@/components/admin/JsonPayloadConsole';
import { useToast } from '@/components/Toast';
import { ModalShell } from '@/components/ui/ModalShell';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';

type TabKey = 'partners' | 'packages' | 'departures' | 'bookings' | 'payouts';
type ModalKey = null | 'partner' | 'package' | 'departure' | 'booking' | 'json';

const money = (v: unknown) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;
const dateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 16) : '');

const emptyPartner = {
  id: 0,
  name: '',
  slug: '',
  partnerType: 'bus-owner',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  city: '',
  province: '',
  contractNo: '',
  contractStartDate: '',
  contractEndDate: '',
  settlementType: 'net-rate',
  currency: 'IDR',
  defaultCommissionAmount: 0,
  status: 'Active',
  notes: '',
  isActive: true,
};

const emptyPackage = {
  id: 0,
  transportPartnerId: '',
  title: '',
  slug: '',
  packageType: 'tour-bus',
  originCity: '',
  destinationCity: '',
  routeSummary: '',
  shortDescription: '',
  description: '',
  coverImageUrl: '',
  currency: 'IDR',
  sellPricePerSeat: 0,
  netCostPerSeat: 0,
  agentCommissionPerSeat: 0,
  sortOrder: 0,
  status: 'Draft',
  isPublic: true,
  isActive: true,
};

const emptyDeparture = {
  id: 0,
  transportPackageId: '',
  departureDateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  arrivalDateTime: '',
  pickupPoint: '',
  dropoffPoint: '',
  busName: '',
  busPlateNo: '',
  driverName: '',
  driverPhone: '',
  seatCapacity: 45,
  seatsBooked: 0,
  seatsBlocked: 0,
  sellPricePerSeatOverride: 0,
  netCostPerSeatOverride: 0,
  status: 'Open',
  notes: '',
  isActive: true,
};

const emptyBooking = {
  transportDepartureId: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  refAgentUsername: '',
  paxCount: 1,
  notes: '',
};

const busTourSampleJson = JSON.stringify({
  partner: {
    name: 'Bis Hyjett',
    slug: 'bis-hyjett',
    partnerType: 'bus-owner',
    contactName: 'Bapak Ahmad Hyjett',
    contactPhone: '6281234567890',
    contactEmail: 'admin@hyjettbus.com',
    address: 'Jl. Soekarno Hatta No. 100',
    city: 'Bandung',
    province: 'Jawa Barat',
    contractNo: 'HYJETT-2026-001',
    settlementType: 'net-rate',
    currency: 'IDR',
    defaultCommissionAmount: 25000,
    status: 'Active',
    notes: 'Partner bus untuk paket wisata Jawa Barat',
    isActive: true
  },
  package: {
    title: 'Paket Wisata Keliling Jawa Barat dengan Bis Hyjett',
    slug: 'paket-wisata-jawa-barat-bis-hyjett',
    packageType: 'tour-bus',
    originCity: 'Bandung',
    destinationCity: 'Ciwidey - Lembang - Bandung',
    routeSummary: 'Bandung - Kawah Putih - Ranca Upas - Lembang - Bandung',
    shortDescription: 'Paket wisata bus keliling destinasi Jawa Barat menggunakan armada Bis Hyjett.',
    description: 'Paket ini cocok untuk keluarga, komunitas, sekolah, kantor, dan rombongan wisata. Perjalanan dimulai dari Bandung menuju Kawah Putih, Ranca Upas, area wisata Lembang, lalu kembali ke Bandung. Harga termasuk seat bus, driver, BBM, dan koordinasi perjalanan. Tiket masuk destinasi, makan, dan pengeluaran pribadi dapat disesuaikan dengan kebutuhan rombongan.',
    coverImageUrl: '',
    currency: 'IDR',
    sellPricePerSeat: 350000,
    netCostPerSeat: 275000,
    agentCommissionPerSeat: 25000,
    sortOrder: 1,
    status: 'Published',
    isPublic: true,
    isActive: true
  },
  departure: {
    departureDateTime: '2026-07-20T07:00:00+07:00',
    arrivalDateTime: '2026-07-20T19:00:00+07:00',
    pickupPoint: 'Alun-alun Bandung',
    dropoffPoint: 'Alun-alun Bandung',
    busName: 'Bis Hyjett Executive 45 Seat',
    busPlateNo: 'D 1234 HYJ',
    driverName: 'Pak Dedi',
    driverPhone: '6281211122233',
    seatCapacity: 45,
    seatsBooked: 0,
    seatsBlocked: 0,
    sellPricePerSeatOverride: 0,
    netCostPerSeatOverride: 0,
    status: 'Open',
    notes: 'Wisata satu hari, estimasi durasi 12 jam',
    isActive: true
  }
}, null, 2);

const sanitizeJsonInput = (raw: string) => raw
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
  .replace(/\r?\n/g, ' ')
  .replace(/\t/g, ' ');

export default function PartnerTransportPage() {
  const { show } = useToast();
  const [tab, setTab] = useState<TabKey>('packages');
  const [modal, setModal] = useState<ModalKey>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [partnerForm, setPartnerForm] = useState<any>(emptyPartner);
  const [packageForm, setPackageForm] = useState<any>(emptyPackage);
  const [departureForm, setDepartureForm] = useState<any>(emptyDeparture);
  const [bookingForm, setBookingForm] = useState<any>(emptyBooking);
  const [jsonText, setJsonText] = useState(busTourSampleJson);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  const departureOptions = useMemo(() => departures.filter((x) => x.status === 'Open' && Number(x.availableSeats || 0) > 0), [departures]);
  const activeList = tab === 'partners' ? partners : tab === 'packages' ? packages : tab === 'departures' ? departures : tab === 'bookings' ? bookings : payouts;

  const load = async () => {
    setLoading(true);
    try {
      const [d, p, pk, dep, b, po] = await Promise.all([
        apiGet<any>('/api/TransportPartner/admin/dashboard'),
        apiGet<any>('/api/TransportPartner/admin/partners'),
        apiGet<any>('/api/TransportPartner/admin/packages'),
        apiGet<any>('/api/TransportPartner/admin/departures'),
        apiGet<any>('/api/TransportPartner/admin/bookings'),
        apiGet<any>('/api/TransportPartner/admin/payouts'),
      ]);
      setDashboard(d?.data ?? null);
      setPartners(dedupeById(p?.data ?? []));
      setPackages(dedupeById(pk?.data ?? []));
      setDepartures(dedupeById(dep?.data ?? []));
      setBookings(dedupeById(b?.data ?? []));
      setPayouts(dedupeById(po?.data ?? []));
    } catch (e: any) {
      show(e?.message || 'Gagal memuat partner transport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const partnerPayload = (form: any) => ({
    name: String(form.name || '').trim(),
    slug: String(form.slug || '').trim(),
    partnerType: form.partnerType || 'bus-owner',
    contactName: form.contactName || '',
    contactPhone: form.contactPhone || '',
    contactEmail: form.contactEmail || '',
    address: form.address || '',
    city: form.city || '',
    province: form.province || '',
    contractNo: form.contractNo || '',
    contractStartDate: form.contractStartDate ? new Date(form.contractStartDate).toISOString() : null,
    contractEndDate: form.contractEndDate ? new Date(form.contractEndDate).toISOString() : null,
    settlementType: form.settlementType || 'net-rate',
    currency: form.currency || 'IDR',
    defaultCommissionAmount: Number(form.defaultCommissionAmount || 0),
    status: form.status || 'Active',
    notes: form.notes || '',
    isActive: Boolean(form.isActive),
  });

  const packagePayload = (form: any) => ({
    transportPartnerId: Number(form.transportPartnerId || 0),
    title: String(form.title || '').trim(),
    slug: String(form.slug || '').trim(),
    packageType: form.packageType || 'tour-bus',
    originCity: String(form.originCity || '').trim(),
    destinationCity: String(form.destinationCity || '').trim(),
    routeSummary: form.routeSummary || '',
    shortDescription: form.shortDescription || '',
    description: form.description || '',
    coverImageUrl: form.coverImageUrl || '',
    currency: form.currency || 'IDR',
    sellPricePerSeat: Number(form.sellPricePerSeat || 0),
    netCostPerSeat: Number(form.netCostPerSeat || 0),
    agentCommissionPerSeat: Number(form.agentCommissionPerSeat || 0),
    sortOrder: Number(form.sortOrder || 0),
    status: form.status || 'Draft',
    isPublic: Boolean(form.isPublic),
    isActive: Boolean(form.isActive),
  });

  const departurePayload = (form: any) => ({
    transportPackageId: Number(form.transportPackageId || 0),
    departureDateTime: form.departureDateTime ? new Date(form.departureDateTime).toISOString() : null,
    arrivalDateTime: form.arrivalDateTime ? new Date(form.arrivalDateTime).toISOString() : null,
    pickupPoint: form.pickupPoint || '',
    dropoffPoint: form.dropoffPoint || '',
    busName: form.busName || '',
    busPlateNo: form.busPlateNo || '',
    driverName: form.driverName || '',
    driverPhone: form.driverPhone || '',
    seatCapacity: Number(form.seatCapacity || 0),
    seatsBooked: Number(form.seatsBooked || 0),
    seatsBlocked: Number(form.seatsBlocked || 0),
    sellPricePerSeatOverride: Number(form.sellPricePerSeatOverride || 0),
    netCostPerSeatOverride: Number(form.netCostPerSeatOverride || 0),
    status: form.status || 'Open',
    notes: form.notes || '',
    isActive: Boolean(form.isActive),
  });

  const runSave = async (key: string, action: () => Promise<void>) => {
    setSaving(key);
    try {
      await action();
    } catch (e: any) {
      show(e?.message || 'Aksi gagal diproses');
    } finally {
      setSaving('');
    }
  };

  const savePartner = () => runSave('partner', async () => {
    if (!partnerForm.name.trim()) return show('Nama partner wajib diisi');
    const body = partnerPayload(partnerForm);
    if (partnerForm.id) await apiPut(`/api/TransportPartner/admin/partners/${partnerForm.id}`, body);
    else await apiPost('/api/TransportPartner/admin/partners', body);
    show(partnerForm.id ? 'Partner diperbarui' : 'Partner ditambahkan');
    setPartnerForm(emptyPartner);
    setModal(null);
    await load();
    setTab('packages');
  });

  const savePackage = () => runSave('package', async () => {
    if (!Number(packageForm.transportPartnerId || 0)) return show('Partner wajib dipilih');
    if (!packageForm.title.trim()) return show('Judul paket wajib diisi');
    if (!packageForm.originCity.trim() || !packageForm.destinationCity.trim()) return show('Asal dan tujuan wajib diisi');
    if (Number(packageForm.sellPricePerSeat || 0) <= 0) return show('Harga jual per seat wajib lebih dari 0');
    const body = packagePayload(packageForm);
    if (packageForm.id) await apiPut(`/api/TransportPartner/admin/packages/${packageForm.id}`, body);
    else await apiPost('/api/TransportPartner/admin/packages', body);
    show(packageForm.id ? 'Paket diperbarui' : 'Paket ditambahkan');
    setPackageForm(emptyPackage);
    setModal(null);
    await load();
    setTab('departures');
  });

  const saveDeparture = () => runSave('departure', async () => {
    if (!Number(departureForm.transportPackageId || 0)) return show('Paket wajib dipilih');
    if (!departureForm.departureDateTime) return show('Tanggal berangkat wajib diisi');
    if (Number(departureForm.seatCapacity || 0) <= 0) return show('Kapasitas seat wajib lebih dari 0');
    if (Number(departureForm.seatsBooked || 0) + Number(departureForm.seatsBlocked || 0) > Number(departureForm.seatCapacity || 0)) return show('Booked + blocked melebihi kapasitas');
    const body = departurePayload(departureForm);
    if (departureForm.id) await apiPut(`/api/TransportPartner/admin/departures/${departureForm.id}`, body);
    else await apiPost('/api/TransportPartner/admin/departures', body);
    show(departureForm.id ? 'Jadwal diperbarui' : 'Jadwal ditambahkan');
    setDepartureForm(emptyDeparture);
    setModal(null);
    await load();
    setTab('bookings');
  });

  const saveBooking = () => runSave('booking', async () => {
    if (!Number(bookingForm.transportDepartureId || 0)) return show('Jadwal wajib dipilih');
    if (!bookingForm.customerName.trim()) return show('Nama customer wajib diisi');
    if (!bookingForm.customerPhone.trim()) return show('WhatsApp customer wajib diisi');
    await apiPost('/api/TransportPartner/admin/bookings', {
      ...bookingForm,
      transportDepartureId: Number(bookingForm.transportDepartureId || 0),
      paxCount: Number(bookingForm.paxCount || 1),
    });
    show('Booking manual ditambahkan');
    setBookingForm(emptyBooking);
    setModal(null);
    await load();
  });

  const runJson = () => runSave('json', async () => {
    const parsed = JSON.parse(sanitizeJsonInput(jsonText));
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    for (const raw of rows) {
      let partnerId = Number(raw?.package?.transportPartnerId || raw?.transportPartnerId || 0);
      if (raw?.partner) {
        const res = await apiPost<any>('/api/TransportPartner/admin/partners', partnerPayload({ ...emptyPartner, ...raw.partner }));
        partnerId = Number(res?.data?.id || 0);
      }
      let packageId = Number(raw?.departure?.transportPackageId || raw?.transportPackageId || 0);
      if (raw?.package) {
        const res = await apiPost<any>('/api/TransportPartner/admin/packages', packagePayload({ ...emptyPackage, ...raw.package, transportPartnerId: partnerId }));
        packageId = Number(res?.data?.id || 0);
      }
      if (raw?.departure) {
        await apiPost('/api/TransportPartner/admin/departures', departurePayload({ ...emptyDeparture, ...raw.departure, transportPackageId: packageId }));
      }
    }
    show(`JSON berhasil diproses: ${rows.length} item`);
    setModal(null);
    await load();
    setTab('packages');
  });

  const updateBookingStatus = (id: number, status: string) => runSave(`booking-${id}`, async () => {
    await apiPut(`/api/TransportPartner/admin/bookings/${id}/status`, { status, notes: `Set ${status} dari admin`, paymentReferenceNo: status === 'Paid' ? `PAY-${Date.now()}` : '' });
    show('Status booking diperbarui');
    await load();
  });

  const updatePayoutStatus = (id: number, status: string) => runSave(`payout-${id}`, async () => {
    await apiPut(`/api/TransportPartner/admin/payouts/${id}/status`, { status, notes: `Set ${status} dari admin`, paymentReferenceNo: status === 'Paid' ? `PO-${Date.now()}` : '' });
    show('Status payout diperbarui');
    await load();
  });

  const openAdd = (key: ModalKey) => {
    if (key === 'partner') setPartnerForm(emptyPartner);
    if (key === 'package') setPackageForm(emptyPackage);
    if (key === 'departure') setDepartureForm(emptyDeparture);
    if (key === 'booking') setBookingForm(emptyBooking);
    setModal(key);
  };

  const editPartner = (row: any) => {
    setPartnerForm({ ...emptyPartner, ...row, contractStartDate: dateInput(row.contractStartDate), contractEndDate: dateInput(row.contractEndDate) });
    setModal('partner');
  };
  const editPackage = (row: any) => {
    setPackageForm({ ...emptyPackage, ...row, transportPartnerId: String(row.transportPartnerId || '') });
    setModal('package');
  };
  const editDeparture = (row: any) => {
    setDepartureForm({ ...emptyDeparture, ...row, transportPackageId: String(row.transportPackageId || ''), departureDateTime: dateInput(row.departureDateTime), arrivalDateTime: dateInput(row.arrivalDateTime) });
    setModal('departure');
  };
  const copyPublicLink = async (slug: string) => {
    const locale = window.location.pathname.split('/').filter(Boolean)[0] || 'id';
    const url = `${window.location.origin}/${locale}/transport/${slug}`;
    await navigator.clipboard?.writeText(url);
    show('Link iklan transport disalin');
  };

  const actionButton = tab === 'partners'
    ? <button className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white" onClick={() => openAdd('partner')}>+ Partner</button>
    : tab === 'packages'
      ? <button className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white" onClick={() => openAdd('package')}>+ Paket</button>
      : tab === 'departures'
        ? <button className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white" onClick={() => openAdd('departure')}>+ Jadwal</button>
        : tab === 'bookings'
          ? <button className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white" onClick={() => openAdd('booking')}>+ Booking</button>
          : null;

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <section className="overflow-hidden rounded-3xl border bg-zinc-950 text-white">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">Marketplace transport partner</p>
            <h1 className="mt-2 text-xl font-extrabold md:text-2xl">Partner Transport</h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-300 md:text-sm">Kelola iklan bus/open trip, jadwal seat, booking penumpang, referral affiliate, dan payout partner tanpa scroll form panjang.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/transport" className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-zinc-950">Katalog publik</Link>
              <button className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold" onClick={() => setModal('json')}>JSON Paket Wisata Bus</button>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <h2 className="text-sm font-extrabold">Alur pemasangan</h2>
            <div className="mt-3 grid gap-2 text-xs text-zinc-200">
              <Step no="1" title="Partner" text="Daftarkan pemilik armada/vendor." />
              <Step no="2" title="Paket" text="Buat iklan, harga, deskripsi, status Published." />
              <Step no="3" title="Jadwal" text="Isi tanggal, armada, pickup, kapasitas seat." />
              <Step no="4" title="Affiliate" text="Bagikan /transport/slug@username agar leads dan booking membawa ref agent." />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4 xl:grid-cols-7">
        <Metric label="Partner aktif" value={dashboard?.activePartners || 0} />
        <Metric label="Paket publik" value={dashboard?.publicPackages || 0} />
        <Metric label="Jadwal open" value={dashboard?.openDepartures || 0} />
        <Metric label="Booking baru" value={dashboard?.pendingBookings || 0} />
        <Metric label="Gross paid" value={money(dashboard?.grossPaid)} />
        <Metric label="Margin" value={money(dashboard?.companyMargin)} />
        <Metric label="Payout pending" value={money(dashboard?.pendingPayout)} />
      </div>

      <section className="rounded-3xl border bg-white p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              ['partners', 'Partner'],
              ['packages', 'Paket Iklan'],
              ['departures', 'Jadwal'],
              ['bookings', 'Booking'],
              ['payouts', 'Payout'],
            ].map(([key, label]) => (
              <button key={key} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${tab === key ? 'bg-zinc-900 text-white' : 'bg-white'}`} onClick={() => setTab(key as TabKey)}>{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {actionButton}
            <button className="rounded-xl border px-3 py-2 text-xs font-bold" onClick={() => void load()} disabled={loading}>{loading ? 'Memuat...' : 'Refresh'}</button>
          </div>
        </div>

        <div className="mt-3 max-h-[620px] overflow-y-auto rounded-2xl border bg-zinc-50 p-3">
          {loading ? <LoadingBlock /> : null}
          {!loading && activeList.length === 0 ? <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-xs text-zinc-500">Belum ada data pada tab ini.</div> : null}
          {!loading ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {tab === 'partners' ? partners.map((x) => <PartnerCard key={x.id} row={x} onEdit={() => editPartner(x)} />) : null}
              {tab === 'packages' ? packages.map((x) => <PackageCard key={x.id} row={x} onEdit={() => editPackage(x)} onCopy={() => void copyPublicLink(x.slug)} />) : null}
              {tab === 'departures' ? departures.map((x) => <DepartureCard key={x.id} row={x} onEdit={() => editDeparture(x)} />) : null}
              {tab === 'bookings' ? bookings.map((x) => <BookingCard key={x.id} row={x} saving={saving === `booking-${x.id}`} onStatus={(st) => updateBookingStatus(x.id, st)} />) : null}
              {tab === 'payouts' ? payouts.map((x) => <PayoutCard key={x.id} row={x} saving={saving === `payout-${x.id}`} onStatus={(st) => updatePayoutStatus(x.id, st)} />) : null}
            </div>
          ) : null}
        </div>
      </section>

      <CrudModal open={modal !== null} title={modalTitle(modal)} onClose={() => setModal(null)}>
        {modal === 'partner' ? <PartnerForm form={partnerForm} setForm={setPartnerForm} saving={saving === 'partner'} onSave={savePartner} /> : null}
        {modal === 'package' ? <PackageForm form={packageForm} setForm={setPackageForm} partners={partners} saving={saving === 'package'} onSave={savePackage} /> : null}
        {modal === 'departure' ? <DepartureForm form={departureForm} setForm={setDepartureForm} packages={packages} saving={saving === 'departure'} onSave={saveDeparture} /> : null}
        {modal === 'booking' ? <BookingForm form={bookingForm} setForm={setBookingForm} departures={departureOptions} saving={saving === 'booking'} onSave={saveBooking} /> : null}
        {modal === 'json' ? (
          <div className="space-y-3">
            <JsonPayloadConsole
              title="Bulk Partner + Paket + Jadwal"
              sampleJson={busTourSampleJson}
              jsonText={jsonText}
              setJsonText={setJsonText}
              onExecute={() => void runJson()}
              onExecuteBulk={() => void runJson()}
              helperText="Khusus Partner Transport. Klik preset Paket Wisata Bus, edit jika perlu, lalu Execute."
              presets={[{ label: 'Paket Wisata Bus', value: busTourSampleJson }]}
            />
            <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} className="min-h-80 w-full rounded-2xl border bg-zinc-50 px-3 py-2 font-mono text-[11px]" spellCheck={false} />
            <button className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60" disabled={saving === 'json'} onClick={() => void runJson()}>{saving === 'json' ? 'Executing...' : 'Execute JSON'}</button>
          </div>
        ) : null}
      </CrudModal>
    </div>
  );
}

function modalTitle(modal: ModalKey) {
  if (modal === 'partner') return 'Form Partner Transport';
  if (modal === 'package') return 'Form Paket Iklan Transport';
  if (modal === 'departure') return 'Form Jadwal Armada';
  if (modal === 'booking') return 'Form Booking Manual';
  if (modal === 'json') return 'JSON Paket Wisata Bus';
  return '';
}

function dedupeById(rows: any[]) {
  return Array.from(new Map((rows || []).map((x) => [x.id, x])).values());
}

function Metric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-2xl border bg-white p-3"><div className="text-zinc-500">{label}</div><b>{value}</b></div>;
}

function LoadingBlock() {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border bg-white text-xs text-zinc-500">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-primary-600" />
      <span>Memuat data partner transport...</span>
    </div>
  );
}

function Step({ no, title, text }: { no: string; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/10 p-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-300 text-[11px] font-black text-zinc-950">{no}</span><span><b className="block text-white">{title}</b><span className="text-zinc-300">{text}</span></span></div>;
}

function CrudModal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <ModalShell open={open} onBackdropClick={onClose} contentWrapperClassName="relative h-full w-full flex items-center justify-center p-3 pointer-events-none">
      <div className="mx-auto max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-5 py-4 backdrop-blur">
          <h3 className="text-sm font-extrabold">{title}</h3>
          <button className="rounded-full border px-3 py-1 text-xs" onClick={onClose}>Tutup</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </ModalShell>
  );
}

function PartnerCard({ row, onEdit }: { row: any; onEdit: () => void }) {
  return <Card><div className="flex justify-between gap-2"><div><b>{row.name}</b><div className="text-zinc-500">{row.city || '-'} • {row.contactName || '-'} • {row.status}</div></div><button className="rounded-lg border px-2 py-1 text-[11px]" onClick={onEdit}>Edit</button></div></Card>;
}

function PackageCard({ row, onEdit, onCopy }: { row: any; onEdit: () => void; onCopy: () => void }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2"><div><b>{row.title}</b><div className="text-zinc-500">{row.partnerName} • {row.originCity} - {row.destinationCity}</div></div><button className="rounded-lg border px-2 py-1 text-[11px]" onClick={onEdit}>Edit</button></div>
      <div className="grid grid-cols-3 gap-2 text-[11px]"><Info label="Jual" value={money(row.sellPricePerSeat)} /><Info label="Net" value={money(row.netCostPerSeat)} /><Info label="Margin" value={money(row.estimatedMarginPerSeat)} /></div>
      <div className="flex flex-wrap gap-1.5">{row.slug ? <Link href={`/transport/${row.slug}`} className="rounded-lg border px-2 py-1 text-[11px] font-semibold">Lihat iklan</Link> : null}{row.slug ? <button className="rounded-lg border px-2 py-1 text-[11px] font-semibold" onClick={onCopy}>Copy link</button> : null}<span className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${row.status === 'Published' && row.isPublic ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>{row.status === 'Published' && row.isPublic ? 'Publik' : 'Belum tampil'}</span></div>
    </Card>
  );
}

function DepartureCard({ row, onEdit }: { row: any; onEdit: () => void }) {
  return <Card><div className="flex justify-between gap-2"><b>{row.packageTitle}</b><span>{row.status}</span></div><div className="text-zinc-500">{row.departureDateTime ? new Date(row.departureDateTime).toLocaleString('id-ID') : '-'} • {row.pickupPoint || '-'}</div><div className="grid grid-cols-3 gap-2 text-[11px]"><Info label="Seat" value={`${row.seatsBooked}/${row.seatCapacity}`} /><Info label="Blocked" value={row.seatsBlocked} /><Info label="Available" value={row.availableSeats} /></div><button className="rounded-lg border px-2 py-1 text-[11px]" onClick={onEdit}>Edit</button></Card>;
}

function BookingCard({ row, saving, onStatus }: { row: any; saving: boolean; onStatus: (status: string) => void }) {
  return <Card><div className="flex flex-wrap justify-between gap-2"><b>{row.customerName}</b><span>{row.status}</span></div><div className="text-zinc-500">{row.packageTitle} • {row.partnerName} • {row.paxCount} pax • Ref: {row.refAgentUsername || '-'}</div><div className="grid grid-cols-2 gap-2"><Info label="Gross" value={money(row.grossAmount)} /><Info label="Margin" value={money(row.companyMarginAmount)} /></div><div className="flex flex-wrap gap-1.5">{['Confirmed', 'Paid', 'Completed', 'Cancelled'].map((st) => <button key={st} className="rounded-lg border px-2 py-1 text-[11px]" disabled={saving} onClick={() => onStatus(st)}>{saving ? '...' : st}</button>)}</div></Card>;
}

function PayoutCard({ row, saving, onStatus }: { row: any; saving: boolean; onStatus: (status: string) => void }) {
  return <Card><div className="flex flex-wrap justify-between gap-2"><b>{row.payoutNo}</b><span>{row.status}</span></div><div className="text-zinc-500">{row.partnerName} • {row.customerName || '-'} • {money(row.amount)}</div><div className="flex flex-wrap gap-1.5">{['Approved', 'Paid', 'Cancelled'].map((st) => <button key={st} className="rounded-lg border px-2 py-1 text-[11px]" disabled={saving} onClick={() => onStatus(st)}>{saving ? '...' : st}</button>)}</div></Card>;
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border bg-white p-3 text-xs space-y-2 shadow-sm">{children}</div>;
}

function Info({ label, value }: { label: string; value: any }) {
  return <div className="rounded-xl border bg-zinc-50 p-2"><div className="text-[10px] text-zinc-500">{label}</div><div className="font-bold">{value}</div></div>;
}

function TextInput({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return <label className="space-y-1 text-[11px] font-semibold text-zinc-600"><span>{label}</span><input className="w-full rounded-xl border px-3 py-2 text-xs font-normal text-zinc-900" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function NumberInput({ label, value, onChange }: { label: string; value: any; onChange: (v: number) => void }) {
  return <label className="space-y-1 text-[11px] font-semibold text-zinc-600"><span>{label}</span><input className="w-full rounded-xl border px-3 py-2 text-xs font-normal text-zinc-900" type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value || 0))} /></label>;
}

function DateTimeInput({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return <label className="space-y-1 text-[11px] font-semibold text-zinc-600"><span>{label}</span><input className="w-full rounded-xl border px-3 py-2 text-xs font-normal text-zinc-900" type="datetime-local" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function SelectInput({ label, value, options, onChange }: { label: string; value: any; options: Array<string | { value: string; label: string }>; onChange: (v: string) => void }) {
  return <label className="space-y-1 text-[11px] font-semibold text-zinc-600"><span>{label}</span><select className="w-full rounded-xl border px-3 py-2 text-xs font-normal text-zinc-900" value={value ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">Pilih {label}</option>{options.map((x) => { const row = typeof x === 'string' ? { value: x, label: x } : x; return <option key={row.value} value={row.value}>{row.label}</option>; })}</select></label>;
}

function SaveButton({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return <button className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60" disabled={saving} onClick={onSave}>{saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}{saving ? 'Menyimpan...' : 'Simpan'}</button>;
}

function PartnerForm({ form, setForm, saving, onSave }: { form: any; setForm: any; saving: boolean; onSave: () => void }) {
  return <div className="space-y-3"><div className="grid gap-3 md:grid-cols-2"><TextInput label="Nama partner" value={form.name} onChange={(v) => setForm((p: any) => ({ ...p, name: v }))} /><TextInput label="Slug" value={form.slug} onChange={(v) => setForm((p: any) => ({ ...p, slug: v }))} /><TextInput label="Contact" value={form.contactName} onChange={(v) => setForm((p: any) => ({ ...p, contactName: v }))} /><TextInput label="WhatsApp" value={form.contactPhone} onChange={(v) => setForm((p: any) => ({ ...p, contactPhone: v }))} /><TextInput label="Email" value={form.contactEmail} onChange={(v) => setForm((p: any) => ({ ...p, contactEmail: v }))} /><TextInput label="Kota" value={form.city} onChange={(v) => setForm((p: any) => ({ ...p, city: v }))} /><TextInput label="No kontrak" value={form.contractNo} onChange={(v) => setForm((p: any) => ({ ...p, contractNo: v }))} /><NumberInput label="Default komisi" value={form.defaultCommissionAmount} onChange={(v) => setForm((p: any) => ({ ...p, defaultCommissionAmount: v }))} /><SelectInput label="Status" value={form.status} options={['Active', 'Draft', 'Suspended']} onChange={(v) => setForm((p: any) => ({ ...p, status: v }))} /></div><textarea className="min-h-20 w-full rounded-xl border px-3 py-2 text-xs" placeholder="Catatan" value={form.notes} onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))} /><SaveButton saving={saving} onSave={onSave} /></div>;
}

function PackageForm({ form, setForm, partners, saving, onSave }: { form: any; setForm: any; partners: any[]; saving: boolean; onSave: () => void }) {
  return <div className="space-y-3"><SelectInput label="Partner" value={form.transportPartnerId} options={partners.map((x) => ({ value: String(x.id), label: x.name }))} onChange={(v) => setForm((p: any) => ({ ...p, transportPartnerId: v }))} /><div className="grid gap-3 md:grid-cols-2"><TextInput label="Judul paket" value={form.title} onChange={(v) => setForm((p: any) => ({ ...p, title: v }))} /><TextInput label="Slug iklan" value={form.slug} onChange={(v) => setForm((p: any) => ({ ...p, slug: v }))} /><TextInput label="Asal" value={form.originCity} onChange={(v) => setForm((p: any) => ({ ...p, originCity: v }))} /><TextInput label="Tujuan" value={form.destinationCity} onChange={(v) => setForm((p: any) => ({ ...p, destinationCity: v }))} /><NumberInput label="Harga jual/seat" value={form.sellPricePerSeat} onChange={(v) => setForm((p: any) => ({ ...p, sellPricePerSeat: v }))} /><NumberInput label="Net partner/seat" value={form.netCostPerSeat} onChange={(v) => setForm((p: any) => ({ ...p, netCostPerSeat: v }))} /><NumberInput label="Komisi agen/seat" value={form.agentCommissionPerSeat} onChange={(v) => setForm((p: any) => ({ ...p, agentCommissionPerSeat: v }))} /><SelectInput label="Status" value={form.status} options={['Draft', 'Published', 'Closed']} onChange={(v) => setForm((p: any) => ({ ...p, status: v }))} /></div><TextInput label="Route summary" value={form.routeSummary} onChange={(v) => setForm((p: any) => ({ ...p, routeSummary: v }))} /><TextInput label="URL cover image" value={form.coverImageUrl} onChange={(v) => setForm((p: any) => ({ ...p, coverImageUrl: v }))} /><textarea className="min-h-20 w-full rounded-xl border px-3 py-2 text-xs" placeholder="Deskripsi singkat" value={form.shortDescription} onChange={(e) => setForm((p: any) => ({ ...p, shortDescription: e.target.value }))} /><textarea className="min-h-28 w-full rounded-xl border px-3 py-2 text-xs" placeholder="Deskripsi lengkap" value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} /><label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"><input type="checkbox" checked={Boolean(form.isPublic)} onChange={(e) => setForm((p: any) => ({ ...p, isPublic: e.target.checked }))} />Tampilkan publik</label><SaveButton saving={saving} onSave={onSave} /></div>;
}

function DepartureForm({ form, setForm, packages, saving, onSave }: { form: any; setForm: any; packages: any[]; saving: boolean; onSave: () => void }) {
  return <div className="space-y-3"><SelectInput label="Paket" value={form.transportPackageId} options={packages.map((x) => ({ value: String(x.id), label: `${x.title} (${x.originCity}-${x.destinationCity})` }))} onChange={(v) => setForm((p: any) => ({ ...p, transportPackageId: v }))} /><div className="grid gap-3 md:grid-cols-2"><DateTimeInput label="Berangkat" value={form.departureDateTime} onChange={(v) => setForm((p: any) => ({ ...p, departureDateTime: v }))} /><DateTimeInput label="Tiba" value={form.arrivalDateTime} onChange={(v) => setForm((p: any) => ({ ...p, arrivalDateTime: v }))} /><TextInput label="Pickup" value={form.pickupPoint} onChange={(v) => setForm((p: any) => ({ ...p, pickupPoint: v }))} /><TextInput label="Dropoff" value={form.dropoffPoint} onChange={(v) => setForm((p: any) => ({ ...p, dropoffPoint: v }))} /><TextInput label="Bus" value={form.busName} onChange={(v) => setForm((p: any) => ({ ...p, busName: v }))} /><TextInput label="Plat" value={form.busPlateNo} onChange={(v) => setForm((p: any) => ({ ...p, busPlateNo: v }))} /><TextInput label="Driver" value={form.driverName} onChange={(v) => setForm((p: any) => ({ ...p, driverName: v }))} /><TextInput label="HP Driver" value={form.driverPhone} onChange={(v) => setForm((p: any) => ({ ...p, driverPhone: v }))} /><NumberInput label="Capacity" value={form.seatCapacity} onChange={(v) => setForm((p: any) => ({ ...p, seatCapacity: v }))} /><NumberInput label="Blocked" value={form.seatsBlocked} onChange={(v) => setForm((p: any) => ({ ...p, seatsBlocked: v }))} /><SelectInput label="Status" value={form.status} options={['Open', 'Closed', 'Cancelled', 'Completed']} onChange={(v) => setForm((p: any) => ({ ...p, status: v }))} /></div><SaveButton saving={saving} onSave={onSave} /></div>;
}

function BookingForm({ form, setForm, departures, saving, onSave }: { form: any; setForm: any; departures: any[]; saving: boolean; onSave: () => void }) {
  return <div className="space-y-3"><SelectInput label="Jadwal" value={form.transportDepartureId} options={departures.map((x) => ({ value: String(x.id), label: `${x.packageTitle} - ${new Date(x.departureDateTime).toLocaleString('id-ID')} (${x.availableSeats} seat)` }))} onChange={(v) => setForm((p: any) => ({ ...p, transportDepartureId: v }))} /><div className="grid gap-3 md:grid-cols-2"><TextInput label="Nama customer" value={form.customerName} onChange={(v) => setForm((p: any) => ({ ...p, customerName: v }))} /><TextInput label="WhatsApp" value={form.customerPhone} onChange={(v) => setForm((p: any) => ({ ...p, customerPhone: v }))} /><TextInput label="Email" value={form.customerEmail} onChange={(v) => setForm((p: any) => ({ ...p, customerEmail: v }))} /><TextInput label="Ref agent" value={form.refAgentUsername} onChange={(v) => setForm((p: any) => ({ ...p, refAgentUsername: v }))} /><NumberInput label="Pax" value={form.paxCount} onChange={(v) => setForm((p: any) => ({ ...p, paxCount: v }))} /></div><textarea className="min-h-20 w-full rounded-xl border px-3 py-2 text-xs" placeholder="Catatan booking" value={form.notes} onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))} /><SaveButton saving={saving} onSave={onSave} /></div>;
}
