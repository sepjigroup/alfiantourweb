'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { useToast } from '@/components/Toast';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';

const tabs = [
  { key: 'leads', label: 'Leads' },
  { key: 'proposals', label: 'Proposal' },
  { key: 'checklists', label: 'Checklist' },
  { key: 'attributions', label: 'Affiliate' },
  { key: 'suppliers', label: 'Supplier' },
];

const leadStatuses = ['New', 'Contacted', 'Qualified', 'ProposalSent', 'Won', 'Lost', 'Cancelled'];
const proposalStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Cancelled'];
const checklistStatuses = ['Open', 'InProgress', 'Completed', 'Cancelled'];

const emptyLead = {
  id: 0,
  customerName: '',
  customerPhone: '',
  sourceType: 'manual',
  sourceKey: '',
  sourceSlug: '',
  customerEmail: '',
  destination: '',
  travelDate: '',
  paxCount: 1,
  estimatedBudget: 0,
  currency: 'IDR',
  status: 'New',
  assignedToUserId: '',
  followUpAt: '',
  refAgentUsername: '',
  campaign: '',
  uTMSource: '',
  uTMMedium: '',
  uTMCampaign: '',
  customerMessage: '',
  internalNotes: '',
};

const emptyProposal = {
  id: 0,
  commerceLeadId: 0,
  title: '',
  currency: 'IDR',
  discountAmount: 0,
  taxAmount: 0,
  proposalDate: '',
  validUntil: '',
  status: 'Draft',
  itinerarySummary: '',
  inclusions: '',
  exclusions: '',
  terms: '',
  internalNotes: '',
  linesText: 'Biaya layanan utama|1|pax|0\nAdministrasi & handling|1|paket|0',
};

const emptyChecklist = {
  title: '',
  sourceType: 'lead',
  commerceLeadId: 0,
  commerceProposalId: 0,
  status: 'Open',
  dueDate: '',
  ownerUserId: '',
  notes: '',
  itemsText: 'Follow up customer\nSiapkan penawaran\nKonfirmasi supplier\nKirim update WhatsApp',
};

const emptySupplier = {
  id: 0,
  supplierName: '',
  supplierType: 'hotel',
  contractNo: '',
  effectiveDate: '',
  expiryDate: '',
  allotmentTotal: 0,
  allotmentUsed: 0,
  unitCost: 0,
  penaltyCost: 0,
  status: 'active',
  notes: '',
};

