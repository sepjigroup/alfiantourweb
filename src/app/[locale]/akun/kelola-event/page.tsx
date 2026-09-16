"use client";

import { useEffect, useState, useMemo } from "react";
import { getAuthToken } from "@/lib/api-client";
import { getAuthState } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { ModalShell } from "@/components/ui/ModalShell";
import { InlineConfirmOverlay } from "@/components/ui/InlineConfirmOverlay";

type EventItem = {
  id: string;
  title: string;
  slug: string;
  imageUrlWebp: string | null;
  locationName: string;
  fullAddress: string | null;
  eventDate: string; // YYYY-MM-DD
  eventStartTime: string; // HH:mm:ss
  eventEndTime: string | null;
  scheduleEnd: string;
  validFrom: string;
  validTo: string;
  quota: number;
  viewCount: number;
  whatsAppAdminNumber: string | null;
  whatsAppDefaultMessage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  schemaJsonLd: string | null;
  metaPixelId: string | null;
  tikTokPixelId: string | null;
  registrationCount: number;
};

type RegistrantItem = {
  id: string;
  eventId: string;
  participantName: string;
  participantEmail: string;
  participantPhone: string;
  referredByUsername: string | null;
  registeredAt: string;
};

type EventFormState = {
  title: string;
  slug: string;
  descriptionHtml: string;
  imageFile: File | null;
  locationName: string;
  fullAddress: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  scheduleEnd: string;
  validFrom: string;
  validTo: string;
  quota: number;
  whatsAppAdminNumber: string;
  whatsAppDefaultMessage: string;
  seoTitle: string;
  seoDescription: string;
  schemaJsonLd: string;
  metaPixelId: string;
  tikTokPixelId: string;
};

const initialFormState: EventFormState = {
  title: "",
  slug: "",
  descriptionHtml: "",
  imageFile: null,
  locationName: "",
  fullAddress: "",
  eventDate: "",
  eventStartTime: "",
  eventEndTime: "",
  scheduleEnd: "",
  validFrom: "",
  validTo: "",
  quota: 0,
  whatsAppAdminNumber: "",
  whatsAppDefaultMessage: "",
  seoTitle: "",
  seoDescription: "",
  schemaJsonLd: "",
  metaPixelId: "",
  tikTokPixelId: "",
};

