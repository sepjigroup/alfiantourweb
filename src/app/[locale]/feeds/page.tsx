'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FEED_POSTS, type FeedLocale } from '@/lib/feeds';
import { FeedCard } from '@/components/FeedCard';
import { FeedCardSkeleton, Skeleton } from '@/components/Skeleton';
import { API_BASE_URL, apiGet } from '@/lib/api-client';
import { getAuthState } from '@/lib/auth';
import { usePathname, useRouter } from '@/i18n/routing-patch';
import type { PublicVideoItem } from '@/types/video';
import { fetchPublicVideos } from '@/lib/videos';
import { fetchPublicFeeds, type FeedPostItem } from '@/lib/feeds-api';
import { ModalShell } from '@/components/ui/ModalShell';

type MasonryItem = {
  id: string;
  image: string;
  blurDataUrl?: string;
  title: string;
  width: number;
  height: number;
  caption?: string;
};

type PositionedItem = MasonryItem & {
  x: number;
  y: number;
  w: number;
  h: number;
};
type PublicTestimoniItem = {
  id: number;
  reviewerName: string;
  rating: number;
  reviewText?: string;
  createdAt?: string;
};
const PLACEHOLDER_404 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='%23f4f4f5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='28' fill='%233f3f46'>404 - Alfian Tour</text></svg>";
const toPublicAssetUrl = (raw?: string | null): string => {
  const val = String(raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) return val;
  if (val.startsWith('file:///')) {
    const normalized = val.replace(/^file:\/\/+/, '/').replace(/\\/g, '/');
    return `${API_BASE_URL}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
  }
  return `${API_BASE_URL}${val.startsWith('/') ? '' : '/'}${val}`;
};

function isRecentUpload(uploadDate: string): boolean {
  const t = new Date(uploadDate).getTime();
  if (!Number.isFinite(t)) return false;
  const diffMs = Date.now() - t;
  return diffMs >= 0 && diffMs <= 3 * 24 * 60 * 60 * 1000;
}

function getImageRatioFromUrl(url: string): number {
  const m = url.match(/\/(\d+)\/(\d+)(?:\?|$)/);
  if (!m) return 4 / 3;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!w || !h) return 4 / 3;
  return w / h;
}

function toYouTubeWatchUrl(videoId?: string): string {
  const id = String(videoId || '').trim();
  return id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : 'https://www.youtube.com';
}

export default function FeedsPage() {
  const t = useTranslations('feeds');
  const locale = useLocale() as FeedLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'news' | 'testimoni' | 'gallery' | 'video'>('news');
  const [newsItems, setNewsItems] = useState<FeedPostItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [testimoniItems, setTestimoniItems] = useState<PublicTestimoniItem[]>([]);
  const [testimoniLoading, setTestimoniLoading] = useState(false);
  const [testimoniPage, setTestimoniPage] = useState(1);
  const [testimoniTotalPages, setTestimoniTotalPages] = useState(1);
  const [videoItems, setVideoItems] = useState<PublicVideoItem[]>([]);
  const [videoPage, setVideoPage] = useState(1);
  const [videoTotalPages, setVideoTotalPages] = useState(1);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryTotalPages, setGalleryTotalPages] = useState(1);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [galleryItemsApi, setGalleryItemsApi] = useState<MasonryItem[]>([]);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [allowAutoLoadMore, setAllowAutoLoadMore] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const requestedPagesRef = useRef<Set<number>>(new Set());
  const scrollRafRef = useRef<number | null>(null);
  const latestScrollYRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [viewportH, setViewportH] = useState(900);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (activeTab !== 'news') return;
    let active = true;
    setNewsLoading(true);
    fetchPublicFeeds(1, 20)
      .then((json) => {
        if (!active) return;
        setNewsItems(Array.isArray(json.items) ? json.items : []);
      })
      .catch(() => {
        if (!active) return;
        setNewsItems([]);
      })
      .finally(() => {
        if (active) setNewsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'testimoni') return;
    let active = true;
    setTestimoniLoading(true);
    apiGet<any>(`/api/BusinessInsights/pack/reviews?page=${testimoniPage}&pageSize=8`)
      .then((json) => {
        if (!active) return;
        setTestimoniItems(Array.isArray(json?.data?.items) ? json.data.items : []);
        setTestimoniTotalPages(Math.max(1, Number(json?.data?.totalPages ?? 1)));
      })
      .catch(() => {
        if (!active) return;
        setTestimoniItems([]);
      })
      .finally(() => {
        if (active) setTestimoniLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, testimoniPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'gallery' || tab === 'testimoni' || tab === 'video') setActiveTab(tab);
    else setActiveTab('news');
  }, []);

  useEffect(() => {
    if (activeTab !== 'video') return;
    if (videoPage > videoTotalPages) return;
    let active = true;
    setVideoError('');
    setVideoLoading(true);
    fetchPublicVideos(videoPage, 10)
      .then((json) => {
        if (!active) return;
        const incoming = json.items ?? [];
        setVideoItems((prev) => {
          if (videoPage === 1) return incoming;
          const existing = new Set(prev.map((x) => x.id));
          const merged = [...prev];
          for (const row of incoming) {
            if (!existing.has(row.id)) merged.push(row);
          }
          return merged;
        });
        setVideoTotalPages(json.totalPages || 1);
      })
      .catch(() => {
        if (!active) return;
        setVideoError('Video belum tersedia.');
      })
      .finally(() => {
        if (active) setVideoLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, videoPage, videoTotalPages]);

  useEffect(() => {
    if (activeTab !== 'video') return;
    const onScrollLoad = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 900;
      if (!nearBottom || videoLoading || videoPage >= videoTotalPages) return;
      setVideoPage((p) => p + 1);
    };
    window.addEventListener('scroll', onScrollLoad, { passive: true });
    return () => window.removeEventListener('scroll', onScrollLoad);
  }, [activeTab, videoLoading, videoPage, videoTotalPages]);

  useEffect(() => {
    setIsLoggedIn(!!getAuthState());
  }, []);

  useEffect(() => {
    const onScroll = () => {
      latestScrollYRef.current = window.scrollY;
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        setScrollY(latestScrollYRef.current);
        scrollRafRef.current = null;
      });
    };
    const onResize = () => setViewportH(window.innerHeight);
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'gallery') {
      setAllowAutoLoadMore(false);
      return;
    }
    const onScrollMark = () => {
      if (window.scrollY > 120) {
        setAllowAutoLoadMore(true);
        window.removeEventListener('scroll', onScrollMark);
      }
    };
    window.addEventListener('scroll', onScrollMark, { passive: true });
    return () => window.removeEventListener('scroll', onScrollMark);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'gallery') return;
    if (galleryItemsApi.length === 0 && galleryPage !== 1) setGalleryPage(1);
    if (galleryItemsApi.length === 0) requestedPagesRef.current.clear();
    if (requestedPagesRef.current.has(galleryPage)) return;
    if (galleryPage > galleryTotalPages) return;
    let active = true;
    requestedPagesRef.current.add(galleryPage);
    setGalleryLoading(true);
    setGalleryError('');
    fetch(`${API_BASE_URL}/api/gallery/public?page=${galleryPage}&pageSize=12`)
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        const rows = Array.isArray(json?.items) ? json.items : [];
        const mapped = rows.map((x: Record<string, unknown>) => ({
          id: String(x.id ?? ''),
          image: toPublicAssetUrl(String(x.imageUrl ?? '')),
          blurDataUrl: toPublicAssetUrl(String(x.blurDataUrl ?? '')),
          title: String(x.title ?? 'Gallery'),
          caption: String(x.caption ?? ''),
          width: Number(x.width ?? 400) || 400,
          height: Number(x.height ?? 300) || 300,
        }));
        setGalleryItemsApi((prev) => [...prev, ...mapped]);
        setGalleryTotalPages(Number(json?.totalPages ?? 1) || 1);
      })
      .catch(() => {
        if (!active) return;
        setGalleryError('Gallery API belum merespons, menampilkan fallback.');
      })
      .finally(() => {
        if (active) setGalleryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, galleryPage, galleryTotalPages]);

  useEffect(() => {
    if (activeTab !== 'gallery') return;
    // reset paginator state each time user re-enters gallery tab
    if (galleryPage !== 1) return;
    requestedPagesRef.current.clear();
  }, [activeTab, galleryPage]);

  useEffect(() => {
    if (activeTab !== 'gallery') return;
    const onScrollLoad = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 800;
      if (!allowAutoLoadMore || !nearBottom || galleryLoading || galleryPage >= galleryTotalPages) return;
      setGalleryPage((p) => p + 1);
    };
    window.addEventListener('scroll', onScrollLoad, { passive: true });
    return () => window.removeEventListener('scroll', onScrollLoad);
  }, [activeTab, allowAutoLoadMore, galleryLoading, galleryPage, galleryTotalPages]);

  useEffect(() => {
    if (activeTab !== 'gallery') return;
    if (!containerRef.current) return;
    const el = containerRef.current;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(w);
    });
    obs.observe(el);
    const measured = Math.round(el.getBoundingClientRect().width);
    if (measured > 0) setContainerWidth(measured);
    return () => obs.disconnect();
  }, [activeTab, galleryItemsApi.length]);

  const galleryItems = useMemo<MasonryItem[]>(() => {
    if (galleryItemsApi.length > 0) return galleryItemsApi;
    return Array.from({ length: 80 }, (_, i) => {
      const src = FEED_POSTS[i % FEED_POSTS.length];
      const ratio = getImageRatioFromUrl(src.image);
      const width = 400;
      const height = Math.round(width / ratio);
      return {
        id: `${src.id}-${i}`,
        image: src.image,
        title: src.title[locale],
        width,
        height,
      };
    });
  }, [galleryItemsApi, locale]);

  const masonry = useMemo(() => {
    const gap = 12;
    const columns = 3;
    const colW = containerWidth > 0 ? Math.floor((containerWidth - gap * (columns - 1)) / columns) : 160;
    const colHeights = new Array(columns).fill(0) as number[];
    const positioned: PositionedItem[] = [];

    for (const item of galleryItems) {
      const shortest = colHeights.indexOf(Math.min(...colHeights));
      const scaledH = Math.max(100, Math.round((item.height / item.width) * colW));
      const x = shortest * (colW + gap);
      const y = colHeights[shortest];
      positioned.push({ ...item, x, y, w: colW, h: scaledH });
      colHeights[shortest] += scaledH + gap;
    }

    const totalHeight = Math.max(0, ...colHeights) - gap;
    return { items: positioned, totalHeight, columns };
  }, [galleryItems, containerWidth]);

  const visibleItems = useMemo(() => {
    const top = Math.max(0, scrollY - 1200);
    const bottom = scrollY + viewportH + 1200;
    const sectionTop = containerRef.current?.getBoundingClientRect().top ?? 0;
    const pageTop = sectionTop + scrollY;
    return masonry.items.filter((it) => {
      const itemTop = pageTop + it.y;
      const itemBottom = itemTop + it.h;
      return itemBottom >= top && itemTop <= bottom;
    });
  }, [masonry.items, scrollY, viewportH]);

  const selectedGalleryItem = useMemo(() => {
    if (selectedGalleryIndex == null) return null;
    if (selectedGalleryIndex < 0 || selectedGalleryIndex >= galleryItems.length) return null;
    return galleryItems[selectedGalleryIndex];
  }, [galleryItems, selectedGalleryIndex]);

  return (
    <div className="bg-white min-h-screen animate-fade-up">
      <div className="p-4 border-b border-zinc-100">
        {isLoggedIn ? (
          <div className="mb-2 flex justify-end">
            <button
              onClick={() => router.push('/akun/kelola-feeds')}
              className="rounded-full border px-3 py-1 text-[11px] font-semibold"
            >
              Kelola Feeds
            </button>
          </div>
        ) : null}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => {
              setActiveTab('news');
              router.replace(pathname);
            }}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${activeTab === 'news' ? 'g-main text-white' : 'bg-zinc-100 text-zinc-600'}`}
          >
            Feeds
          </button>
          <button
            onClick={() => {
              setActiveTab('testimoni');
              setTestimoniPage(1);
              router.replace(`${pathname}?tab=testimoni`);
            }}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${activeTab === 'testimoni' ? 'g-main text-white' : 'bg-zinc-100 text-zinc-600'}`}
          >
            Testimoni
          </button>
          <button
            onClick={() => {
              setActiveTab('gallery');
              router.replace(`${pathname}?tab=gallery`);
            }}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${activeTab === 'gallery' ? 'g-main text-white' : 'bg-zinc-100 text-zinc-600'}`}
          >
            Gallery
          </button>
          <button
            onClick={() => {
              setActiveTab('video');
              setVideoItems([]);
              setVideoPage(1);
              setVideoTotalPages(1);
              router.replace(`${pathname}?tab=video`);
            }}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${activeTab === 'video' ? 'g-main text-white' : 'bg-zinc-100 text-zinc-600'}`}
          >
            Video
          </button>
        </div>
      </div>

      {activeTab === 'news' && (newsLoading
        ? [...Array(4)].map((_, i) => <FeedCardSkeleton key={i} />)
        : newsItems.length === 0 ? (
            <div className="p-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
                Belum ada feeds dipublikasikan saat ini.
              </div>
            </div>
          ) : newsItems.map((feed) => (
            <FeedCard
              key={feed.id}
              id={feed.id}
              slug={feed.slug}
              time={feed.publishedAt ? new Date(feed.publishedAt).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US') : '-'}
              title={feed.title}
              excerpt={feed.excerpt || '-'}
              image={feed.coverImageUrl || undefined}
              username={feed.authorName || 'Admin'}
              likes={Number(feed.likes || 0)}
              comments={Number(feed.comments || 0)}
              shares={Number(feed.shares || 0)}
            />
          )))}

      {activeTab === 'testimoni' && (
        <div className="p-4 space-y-3">
          {testimoniLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-2xl border bg-white p-4 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-full rounded-full" />
                  <Skeleton className="h-3 w-2/3 rounded-full" />
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
                Memuat testimoni...
              </div>
            </div>
          ) : null}
          {!testimoniLoading && testimoniItems.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
              Belum ada testimoni publik.
            </div>
          ) : null}
          {testimoniItems.map((row) => (
            <div key={row.id} className="rounded-2xl border bg-white p-4">
              <div className="text-sm font-semibold">⭐ {row.reviewerName || 'Pelanggan'}</div>
              <p className="text-xs text-zinc-600 mt-1">{row.reviewText || '-'}</p>
              <div className="text-[11px] text-zinc-400 mt-1">
                Rating: {row.rating}/5{row.createdAt ? ` • ${new Date(row.createdAt).toLocaleDateString('id-ID')}` : ''}
              </div>
            </div>
          ))}
          {!testimoniLoading && testimoniItems.length > 0 ? (
            <div className="flex items-center justify-between pt-1">
              <button
                className="border rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                disabled={testimoniPage <= 1}
                onClick={() => setTestimoniPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </button>
              <div className="text-[11px] text-zinc-500">Halaman {testimoniPage}/{testimoniTotalPages}</div>
              <button
                className="border rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                disabled={testimoniPage >= testimoniTotalPages}
                onClick={() => setTestimoniPage((p) => Math.min(testimoniTotalPages, p + 1))}
              >
                Berikutnya
              </button>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div />
            {isLoggedIn ? (
              <button onClick={() => router.push('/akun/kelola-gallery')} className="rounded-full border px-3 py-1 text-[11px] font-semibold">
                Kelola Gallery
              </button>
            ) : null}
          </div>
          <div ref={containerRef} className="relative w-full" style={{ height: masonry.totalHeight || 320 }}>
            {containerWidth === 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
              </div>
            ) : (
              visibleItems.map((item) => (
                <article
                  key={item.id}
                  className="absolute overflow-hidden rounded-2xl border bg-white"
                  style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
                >
                  {item.blurDataUrl ? (
                    <img
                      src={item.blurDataUrl}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 h-full w-full object-cover scale-110 blur-sm"
                    />
                  ) : null}
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full cursor-pointer object-cover transition-transform duration-300 hover:scale-[1.02]"
                    onClick={() => {
                      const idx = galleryItems.findIndex((x) => x.id === item.id);
                      if (idx >= 0) {
                        setSelectedGalleryIndex(idx);
                      }
                    }}
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.src !== PLACEHOLDER_404) el.src = PLACEHOLDER_404;
                    }}
                  />
                  {item.caption ? <div className="absolute bottom-0 left-0 right-0 bg-black/45 p-1 text-[10px] text-white line-clamp-2">{item.caption}</div> : null}
                </article>
              ))
            )}
          </div>
          {galleryLoading ? (
            <div className="pt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
              Memuat gallery...
            </div>
          ) : null}
          {!galleryLoading && galleryError ? <div className="pt-3 text-center text-xs text-amber-600">{galleryError}</div> : null}
          {!galleryLoading && !galleryError && galleryPage >= galleryTotalPages ? (
            <div className="pt-4 text-center text-[11px] text-zinc-400 animate-fade-up">Semua file gallery sudah dimuat.</div>
          ) : null}
        </div>
      )}

      {activeTab === 'video' && (
        <div className="p-4">
          <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
            Video terbaru dari tim kami akan tampil di sini. Jika masih kosong, admin sedang menyiapkan upload YouTube.
          </div>
          {videoLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(3)].map((_, i) => (
                <article key={i} className="overflow-hidden rounded-2xl bg-white">
                  <Skeleton className="h-52 w-full rounded-none" />
                  <div className="space-y-2 px-1 py-2">
                    <Skeleton className="h-3.5 w-[92%] rounded-md" />
                    <Skeleton className="h-3.5 w-[76%] rounded-md" />
                    <Skeleton className="h-3 w-[45%] rounded-md" />
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {!videoLoading && videoError ? <div className="text-xs text-amber-600">{videoError}</div> : null}
          {!videoLoading && !videoError ? (
            <div className="grid grid-cols-1 gap-4">
              {videoItems.map((video) => (
                <article key={video.id} className="overflow-hidden rounded-2xl bg-white">
                  <button type="button" className="block w-full text-left" onClick={() => router.push(`/video/${video.slug}`)}>
                    <div className="relative">
                      <img src={video.thumbnailUrl} alt={video.title} className="h-52 w-full object-cover" />
                      <div className="absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">YouTube</div>
                      {isRecentUpload(video.uploadDate) ? (
                        <div className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">Baru</div>
                      ) : null}
                    </div>
                    <div className="px-1 py-2">
                      <h3 className="text-[13px] font-semibold leading-snug line-clamp-2">{video.title}</h3>
                      <p className="mt-1 text-[11px] text-zinc-500 line-clamp-1">
                        Alfian Tour • {new Date(video.uploadDate).toLocaleDateString('id-ID')}
                      </p>
                      {video.description ? <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{video.description}</p> : null}
                    </div>
                  </button>
                  <div className="px-1 pb-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/video/${video.slug}`)}
                        className="h-8 rounded-xl border text-[11px] font-semibold bg-white"
                      >
                        Detail
                      </button>
                      <a
                        href={toYouTubeWatchUrl(video.youTubeVideoId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 rounded-xl border text-[11px] font-semibold bg-white inline-flex items-center justify-center"
                      >
                        YouTube
                      </a>
                      <button
                        type="button"
                        disabled
                        title="Download langsung tidak tersedia untuk sumber YouTube."
                        className="h-8 rounded-xl border text-[11px] font-semibold bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {!videoLoading && !videoError && videoItems.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              Belum ada video yang dipublikasikan. Silakan cek lagi nanti, atau hubungi admin untuk info jadwal upload terbaru.
            </div>
          ) : null}
          {!videoLoading && !videoError && videoPage >= videoTotalPages && videoItems.length > 0 ? (
            <div className="pt-4 text-center text-[11px] text-zinc-400">Semua video terbaru sudah dimuat.</div>
          ) : null}
        </div>
      )}

      <ModalShell
        open={Boolean(selectedGalleryItem && mounted)}
        onBackdropClick={() => setSelectedGalleryIndex(null)}
        zIndexClass="z-[1200]"
        overlayClassName="bg-black/60 backdrop-blur-[1px]"
        contentWrapperClassName="relative h-full w-full flex items-center justify-center p-4 pointer-events-none"
      >
        {selectedGalleryItem ? (
          <div
            ref={viewerRef}
            className="relative w-full max-w-[920px] rounded-3xl border border-white/20 bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-zinc-50">
                <div className="text-[11px] font-semibold text-zinc-700 line-clamp-1">{selectedGalleryItem.title}</div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title="Sebelumnya"
                    aria-label="Sebelumnya"
                    className="h-8 w-8 rounded-xl border text-sm font-semibold bg-white inline-flex items-center justify-center"
                    onClick={() => setSelectedGalleryIndex((selectedGalleryIndex! - 1 + galleryItems.length) % galleryItems.length)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    title="Berikutnya"
                    aria-label="Berikutnya"
                    className="h-8 w-8 rounded-xl border text-sm font-semibold bg-white inline-flex items-center justify-center"
                    onClick={() => setSelectedGalleryIndex((selectedGalleryIndex! + 1) % galleryItems.length)}
                  >
                    →
                  </button>
                  <button type="button" className="h-8 rounded-xl border px-2.5 text-[11px] font-semibold bg-white" onClick={() => setSelectedGalleryIndex(null)}>Tutup</button>
                </div>
              </div>
            <div className="bg-zinc-50">
              <img
                src={selectedGalleryItem.image}
                alt={selectedGalleryItem.title}
                className="w-full max-h-[78vh] object-contain"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.src !== PLACEHOLDER_404) el.src = PLACEHOLDER_404;
                }}
              />
            </div>
            {selectedGalleryItem.caption ? <div className="px-3 py-2 text-[11px] text-zinc-600 border-t bg-white">{selectedGalleryItem.caption}</div> : null}
          </div>
        ) : null}
      </ModalShell>

    </div>
  );
}