export default function CommerceOpsPage() {
  const { show } = useToast();
  const [activeTab, setActiveTab] = useState('leads');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [modal, setModal] = useState('');
  const [leadForm, setLeadForm] = useState<any>(emptyLead);
  const [proposalForm, setProposalForm] = useState<any>(emptyProposal);
  const [checklistForm, setChecklistForm] = useState<any>(emptyChecklist);
  const [supplierForm, setSupplierForm] = useState<any>(emptySupplier);
  const [query, setQuery] = useState('');

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((x) => `${x.customerName} ${x.customerPhone} ${x.sourceType} ${x.sourceSlug} ${x.refAgentUsername}`.toLowerCase().includes(q));
  }, [leads, query]);

  const selectedLeadOptions = useMemo(() => leads.map((x) => ({ value: String(x.id), label: `${x.customerName} - ${x.sourceType}` })), [leads]);

  async function load() {
    setLoading(true);
    try {
      const [dash, leadRes, proposalRes, checklistRes, attributionRes, supplierRes] = await Promise.all([
        apiGet<any>('/api/CommerceOps/dashboard'),
        apiGet<any>('/api/CommerceOps/leads'),
        apiGet<any>('/api/CommerceOps/proposals'),
        apiGet<any>('/api/CommerceOps/checklists'),
        apiGet<any>('/api/CommerceOps/attributions'),
        apiGet<any>('/api/CommerceOps/suppliers'),
      ]);
      setDashboard(dash.data ?? dash);
      setLeads(asArray(leadRes));
      setProposals(asArray(proposalRes));
      setChecklists(asArray(checklistRes));
      setAttributions(asArray(attributionRes));
      setSuppliers(asArray(supplierRes));
    } catch (e: any) {
      show(e?.message || 'Gagal memuat Commerce Ops');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function run(action: () => Promise<void>, success: string) {
    setSaving(true);
    try {
      await action();
      show(success);
      setModal('');
      await load();
    } catch (e: any) {
      show(e?.message || 'Proses gagal');
    } finally {
      setSaving(false);
    }
  }

  async function saveLead() {
    const body = {
      ...leadForm,
      paxCount: Number(leadForm.paxCount || 1),
      estimatedBudget: Number(leadForm.estimatedBudget || 0),
      travelDate: toIsoOrNull(leadForm.travelDate),
      followUpAt: toIsoOrNull(leadForm.followUpAt),
    };
    await run(async () => {
      if (leadForm.id) await apiPut(`/api/CommerceOps/leads/${leadForm.id}`, body);
      else await apiPost('/api/CommerceOps/leads', body);
    }, 'Lead tersimpan');
  }

  async function saveProposal() {
    const lines = String(proposalForm.linesText || '').split('\n').map((line) => {
      const [itemName, quantity, unit, unitPrice, description] = line.split('|').map((x) => (x || '').trim());
      return { itemName, quantity: Number(quantity || 1), unit: unit || 'pax', unitPrice: Number(unitPrice || 0), description };
    }).filter((x) => x.itemName);
    const body = {
      ...proposalForm,
      commerceLeadId: Number(proposalForm.commerceLeadId || 0),
      discountAmount: Number(proposalForm.discountAmount || 0),
      taxAmount: Number(proposalForm.taxAmount || 0),
      proposalDate: toIsoOrNull(proposalForm.proposalDate),
      validUntil: toIsoOrNull(proposalForm.validUntil),
      lines,
    };
    await run(async () => {
      if (proposalForm.id) await apiPut(`/api/CommerceOps/proposals/${proposalForm.id}`, body);
      else await apiPost('/api/CommerceOps/proposals', body);
    }, 'Proposal tersimpan');
  }

  async function saveChecklist() {
    const body = {
      ...checklistForm,
      commerceLeadId: Number(checklistForm.commerceLeadId || 0) || null,
      commerceProposalId: Number(checklistForm.commerceProposalId || 0) || null,
      dueDate: toIsoOrNull(checklistForm.dueDate),
      items: String(checklistForm.itemsText || '').split('\n').map((x) => x.trim()).filter(Boolean),
    };
    await run(async () => { await apiPost('/api/CommerceOps/checklists', body); }, 'Checklist dibuat');
  }

  async function saveSupplier() {
    const body = {
      ...supplierForm,
      effectiveDate: toIsoOrNull(supplierForm.effectiveDate),
      expiryDate: toIsoOrNull(supplierForm.expiryDate),
      allotmentTotal: Number(supplierForm.allotmentTotal || 0),
      allotmentUsed: Number(supplierForm.allotmentUsed || 0),
      unitCost: Number(supplierForm.unitCost || 0),
      penaltyCost: Number(supplierForm.penaltyCost || 0),
    };
    await run(async () => {
      if (supplierForm.id) await apiPut(`/api/CommerceOps/suppliers/${supplierForm.id}`, body);
      else await apiPost('/api/CommerceOps/suppliers', body);
    }, 'Supplier tersimpan');
  }

  const stats = dashboard ?? {};

  return (
    <div className="min-h-screen bg-[#f5f1e8] p-4 text-zinc-950 md:p-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-[#1f241d] p-5 text-white shadow-sm md:p-7">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#d6a84f]/30 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#e8c978]">Commerce command center</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">CRM, Proposal, Affiliate & Operasional</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-200">
              Satu pusat kerja untuk semua calon customer dari layanan, paket, transport, affiliate, dan request manual.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setModal('guide')} className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-black flex items-center gap-1.5 transition-all shadow-md">
              <span>💡</span> Panduan
            </button>
            <button onClick={() => { setLeadForm(emptyLead); setModal('lead'); }} className="rounded-full bg-[#e8c978] px-4 py-2 text-xs font-black text-zinc-950">+ Lead</button>
            <button onClick={() => { setProposalForm({ ...emptyProposal, commerceLeadId: leads[0]?.id ?? 0 }); setModal('proposal'); }} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">+ Proposal</button>
            <button onClick={() => { setChecklistForm(emptyChecklist); setModal('checklist'); }} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">+ Checklist</button>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Lead Baru" value={stats.leads?.new ?? 0} hint={`${stats.leads?.total ?? 0} total`} />
        <Metric label="Pipeline" value={money(stats.leads?.estimatedPipeline)} hint="Belum closing" />
        <Metric label="Proposal Sent" value={stats.proposals?.sent ?? 0} hint={`${money(stats.proposals?.totalValue)} total`} />
        <Metric label="Accepted" value={money(stats.proposals?.acceptedValue)} hint={`${stats.proposals?.accepted ?? 0} proposal`} />
        <Metric label="Checklist Open" value={stats.operations?.openChecklist ?? 0} hint={`${stats.operations?.overdueChecklist ?? 0} overdue`} />
      </section>

      <section className="mt-4 rounded-[2rem] border border-stone-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`rounded-full px-4 py-2 text-xs font-black ${activeTab === tab.key ? 'bg-zinc-950 text-white' : 'bg-stone-100 text-zinc-600'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari lead/customer..." className="h-10 rounded-full border border-stone-200 px-4 text-sm outline-none focus:border-zinc-900 md:w-72" />
        </div>
      </section>

      {loading ? <Spinner /> : (
        <div className="mt-4">
          {activeTab === 'leads' && (
            <CardGrid>
              {filteredLeads.map((x) => (
                <DataCard key={x.id} title={x.customerName} subtitle={`${x.sourceType} ${x.sourceSlug ? `- ${x.sourceSlug}` : ''}`} badge={x.status}>
                  <Info label="WhatsApp" value={x.customerPhone || '-'} />
                  <Info label="Budget" value={money(x.estimatedBudget)} />
                  <Info label="Affiliate" value={x.refAgentUsername || '-'} />
                  <Info label="Follow up" value={fmtDate(x.followUpAt)} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {leadStatuses.map((s) => <SmallButton key={s} onClick={() => run(async () => { await apiPut(`/api/CommerceOps/leads/${x.id}/status`, { status: s, notes: `Set ${s} dari command center` }); }, 'Status lead diperbarui')}>{s}</SmallButton>)}
                    <SmallButton onClick={() => { setLeadForm({ ...emptyLead, ...x, travelDate: toDateInput(x.travelDate), followUpAt: toDateInput(x.followUpAt) }); setModal('lead'); }}>Edit</SmallButton>
                  </div>
                </DataCard>
              ))}
            </CardGrid>
          )}

          {activeTab === 'proposals' && (
            <CardGrid>
              {proposals.map((x) => (
                <DataCard key={x.id} title={x.title} subtitle={`${x.proposalNo} - ${x.leadName}`} badge={x.status}>
                  <Info label="Nilai" value={money(x.totalAmount)} />
                  <Info label="Berlaku" value={fmtDate(x.validUntil)} />
                  <Info label="Tanggal" value={fmtDate(x.proposalDate)} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {proposalStatuses.map((s) => <SmallButton key={s} onClick={() => run(async () => { await apiPut(`/api/CommerceOps/proposals/${x.id}/status`, { status: s, notes: `Set ${s}` }); }, 'Status proposal diperbarui')}>{s}</SmallButton>)}
                    <SmallButton onClick={() => { setProposalForm({ ...emptyProposal, ...x, proposalDate: toDateInput(x.proposalDate), validUntil: toDateInput(x.validUntil), linesText: 'Biaya layanan utama|1|pax|0' }); setModal('proposal'); }}>Edit</SmallButton>
                  </div>
                </DataCard>
              ))}
            </CardGrid>
          )}

          {activeTab === 'checklists' && (
            <CardGrid>
              {checklists.map((x) => (
                <DataCard key={x.id} title={x.title} subtitle={x.leadName || x.sourceType} badge={x.status}>
                  <Info label="Progress" value={`${x.doneItems ?? 0}/${x.totalItems ?? 0}`} />
                  <Info label="Due" value={fmtDate(x.dueDate)} />
                  <div className="mt-3 space-y-2">
                    {(x.items ?? []).map((item: any) => (
                      <button key={item.id} onClick={() => run(async () => { await apiPut(`/api/CommerceOps/checklists/items/${item.id}/toggle`, { isDone: !item.isDone }); }, 'Checklist diperbarui')} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs ${item.isDone ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-stone-200 bg-stone-50 text-zinc-700'}`}>
                        <span>{item.isDone ? '✓' : '○'}</span><span>{item.taskName}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {checklistStatuses.map((s) => <SmallButton key={s} onClick={() => run(async () => { await apiPut(`/api/CommerceOps/checklists/${x.id}/status`, { status: s, notes: `Set ${s}` }); }, 'Status checklist diperbarui')}>{s}</SmallButton>)}
                  </div>
                </DataCard>
              ))}
            </CardGrid>
          )}

          {activeTab === 'attributions' && (
            <CardGrid>
              {attributions.map((x) => (
                <DataCard key={x.id} title={x.refAgentUsername || 'Tanpa affiliate'} subtitle={x.pageUrl || x.sourceSlug || '-'} badge={x.touchType}>
                  <Info label="Source" value={x.sourceType || '-'} />
                  <Info label="Lead" value={x.leadName || '-'} />
                  <Info label="Touch" value={fmtDate(x.touchedAt)} />
                  <Info label="Conversion" value={fmtDate(x.convertedAt)} />
                </DataCard>
              ))}
            </CardGrid>
          )}

          {activeTab === 'suppliers' && (
            <>
              <div className="mb-3 flex justify-end"><button onClick={() => { setSupplierForm(emptySupplier); setModal('supplier'); }} className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white">+ Supplier</button></div>
              <CardGrid>
                {suppliers.map((x) => (
                  <DataCard key={x.id} title={x.supplierName} subtitle={`${x.supplierType} - ${x.contractNo || 'tanpa kontrak'}`} badge={x.status}>
                    <Info label="Allotment" value={`${x.allotmentUsed}/${x.allotmentTotal}`} />
                    <Info label="Unit Cost" value={money(x.unitCost)} />
                    <Info label="Efektif" value={fmtDate(x.effectiveDate)} />
                    <SmallButton onClick={() => { setSupplierForm({ ...emptySupplier, ...x, effectiveDate: toDateInput(x.effectiveDate), expiryDate: toDateInput(x.expiryDate) }); setModal('supplier'); }}>Edit</SmallButton>
                  </DataCard>
                ))}
              </CardGrid>
            </>
          )}
        </div>
      )}

      <CrudModal open={modal === 'lead'} title={leadForm.id ? 'Edit Lead' : 'Tambah Lead'} onClose={() => setModal('')}>
        <FormGrid>
          <TextInput label="Nama Customer" value={leadForm.customerName} onChange={(v) => setLeadForm({ ...leadForm, customerName: v })} />
          <TextInput label="WhatsApp" value={leadForm.customerPhone} onChange={(v) => setLeadForm({ ...leadForm, customerPhone: v })} />
          <TextInput label="Email" value={leadForm.customerEmail} onChange={(v) => setLeadForm({ ...leadForm, customerEmail: v })} />
          <TextInput label="Sumber" value={leadForm.sourceType} onChange={(v) => setLeadForm({ ...leadForm, sourceType: v })} />
          <TextInput label="Slug/Produk" value={leadForm.sourceSlug} onChange={(v) => setLeadForm({ ...leadForm, sourceSlug: v })} />
          <TextInput label="Destinasi" value={leadForm.destination} onChange={(v) => setLeadForm({ ...leadForm, destination: v })} />
          <TextInput label="Tanggal Travel" type="date" value={leadForm.travelDate} onChange={(v) => setLeadForm({ ...leadForm, travelDate: v })} />
          <TextInput label="Pax" type="number" value={leadForm.paxCount} onChange={(v) => setLeadForm({ ...leadForm, paxCount: v })} />
          <TextInput label="Budget" type="number" value={leadForm.estimatedBudget} onChange={(v) => setLeadForm({ ...leadForm, estimatedBudget: v })} />
          <SelectInput label="Status" value={leadForm.status} options={leadStatuses.map((x) => ({ value: x, label: x }))} onChange={(v) => setLeadForm({ ...leadForm, status: v })} />
          <TextInput label="Affiliate" value={leadForm.refAgentUsername} onChange={(v) => setLeadForm({ ...leadForm, refAgentUsername: v })} />
          <TextInput label="Follow Up" type="date" value={leadForm.followUpAt} onChange={(v) => setLeadForm({ ...leadForm, followUpAt: v })} />
        </FormGrid>
        <Textarea label="Pesan Customer" value={leadForm.customerMessage} onChange={(v) => setLeadForm({ ...leadForm, customerMessage: v })} />
        <Textarea label="Catatan Internal" value={leadForm.internalNotes} onChange={(v) => setLeadForm({ ...leadForm, internalNotes: v })} />
        <SubmitButton saving={saving} onClick={saveLead}>Simpan Lead</SubmitButton>
      </CrudModal>

      <CrudModal open={modal === 'proposal'} title={proposalForm.id ? 'Edit Proposal' : 'Tambah Proposal'} onClose={() => setModal('')}>
        <FormGrid>
          <SelectInput label="Lead" value={String(proposalForm.commerceLeadId || '')} options={[{ value: '', label: 'Pilih lead' }, ...selectedLeadOptions]} onChange={(v) => setProposalForm({ ...proposalForm, commerceLeadId: Number(v || 0) })} />
          <TextInput label="Judul" value={proposalForm.title} onChange={(v) => setProposalForm({ ...proposalForm, title: v })} />
          <TextInput label="Diskon" type="number" value={proposalForm.discountAmount} onChange={(v) => setProposalForm({ ...proposalForm, discountAmount: v })} />
          <TextInput label="Pajak" type="number" value={proposalForm.taxAmount} onChange={(v) => setProposalForm({ ...proposalForm, taxAmount: v })} />
          <TextInput label="Tanggal Proposal" type="date" value={proposalForm.proposalDate} onChange={(v) => setProposalForm({ ...proposalForm, proposalDate: v })} />
          <TextInput label="Valid Until" type="date" value={proposalForm.validUntil} onChange={(v) => setProposalForm({ ...proposalForm, validUntil: v })} />
          <SelectInput label="Status" value={proposalForm.status} options={proposalStatuses.map((x) => ({ value: x, label: x }))} onChange={(v) => setProposalForm({ ...proposalForm, status: v })} />
        </FormGrid>
        <Textarea label="Line item format: nama|qty|unit|harga|deskripsi" rows={5} value={proposalForm.linesText} onChange={(v) => setProposalForm({ ...proposalForm, linesText: v })} />
        <Textarea label="Itinerary Summary" value={proposalForm.itinerarySummary} onChange={(v) => setProposalForm({ ...proposalForm, itinerarySummary: v })} />
        <Textarea label="Include" value={proposalForm.inclusions} onChange={(v) => setProposalForm({ ...proposalForm, inclusions: v })} />
        <Textarea label="Exclude" value={proposalForm.exclusions} onChange={(v) => setProposalForm({ ...proposalForm, exclusions: v })} />
        <Textarea label="Terms" value={proposalForm.terms} onChange={(v) => setProposalForm({ ...proposalForm, terms: v })} />
        <SubmitButton saving={saving} onClick={saveProposal}>Simpan Proposal</SubmitButton>
      </CrudModal>

      <CrudModal open={modal === 'checklist'} title="Tambah Checklist Operasional" onClose={() => setModal('')}>
        <FormGrid>
          <TextInput label="Judul" value={checklistForm.title} onChange={(v) => setChecklistForm({ ...checklistForm, title: v })} />
          <SelectInput label="Lead" value={String(checklistForm.commerceLeadId || '')} options={[{ value: '', label: 'Opsional' }, ...selectedLeadOptions]} onChange={(v) => setChecklistForm({ ...checklistForm, commerceLeadId: Number(v || 0) })} />
          <TextInput label="Due Date" type="date" value={checklistForm.dueDate} onChange={(v) => setChecklistForm({ ...checklistForm, dueDate: v })} />
          <SelectInput label="Status" value={checklistForm.status} options={checklistStatuses.map((x) => ({ value: x, label: x }))} onChange={(v) => setChecklistForm({ ...checklistForm, status: v })} />
        </FormGrid>
        <Textarea label="Checklist item, satu baris satu task" rows={6} value={checklistForm.itemsText} onChange={(v) => setChecklistForm({ ...checklistForm, itemsText: v })} />
        <SubmitButton saving={saving} onClick={saveChecklist}>Buat Checklist</SubmitButton>
      </CrudModal>

      <CrudModal open={modal === 'supplier'} title={supplierForm.id ? 'Edit Supplier' : 'Tambah Supplier'} onClose={() => setModal('')}>
        <FormGrid>
          <TextInput label="Nama Supplier" value={supplierForm.supplierName} onChange={(v) => setSupplierForm({ ...supplierForm, supplierName: v })} />
          <TextInput label="Tipe" value={supplierForm.supplierType} onChange={(v) => setSupplierForm({ ...supplierForm, supplierType: v })} />
          <TextInput label="No Kontrak" value={supplierForm.contractNo} onChange={(v) => setSupplierForm({ ...supplierForm, contractNo: v })} />
          <TextInput label="Effective" type="date" value={supplierForm.effectiveDate} onChange={(v) => setSupplierForm({ ...supplierForm, effectiveDate: v })} />
          <TextInput label="Expiry" type="date" value={supplierForm.expiryDate} onChange={(v) => setSupplierForm({ ...supplierForm, expiryDate: v })} />
          <TextInput label="Allotment" type="number" value={supplierForm.allotmentTotal} onChange={(v) => setSupplierForm({ ...supplierForm, allotmentTotal: v })} />
          <TextInput label="Unit Cost" type="number" value={supplierForm.unitCost} onChange={(v) => setSupplierForm({ ...supplierForm, unitCost: v })} />
          <TextInput label="Status" value={supplierForm.status} onChange={(v) => setSupplierForm({ ...supplierForm, status: v })} />
        </FormGrid>
        <Textarea label="Catatan" value={supplierForm.notes} onChange={(v) => setSupplierForm({ ...supplierForm, notes: v })} />
        <SubmitButton saving={saving} onClick={saveSupplier}>Simpan Supplier</SubmitButton>
      </CrudModal>

      <CrudModal open={modal === 'guide'} title="💡 Panduan & Kegunaan Commerce Ops" onClose={() => setModal('')}>
        <div className="space-y-4 text-xs text-zinc-800 leading-relaxed">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-900">
            <h4 className="font-extrabold text-sm mb-1">Pusat Komando Commerce Ops</h4>
            <p>
              Commerce Ops adalah pusat operasional terpadu Alfian Tour yang menghubungkan siklus penjualan (leads), negosiasi (proposal), program rujukan (affiliate), persiapan operasional (checklist), hingga ketersediaan aset vendor (supplier).
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="border rounded-2xl p-3.5 bg-zinc-50/50 space-y-2">
              <h5 className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="text-base">👤</span>
                <span>Manajemen Leads (CRM)</span>
              </h5>
              <p className="text-[11px] text-zinc-500">
                Grup kerja untuk menangkap calon jamaah baru dari form manual, pendaftaran affiliate, maupun kuesioner. Memungkinkan tim sales memantau status prospek secara berkala dan menjadwalkan tanggal hubung ulang (Follow-Up).
              </p>
            </div>

            <div className="border rounded-2xl p-3.5 bg-zinc-50/50 space-y-2">
              <h5 className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="text-base">📄</span>
                <span>Proposal & Custom Quotation</span>
              </h5>
              <p className="text-[11px] text-zinc-500">
                Penyusunan rencana perjalanan khusus (*itinerary*), fasilitas *include/exclude*, serta penawaran harga custom. Nilai proposal dihitung otomatis berdasarkan baris item berformat khusus (`Nama Item|Jumlah|Unit|Harga`).
              </p>
            </div>

            <div className="border rounded-2xl p-3.5 bg-zinc-50/50 space-y-2">
              <h5 className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="text-base">📋</span>
                <span>Checklist Operasional</span>
              </h5>
              <p className="text-[11px] text-zinc-500">
                Alat koordinasi tim operasional keberangkatan. Setiap checklist memuat sub-tugas (seperti pengumpulan paspor, penerbitan visa, katering, handling bandara) yang persentase penyelesaiannya dilacak secara otomatis.
              </p>
            </div>

            <div className="border rounded-2xl p-3.5 bg-zinc-50/50 space-y-2">
              <h5 className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="text-base">🤝</span>
                <span>Atribusi Affiliate (Kemitraan)</span>
              </h5>
              <p className="text-[11px] text-zinc-500">
                Melacak agen rujukan yang mendaftarkan calon jamaah lewat tautan personal mereka. Memastikan pencatatan komisi referral bagi agen freelance aman, transparan, dan terhindar dari tumpang tindih kepemilikan data.
              </p>
            </div>

            <div className="border rounded-2xl p-3.5 bg-zinc-50/50 space-y-2 md:col-span-2">
              <h5 className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="text-base">🏨</span>
                <span>Kontrak Supplier (Manajemen Aset)</span>
              </h5>
              <p className="text-[11px] text-zinc-500">
                Mengontrol masa berlaku kontrak hotel (Makkah/Madinah), ketersediaan kursi pesawat, dan unit kendaraan. Melacak kuota allotment (jatah terpakai vs total) untuk mencegah pemesanan ganda serta menjaga profitabilitas margin tur.
              </p>
            </div>
          </div>

          <div className="p-3 border rounded-xl bg-amber-50 border-amber-100 text-amber-800 text-[11px]">
            <strong>Tips Presentasi Tim:</strong> Jelaskan kepada tim sales untuk rajin memperbarui status leads ke Qualified/Won agar estimasi nominal pipeline di dashboard bagian atas terhitung secara akurat.
          </div>
        </div>
      </CrudModal>
    </div>
  );
}

function asArray(res: any): any[] {
  const data = res?.data ?? res;
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
}

function money(v: any) {
  const n = Number(v || 0);
  if (!n) return 'Rp0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(v: any) {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInput(v: any) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function toIsoOrNull(v: any) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function Metric({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-2 text-2xl font-black text-zinc-950">{value}</p><p className="mt-1 text-xs text-stone-500">{hint}</p></div>;
}

function Spinner() {
  return <div className="mt-6 grid min-h-[260px] place-items-center rounded-[2rem] border border-stone-200 bg-white"><div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-zinc-950" /></div>;
}

function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">{children}</div>;
}

function DataCard({ title, subtitle, badge, children }: { title: string; subtitle: string; badge?: string; children: ReactNode }) {
  return <article className="rounded-[1.6rem] border border-stone-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-black text-zinc-950">{title}</h3><p className="mt-1 line-clamp-2 text-xs text-stone-500">{subtitle}</p></div>{badge ? <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-black text-zinc-700">{badge}</span> : null}</div><div className="mt-3 space-y-1">{children}</div></article>;
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex justify-between gap-3 text-xs"><span className="text-stone-500">{label}</span><span className="text-right font-bold text-zinc-800">{value}</span></div>;
}

function SmallButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-bold text-zinc-700 hover:border-zinc-900 hover:bg-zinc-950 hover:text-white">{children}</button>;
}

function CrudModal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return <ModalShell open={open} onBackdropClick={onClose} contentWrapperClassName="relative h-full w-full flex items-center justify-center p-3 pointer-events-none"><div className="pointer-events-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-5 py-4"><h3 className="text-sm font-black">{title}</h3><button onClick={onClose} className="rounded-full border px-3 py-1 text-xs font-bold">Tutup</button></div><div className="space-y-4 p-5">{children}</div></div></ModalShell>;
}

function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}

function TextInput({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return <label className="space-y-1 text-xs font-bold text-zinc-700"><span>{label}</span><input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-stone-200 px-3 text-sm font-medium outline-none focus:border-zinc-900" /></label>;
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void }) {
  return <label className="space-y-1 text-xs font-bold text-zinc-700"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-stone-200 px-3 text-sm font-medium outline-none focus:border-zinc-900">{options.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>;
}

function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: any; onChange: (v: string) => void; rows?: number }) {
  return <label className="block space-y-1 text-xs font-bold text-zinc-700"><span>{label}</span><textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900" /></label>;
}

function SubmitButton({ saving, onClick, children }: { saving: boolean; onClick: () => void; children: ReactNode }) {
  return <button disabled={saving} onClick={onClick} className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{saving ? 'Menyimpan...' : children}</button>;
}