export default function KelolaEventPage() {
  const { show } = useToast();
  const auth = getAuthState();
  const userName = auth?.user?.userName || "";

  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // Form Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formState, setFormState] = useState<EventFormState>(initialFormState);

  // WYSIWYG Editor state
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");

  // AI Payload Parser state
  const [aiJson, setAiJson] = useState("");
  const [showAiImport, setShowAiImport] = useState(false);

  // Registrant Modal
  const [registrantsOpen, setRegistrantsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [registrants, setRegistrants] = useState<RegistrantItem[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regPage, setRegPage] = useState(1);
  const [regTotalPages, setRegTotalPages] = useState(1);
  const [regTotalCount, setRegTotalCount] = useState(0);

  // Delete Confirm State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadEvents = async (nextPage = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.append("pageNumber", String(nextPage));
      q.append("pageSize", String(pageSize));
      if (searchQuery) q.append("search", searchQuery);

      const res = await fetch(`${API_BASE_URL}/api/events?${q.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Gagal mengambil data event");
      const json = await res.json();
      if (json.isSuccess) {
        setItems(json.data || []);
        setPage(json.metadata?.page || nextPage);
        setTotalPages(json.metadata?.totalPages || 1);
        setTotalCount(json.metadata?.totalCount || 0);
      }
    } catch (err: any) {
      show(err.message || "Terjadi kesalahan saat memuat event");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents(1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadEvents(1, search);
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setFormState({
      ...initialFormState,
      validFrom: new Date().toISOString().substring(0, 16),
      validTo: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        .toISOString()
        .substring(0, 16),
      scheduleEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        .toISOString()
        .substring(0, 16),
    });
    setEditorTab("edit");
    setFormOpen(true);
  };

  const handleOpenEdit = (item: EventItem) => {
    setEditId(item.id);
    setFormState({
      title: item.title,
      slug: item.slug,
      descriptionHtml: "", // Will fetch details
      imageFile: null,
      locationName: item.locationName,
      fullAddress: item.fullAddress || "",
      eventDate: item.eventDate,
      eventStartTime: item.eventStartTime.substring(0, 5),
      eventEndTime: item.eventEndTime ? item.eventEndTime.substring(0, 5) : "",
      scheduleEnd: new Date(item.scheduleEnd).toISOString().substring(0, 16),
      validFrom: new Date(item.validFrom).toISOString().substring(0, 16),
      validTo: new Date(item.validTo).toISOString().substring(0, 16),
      quota: item.quota,
      whatsAppAdminNumber: item.whatsAppAdminNumber || "",
      whatsAppDefaultMessage: item.whatsAppDefaultMessage || "",
      seoTitle: item.seoTitle || "",
      seoDescription: item.seoDescription || "",
      schemaJsonLd: "", // Will fetch details
      metaPixelId: item.metaPixelId || "",
      tikTokPixelId: item.tikTokPixelId || "",
    });

    setEditorTab("edit");
    setBusy(true);
    fetch(`${API_BASE_URL}/api/events/${item.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (json.isSuccess && json.data) {
          setFormState((prev) => ({
            ...prev,
            descriptionHtml: json.data.descriptionHtml || "",
            schemaJsonLd: json.data.schemaJsonLd || "",
          }));
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));

    setFormOpen(true);
  };

  // WYSIWYG insert tag helper
  const insertHtml = (tagStart: string, tagEnd = "") => {
    const textarea = document.getElementById(
      "event-desc-textarea",
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = tagStart + selectedText + tagEnd;

    setFormState((prev) => ({
      ...prev,
      descriptionHtml:
        text.substring(0, start) + replacement + text.substring(end),
    }));

    // Refocus & reset selection range
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + tagStart.length,
        start + tagStart.length + selectedText.length,
      );
    }, 50);
  };

  // Generate URL Slug from Event Title
  const handleGenSlug = () => {
    if (!formState.title.trim()) {
      show("Silakan isi Judul Event terlebih dahulu");
      return;
    }
    const cleanSlug = formState.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormState((prev) => ({ ...prev, slug: cleanSlug }));
    show("Slug berhasil dibuat dari Judul");
  };

  // Generate SEO Title, SEO Description, and Schema.org Structured Data
  const handleGenSeoAndSchema = () => {
    if (!formState.title.trim()) {
      show("Silakan isi Judul Event terlebih dahulu");
      return;
    }

    const plainDesc = formState.descriptionHtml
      .replace(/<[^>]*>/g, "") // Strip HTML tags
      .substring(0, 150)
      .trim();

    const seoTitle = `${formState.title} - Alfian Tour`;
    const seoDescription =
      plainDesc || `Ikuti event ${formState.title} bersama Alfian Tour.`;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: formState.title,
      startDate: formState.eventDate
        ? `${formState.eventDate}T${formState.eventStartTime || "00:00"}`
        : undefined,
      endDate: formState.eventDate
        ? `${formState.eventDate}T${formState.eventEndTime || "23:59"}`
        : undefined,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: formState.locationName || "Lokasi Acara",
        address: {
          "@type": "PostalAddress",
          streetAddress: formState.fullAddress || "",
        },
      },
      description: seoDescription,
    };

    setFormState((prev) => ({
      ...prev,
      seoTitle,
      seoDescription,
      schemaJsonLd: JSON.stringify(schema, null, 2),
    }));
    show("SEO Title, Description, dan Schema.org berhasil dibuat otomatis!");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      show("Akses ditolak, silakan login kembali");
      return;
    }

    setBusy(true);
    const fd = new FormData();
    fd.append("title", formState.title);
    if (formState.slug) fd.append("slug", formState.slug);
    fd.append("descriptionHtml", formState.descriptionHtml);
    if (formState.imageFile) fd.append("imageFile", formState.imageFile);
    fd.append("locationName", formState.locationName);
    if (formState.fullAddress) fd.append("fullAddress", formState.fullAddress);
    fd.append("eventDate", formState.eventDate);
    fd.append("eventStartTime", formState.eventStartTime);
    if (formState.eventEndTime)
      fd.append("eventEndTime", formState.eventEndTime);
    fd.append("scheduleEnd", new Date(formState.scheduleEnd).toISOString());
    fd.append("validFrom", new Date(formState.validFrom).toISOString());
    fd.append("validTo", new Date(formState.validTo).toISOString());
    fd.append("quota", String(formState.quota));
    if (formState.whatsAppAdminNumber)
      fd.append("whatsAppAdminNumber", formState.whatsAppAdminNumber);
    if (formState.whatsAppDefaultMessage)
      fd.append("whatsAppDefaultMessage", formState.whatsAppDefaultMessage);
    if (formState.seoTitle) fd.append("seoTitle", formState.seoTitle);
    if (formState.seoDescription)
      fd.append("seoDescription", formState.seoDescription);
    if (formState.schemaJsonLd)
      fd.append("schemaJsonLd", formState.schemaJsonLd);
    if (formState.metaPixelId) fd.append("metaPixelId", formState.metaPixelId);
    if (formState.tikTokPixelId)
      fd.append("tikTokPixelId", formState.tikTokPixelId);

    try {
      const url = editId
        ? `${API_BASE_URL}/api/events/${editId}`
        : `${API_BASE_URL}/api/events`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan event");
      if (!json.isSuccess)
        throw new Error(
          json.message || "Gagal menyimpan event (validasi server)",
        );

      show(editId ? "Event berhasil diperbarui" : "Event berhasil dibuat");
      setFormOpen(false);
      void loadEvents(page);
    } catch (err: any) {
      show(err.message || "Gagal menyimpan data event");
    } finally {
      setBusy(false);
    }
  };

  const handleDirectSave = async () => {
    try {
      if (!aiJson.trim()) {
        show("Teks area JSON payload masih kosong!");
        return;
      }
      const parsed = JSON.parse(aiJson);
      if (!parsed.title) {
        show("Judul event wajib diisi di dalam JSON!");
        return;
      }

      const token = getAuthToken();
      if (!token) {
        show("Akses ditolak, silakan login kembali");
        return;
      }

      setBusy(true);
      const fd = new FormData();
      fd.append("title", parsed.title);

      const slugVal =
        parsed.slug ||
        parsed.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      fd.append("slug", slugVal);

      fd.append("descriptionHtml", parsed.descriptionHtml || "");
      fd.append("locationName", parsed.locationName || "");
      fd.append("fullAddress", parsed.fullAddress || "");
      fd.append(
        "eventDate",
        parsed.eventDate || new Date().toISOString().substring(0, 10),
      );
      fd.append("eventStartTime", parsed.eventStartTime || "08:00");
      if (parsed.eventEndTime) fd.append("eventEndTime", parsed.eventEndTime);

      const scheduleEndVal =
        parsed.scheduleEnd ||
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
      const validFromVal = parsed.validFrom || new Date().toISOString();
      const validToVal =
        parsed.validTo ||
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

      fd.append("scheduleEnd", new Date(scheduleEndVal).toISOString());
      fd.append("validFrom", new Date(validFromVal).toISOString());
      fd.append("validTo", new Date(validToVal).toISOString());
      fd.append(
        "quota",
        String(
          typeof parsed.quota === "number"
            ? parsed.quota
            : Number(parsed.quota) || 0,
        ),
      );

      if (parsed.whatsAppAdminNumber)
        fd.append("whatsAppAdminNumber", parsed.whatsAppAdminNumber);
      if (parsed.whatsAppDefaultMessage)
        fd.append("whatsAppDefaultMessage", parsed.whatsAppDefaultMessage);

      const seoTitleVal = parsed.seoTitle || `${parsed.title} - Alfian Tour`;
      const cleanDesc = (parsed.descriptionHtml || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 150)
        .trim();
      const seoDescriptionVal =
        parsed.seoDescription ||
        cleanDesc ||
        `Ikuti event ${parsed.title} bersama Alfian Tour.`;

      fd.append("seoTitle", seoTitleVal);
      fd.append("seoDescription", seoDescriptionVal);

      let schemaVal = "";
      if (parsed.schemaJsonLd) {
        schemaVal =
          typeof parsed.schemaJsonLd === "object"
            ? JSON.stringify(parsed.schemaJsonLd)
            : String(parsed.schemaJsonLd);
      } else {
        const schemaObj = {
          "@context": "https://schema.org",
          "@type": "Event",
          name: parsed.title,
          startDate: parsed.eventDate
            ? `${parsed.eventDate}T${parsed.eventStartTime || "08:00"}`
            : undefined,
          location: {
            "@type": "Place",
            name: parsed.locationName || "Lokasi Acara",
            address: {
              "@type": "PostalAddress",
              streetAddress: parsed.fullAddress || "",
            },
          },
          description: seoDescriptionVal,
        };
        schemaVal = JSON.stringify(schemaObj);
      }
      fd.append("schemaJsonLd", schemaVal);

      if (parsed.metaPixelId) fd.append("metaPixelId", parsed.metaPixelId);
      if (parsed.tikTokPixelId)
        fd.append("tikTokPixelId", parsed.tikTokPixelId);

      const url = editId
        ? `${API_BASE_URL}/api/events/${editId}`
        : `${API_BASE_URL}/api/events`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan event");
      if (!json.isSuccess)
        throw new Error(
          json.message || "Gagal menyimpan event (validasi server)",
        );

      show(
        editId
          ? "Event berhasil diperbarui langsung ke server!"
          : "Event baru berhasil dibuat langsung ke server!",
      );
      setFormOpen(false);
      void loadEvents(page);
    } catch (err: any) {
      show(err.message || "Gagal menyimpan data event langsung ke server");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus");
      show("Event berhasil dihapus");
      void loadEvents(1);
    } catch (err: any) {
      show(err.message || "Terjadi kesalahan saat menghapus");
    } finally {
      setBusy(false);
    }
  };

  // Load Registrants for an Event
  const loadRegistrants = async (event: EventItem, nextPage = 1) => {
    const token = getAuthToken();
    if (!token) return;
    setRegLoading(true);
    setSelectedEvent(event);
    setRegistrantsOpen(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/events/${event.id}/registrations?pageNumber=${nextPage}&pageSize=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (!res.ok) throw new Error("Gagal mengambil pendaftar");
      const json = await res.json();
      if (json.isSuccess) {
        setRegistrants(json.data || []);
        setRegPage(json.metadata?.page || nextPage);
        setRegTotalPages(json.metadata?.totalPages || 1);
        setRegTotalCount(json.metadata?.totalCount || 0);
      }
    } catch (err: any) {
      show(err.message || "Gagal memuat daftar pendaftar");
    } finally {
      setRegLoading(false);
    }
  };

  const handleShare = (item: EventItem) => {
    const locale =
      typeof window !== "undefined"
        ? window.location.pathname.split("/").filter(Boolean)[0] || "id"
        : "id";
    const link = `${window.location.origin}/${locale}/events/${item.slug}${userName ? `@${userName}` : ""}`;
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(link).then(() => {
        show("Link affiliate event disalin ke clipboard!");
      });
    }
  };

  return (
    <div className="p-4 space-y-5 animate-fade-up bg-zinc-50 text-zinc-900 min-h-screen">
      {/* Title Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-extrabold text-zinc-900">Kelola Event</h1>
          <p className="text-[10px] text-zinc-500 font-medium">
            Buat agenda promosi, manasik umroh, dan lacak pendaftar affiliate
            agensi.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary-600 text-white px-4 py-2.5 rounded-2xl text-xs font-black self-start sm:self-center transition-colors shadow-sm"
        >
          + Event Baru
        </button>
      </div>

      {/* SEARCH CARD */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Cari event berdasarkan judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button
            type="submit"
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            Cari
          </button>
        </form>
      </div>

      {/* EVENT LIST CARD */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-primary animate-spin" />
            <p className="text-[10px] text-zinc-400">Sedang memuat data...</p>
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-xs text-zinc-400 py-8 font-medium">
            Belum ada data event ditemukan.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {items.map((item) => {
              const seatsLeft = Math.max(
                0,
                item.quota - item.registrationCount,
              );
              const percentage =
                item.quota > 0
                  ? Math.min(100, (item.registrationCount / item.quota) * 100)
                  : 0;
              return (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900">
                        {item.title}
                      </h3>
                      <span className="text-[9px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-500 font-mono">
                        /{item.slug}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500 font-bold">
                      <span>
                        📅{" "}
                        {new Date(item.eventDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>📍 {item.locationName}</span>
                      <span>👁️ {item.viewCount} Views</span>
                    </div>

                    {/* Remaining seat progress bar */}
                    {item.quota > 0 ? (
                      <div className="max-w-xs space-y-1">
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${percentage > 85 ? "bg-red-500" : "bg-primary-650"}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-extrabold text-zinc-500">
                          <span>
                            Sisa: {seatsLeft} / {item.quota} Kursi
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block text-[9px] text-emerald-600 font-extrabold">
                        ✓ Kuota Tidak Terbatas
                      </span>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2 self-start md:self-center">
                    <button
                      onClick={() => handleShare(item)}
                      className="border border-zinc-200 hover:border-primary-300 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors bg-white text-zinc-700"
                    >
                      🔗 Share Link
                    </button>
                    <button
                      onClick={() => void loadRegistrants(item, 1)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors"
                    >
                      👥 Pendaftar ({item.registrationCount})
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="border border-zinc-200 hover:bg-zinc-50 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors bg-white text-zinc-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="border border-red-200 hover:bg-red-50 text-[10px] font-bold text-red-600 px-3 py-1.5 rounded-lg transition-colors bg-white"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
            <span className="text-[10px] text-zinc-500 font-bold">
              Total event: {totalCount}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => void loadEvents(page - 1, search)}
                className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-50 bg-white text-zinc-700"
              >
                Prev
              </button>
              <span className="text-[10px] text-zinc-500 font-bold self-center">
                Hal {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => void loadEvents(page + 1, search)}
                className="border border-zinc-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-50 bg-white text-zinc-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE & EDIT DIALOG */}
      <ModalShell
        open={formOpen}
        onBackdropClick={() => !busy && setFormOpen(false)}
      >
        <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-zinc-900">
          <div className="border-b pb-2">
            <h3 className="text-sm font-black text-zinc-900">
              {editId ? "Perbarui Data Event" : "Buat Event Baru"}
            </h3>
            <p className="text-[10px] text-zinc-500">
              Lengkapi formulir untuk menyebarluaskan agenda event Anda.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* AI JSON Payload Executor Section */}
            <div className="border border-indigo-150 bg-indigo-50/40 rounded-2xl p-4.5 space-y-3">
              <div
                className="flex justify-between items-center cursor-pointer select-none"
                onClick={() => setShowAiImport(!showAiImport)}
              >
                <span className="text-[10px] font-black uppercase text-indigo-700 flex items-center gap-1.5">
                  🤖 Impor Data Event dari AI (JSON Payload)
                </span>
                <span className="text-[10px] text-indigo-650 font-bold hover:underline">
                  {showAiImport ? "Sembunyikan Panel ✕" : "Buka Panel Impor ⚡"}
                </span>
              </div>

              {showAiImport && (
                <div className="space-y-3 animate-fade-up">
                  <p className="text-[10px] text-zinc-550 leading-relaxed">
                    Tempelkan data JSON mentah hasil dari AI (Gemini/ChatGPT)
                    untuk mengisi seluruh isian form secara otomatis.
                  </p>

                  <textarea
                    value={aiJson}
                    onChange={(e) => setAiJson(e.target.value)}
                    placeholder="Tempelkan JSON payload di sini..."
                    className="w-full h-28 border border-indigo-200 bg-white rounded-xl px-3 py-2 text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  />

                  <div className="flex justify-between items-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const sample = {
                          title: "Manasik Umroh Akbar Syawal",
                          slug: "manasik-umroh-syawal",
                          descriptionHtml:
                            "<b>Ikuti Manasik Umroh Akbar</b> bersama K.H. Ahmad. Acara ini gratis dan terbuka untuk umum.<br/><br/>Fasilitas:<br/>- Buku Panduan Manasik<br/>- Air Zam-zam & Snack",
                          locationName: "RM Ponyo Bandung",
                          fullAddress:
                            "Jl. Malabar No. 60, Bandung. https://maps.app.goo.gl/example",
                          eventDate: "2026-07-25",
                          eventStartTime: "08:00",
                          eventEndTime: "12:00",
                          quota: 150,
                          whatsAppAdminNumber: "6285220918819",
                          whatsAppDefaultMessage:
                            "Halo admin, saya ingin konfirmasi pendaftaran event Manasik Umroh Akbar.",
                          seoTitle: "Manasik Umroh Akbar Syawal - Alfian Tour",
                          seoDescription:
                            "Ikuti Manasik Umroh Akbar Syawal bersama Alfian Tour. Segera daftar sebelum kuota habis.",
                          metaPixelId: "123456789",
                          tikTokPixelId: "TT-123",
                        };
                        setAiJson(JSON.stringify(sample, null, 2));
                        show(
                          "Contoh format JSON berhasil dimuat ke dalam teks area!",
                        );
                      }}
                      className="text-[9px] font-black text-indigo-700 hover:underline flex items-center gap-1"
                    >
                      📋 Contoh Format JSON AI
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            if (!aiJson.trim()) {
                              show("Teks area JSON payload masih kosong!");
                              return;
                            }
                            const parsed = JSON.parse(aiJson);

                            setFormState((prev) => ({
                              ...prev,
                              title: parsed.title || prev.title,
                              slug:
                                parsed.slug ||
                                prev.slug ||
                                (parsed.title
                                  ? parsed.title
                                      .toLowerCase()
                                      .replace(/[^a-z0-9\s-]/g, "")
                                      .replace(/\s+/g, "-")
                                      .replace(/-+/g, "-")
                                      .trim()
                                  : ""),
                              descriptionHtml:
                                parsed.descriptionHtml || prev.descriptionHtml,
                              locationName:
                                parsed.locationName || prev.locationName,
                              fullAddress:
                                parsed.fullAddress || prev.fullAddress,
                              eventDate: parsed.eventDate || prev.eventDate,
                              eventStartTime:
                                parsed.eventStartTime || prev.eventStartTime,
                              eventEndTime:
                                parsed.eventEndTime || prev.eventEndTime || "",
                              quota:
                                typeof parsed.quota === "number"
                                  ? parsed.quota
                                  : Number(parsed.quota) || prev.quota,
                              whatsAppAdminNumber:
                                parsed.whatsAppAdminNumber ||
                                prev.whatsAppAdminNumber,
                              whatsAppDefaultMessage:
                                parsed.whatsAppDefaultMessage ||
                                prev.whatsAppDefaultMessage,
                              seoTitle: parsed.seoTitle || prev.seoTitle,
                              seoDescription:
                                parsed.seoDescription || prev.seoDescription,
                              schemaJsonLd: parsed.schemaJsonLd
                                ? typeof parsed.schemaJsonLd === "object"
                                  ? JSON.stringify(parsed.schemaJsonLd, null, 2)
                                  : String(parsed.schemaJsonLd)
                                : prev.schemaJsonLd,
                              metaPixelId:
                                parsed.metaPixelId || prev.metaPixelId,
                              tikTokPixelId:
                                parsed.tikTokPixelId || prev.tikTokPixelId,
                            }));

                            show(
                              "Isian form berhasil otomatis terisi dari Payload AI!",
                            );
                          } catch (err: any) {
                            show(
                              "Format JSON tidak valid! Periksa kembali kurung kurawal, tanda petik, atau koma.",
                            );
                          }
                        }}
                        className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[9px] shadow-sm transition-colors bg-indigo-600"
                      >
                        ⚡ Terapkan ke Form
                      </button>

                      <button
                        type="button"
                        onClick={handleDirectSave}
                        disabled={busy}
                        className="bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[9px] shadow-sm transition-colors bg-emerald-600 disabled:opacity-50"
                      >
                        💾 Simpan ke Server
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Judul Event
                </label>
                <input
                  required
                  value={formState.title}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Contoh: Manasik Umroh Akbar"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    SEO Custom Slug (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenSlug}
                    className="text-[9px] font-extrabold text-primary hover:underline"
                  >
                    ⚡ Auto-Gen Slug
                  </button>
                </div>
                <input
                  value={formState.slug}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="contoh: manasik-akbar"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* WYSIWYG editor wrapper */}
              <div className="space-y-1 md:col-span-2">
                <div className="flex justify-between items-center border-b pb-1 mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Deskripsi Event (HTML Composer)
                  </label>
                  <div className="flex bg-zinc-100 rounded-lg p-0.5 border border-zinc-250">
                    <button
                      type="button"
                      onClick={() => setEditorTab("edit")}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${editorTab === "edit" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                    >
                      ✏️ Edit HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab("preview")}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${editorTab === "preview" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                    >
                      👁️ Live Preview
                    </button>
                  </div>
                </div>

                {editorTab === "edit" ? (
                  <div className="space-y-1.5">
                    {/* HTML text formatter toolbar */}
                    <div className="flex flex-wrap gap-1 bg-zinc-50 p-1.5 rounded-xl border border-zinc-200">
                      <button
                        type="button"
                        onClick={() => insertHtml("<b>", "</b>")}
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] font-extrabold text-zinc-700"
                        title="Tebalkan Teks"
                      >
                        Bold
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtml("<i>", "</i>")}
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] italic text-zinc-700"
                        title="Teks Miring"
                      >
                        Italic
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtml("<u>", "</u>")}
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] underline text-zinc-700"
                        title="Garis Bawah"
                      >
                        Underline
                      </button>
                      <span className="w-px h-4 bg-zinc-200 self-center mx-1" />
                      <button
                        type="button"
                        onClick={() => insertHtml("<h2>", "</h2>")}
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] font-bold text-zinc-700"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtml("<h3>", "</h3>")}
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] font-bold text-zinc-700"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtml("<p>", "</p>")}
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] text-zinc-700"
                        title="Paragraph"
                      >
                        Paragraph
                      </button>
                      <span className="w-px h-4 bg-zinc-200 self-center mx-1" />
                      <button
                        type="button"
                        onClick={() =>
                          insertHtml(
                            '<a href="https://" target="_blank" class="text-primary hover:underline">',
                            "</a>",
                          )
                        }
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] text-zinc-700 font-medium"
                        title="Tambah Link"
                      >
                        🔗 Link
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertHtml(
                            '<img src="https://" alt="Gambar" class="w-full rounded-2xl my-3 object-cover aspect-[16/9]" />',
                          )
                        }
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] text-zinc-700 font-medium"
                        title="Tambah Gambar"
                      >
                        🖼️ Image
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertHtml(
                            "<ul>\n  <li>",
                            "</li>\n  <li></li>\n</ul>",
                          )
                        }
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] text-zinc-700"
                        title="Daftar Bullet"
                      >
                        List Bullet
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          insertHtml(
                            '<iframe src="https://" class="w-full aspect-video rounded-2xl my-3" frameborder="0" allowfullscreen></iframe>',
                          )
                        }
                        className="px-2 py-1 bg-white hover:bg-zinc-100 border border-zinc-250 rounded text-[9px] text-zinc-700"
                        title="Embed Video/Peta"
                      >
                        📺 Embed Video
                      </button>
                    </div>

                    <textarea
                      required
                      id="event-desc-textarea"
                      value={formState.descriptionHtml}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          descriptionHtml: e.target.value,
                        }))
                      }
                      placeholder="Tulis deskripsi event Anda menggunakan editor di atas, atau ketik langsung kode HTML."
                      className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs min-h-36 focus:ring-2 focus:ring-primary focus:outline-none font-mono leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="border border-zinc-200 rounded-xl p-4 bg-white min-h-[175px] max-h-[350px] overflow-y-auto">
                    <div
                      className="prose max-w-none text-xs leading-relaxed space-y-2"
                      dangerouslySetInnerHTML={{
                        __html:
                          formState.descriptionHtml ||
                          '<p class="text-zinc-400 italic">Belum ada deskripsi. Klik tab "Edit HTML" untuk menulis.</p>',
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Cover Gambar (WebP 80% auto-optimized)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      imageFile: e.target.files?.[0] ?? null,
                    }))
                  }
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-1.5 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-zinc-100 file:text-zinc-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Nama Tempat / Lokasi
                </label>
                <input
                  required
                  value={formState.locationName}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      locationName: e.target.value,
                    }))
                  }
                  placeholder="Contoh: RM PONYO"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Alamat Lengkap / Link Google Maps
                </label>
                <input
                  value={formState.fullAddress}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      fullAddress: e.target.value,
                    }))
                  }
                  placeholder="Contoh: Jl. Malabar No. 60 atau masukkan link google maps langsung"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Tanggal Acara
                </label>
                <input
                  type="date"
                  required
                  value={formState.eventDate}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      eventDate: e.target.value,
                    }))
                  }
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  required
                  value={formState.eventStartTime}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      eventStartTime: e.target.value,
                    }))
                  }
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Jam Selesai (Opsional)
                </label>
                <input
                  type="time"
                  value={formState.eventEndTime}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      eventEndTime: e.target.value,
                    }))
                  }
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Batas Akhir Pendaftaran
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formState.scheduleEnd}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      scheduleEnd: e.target.value,
                    }))
                  }
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Valid Mulai Publikasi
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formState.validFrom}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      validFrom: e.target.value,
                    }))
                  }
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Valid Akhir Publikasi
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formState.validTo}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      validTo: e.target.value,
                    }))
                  }
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Kuota Maksimal (0 = Bebas)
                </label>
                <input
                  type="number"
                  required
                  value={formState.quota}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      quota: Number(e.target.value),
                    }))
                  }
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Nomor WA Admin (CTA Konfirmasi)
                </label>
                <input
                  value={formState.whatsAppAdminNumber}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      whatsAppAdminNumber: e.target.value,
                    }))
                  }
                  placeholder="Contoh: 6285220918819"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  WhatsApp Template Message
                </label>
                <input
                  value={formState.whatsAppDefaultMessage}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      whatsAppDefaultMessage: e.target.value,
                    }))
                  }
                  placeholder="Template pesan otomatis konfirmasi pendaftaran"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* SEO & Schema section with auto generate */}
              <div className="md:col-span-2 pt-2 border-t border-zinc-200/50 mt-1">
                <button
                  type="button"
                  onClick={handleGenSeoAndSchema}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 font-black py-2 rounded-xl text-[10px] transition-colors flex items-center justify-center gap-1.5"
                >
                  ⚡ Auto-Generate SEO & Schema.org dari Data Event
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Seo Title
                </label>
                <input
                  value={formState.seoTitle}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      seoTitle: e.target.value,
                    }))
                  }
                  placeholder="SEO Judul Web Halaman Detail"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Seo Description
                </label>
                <input
                  value={formState.seoDescription}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      seoDescription: e.target.value,
                    }))
                  }
                  placeholder="SEO Deskripsi Web Halaman Detail"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Schema.org Structured Data (JSON-LD)
                </label>
                <textarea
                  value={formState.schemaJsonLd}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      schemaJsonLd: e.target.value,
                    }))
                  }
                  placeholder='{"@context": "https://schema.org", "@type": "Event", ...}'
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs min-h-24 focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Meta Pixel Id
                </label>
                <input
                  value={formState.metaPixelId}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      metaPixelId: e.target.value,
                    }))
                  }
                  placeholder="Facebook/Meta Pixel ID"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  TikTok Pixel Id
                </label>
                <input
                  value={formState.tikTokPixelId}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      tikTokPixelId: e.target.value,
                    }))
                  }
                  placeholder="TikTok Pixel ID"
                  className="w-full border border-zinc-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200">
              <button
                type="button"
                disabled={busy}
                onClick={() => setFormOpen(false)}
                className="border border-zinc-200 rounded-xl py-3 font-extrabold text-xs transition-colors bg-white text-zinc-700 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={busy}
                className="bg-primary hover:bg-primary-650 text-white rounded-xl py-3 font-extrabold text-xs transition-colors disabled:opacity-50"
              >
                {busy ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </ModalShell>

      {/* REGISTRANTS LIST DIALOG */}
      <ModalShell
        open={registrantsOpen}
        onBackdropClick={() => !regLoading && setRegistrantsOpen(false)}
      >
        <div className="w-full max-w-3xl bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-zinc-900">
          <div className="border-b pb-2">
            <h3 className="text-sm font-black text-zinc-900">
              Daftar Pendaftar Event
            </h3>
            <p className="text-[10px] text-zinc-500">
              Event:{" "}
              <span className="font-extrabold text-primary">
                {selectedEvent?.title}
              </span>
            </p>
          </div>

          {regLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-primary animate-spin" />
              <p className="text-[10px] text-zinc-400">Memuat pendaftar...</p>
            </div>
          ) : registrants.length === 0 ? (
            <p className="text-center text-xs text-zinc-400 py-8 font-medium">
              Belum ada peserta yang mendaftar.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700">
                    <tr className="font-extrabold text-[10px] uppercase">
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">Kontak Email & WA</th>
                      <th className="p-3">Referal Agen</th>
                      <th className="p-3">Tgl Registrasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {registrants.map((reg) => (
                      <tr key={reg.id} className="hover:bg-zinc-50/50">
                        <td className="p-3 font-semibold text-zinc-900">
                          {reg.participantName}
                        </td>
                        <td className="p-3 space-y-0.5">
                          <p className="text-zinc-600">
                            {reg.participantEmail}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            {reg.participantPhone}
                          </p>
                        </td>
                        <td className="p-3">
                          {reg.referredByUsername ? (
                            <span className="font-semibold text-primary">
                              @{reg.referredByUsername}
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-[10px] text-zinc-500">
                          {new Date(reg.registeredAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reg pagination */}
              {regTotalPages > 1 && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] text-zinc-500">
                    Total pendaftar: {regTotalCount}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={regPage <= 1}
                      onClick={() =>
                        selectedEvent &&
                        void loadRegistrants(selectedEvent, regPage - 1)
                      }
                      className="border border-zinc-200 rounded-lg px-2.5 py-1 text-[9px] font-bold disabled:opacity-50 bg-white text-zinc-700"
                    >
                      Prev
                    </button>
                    <span className="text-[10px] self-center">
                      Hal {regPage} / {regTotalPages}
                    </span>
                    <button
                      disabled={regPage >= regTotalPages}
                      onClick={() =>
                        selectedEvent &&
                        void loadRegistrants(selectedEvent, regPage + 1)
                      }
                      className="border border-zinc-200 rounded-lg px-2.5 py-1 text-[9px] font-bold disabled:opacity-50 bg-white text-zinc-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setRegistrantsOpen(false)}
              className="w-full bg-zinc-100 hover:bg-zinc-200 font-bold py-2.5 rounded-xl text-xs transition-colors text-zinc-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </ModalShell>

      {/* DELETE CONFIRM DIALOG */}
      <InlineConfirmOverlay
        open={deleteId !== null}
        title="Hapus Event"
        message="Apakah Anda yakin ingin menghapus event ini? Semua data pendaftar terkait akan dihapus secara permanen."
        cancelLabel="Batal"
        confirmLabel="Ya, Hapus"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          const id = deleteId;
          setDeleteId(null);
          if (id) {
            await doDelete(id);
          }
        }}
      />
    </div>
  );
}
