'use client';

import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useRouter } from '@/i18n/routing-patch';
import { useAuth } from '@/lib/auth';
import { FEED_LIKERS, type FeedLocale } from '@/lib/feeds';
import { API_BASE_URL } from '@/lib/api-client';
import { createPublicFeedComment, deleteAdminFeedComment, fetchPublicFeedComments, fetchPublicFeedDetail, fetchPublicFeeds, type FeedCommentItem, type FeedPostItem } from '@/lib/feeds-api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { ModalShell } from '@/components/ui/ModalShell';

type InternalLinkTarget = { keyword: string; href: string };

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const LOCAL_FEED_IMAGES = [
  '/newlogo2.png',
  '/android-chrome-512x512.png',
  '/android-chrome-192x192.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
];

function sanitizeFeedHtml(raw: string): string {
  return String(raw || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

function buildTitlePlaceholder(title: string): string {
  const safeTitle = String(title || 'Feed Alfian Tour').slice(0, 64).replace(/</g, '').replace(/>/g, '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='#f4f4f5'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='34' fill='#3f3f46'>${safeTitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeRegExp(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function autoLinkContent(rawHtml: string, targets: InternalLinkTarget[]): string {
  if (!rawHtml || targets.length === 0 || typeof window === 'undefined') return rawHtml;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="root">${rawHtml}</div>`, 'text/html');
  const root = doc.getElementById('root');
  if (!root) return rawHtml;

  const used = new Set<string>();
  let inserted = 0;
  const MAX_LINKS = 8;
  const sorted = [...targets]
    .filter((x) => x.keyword.trim().length >= 4)
    .sort((a, b) => b.keyword.length - a.keyword.length);

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parentTag = node.parentElement?.tagName.toLowerCase();
    if (!parentTag || ['a', 'script', 'style', 'code', 'pre', 'h1', 'h2', 'h3'].includes(parentTag)) continue;
    textNodes.push(node);
  }

  for (const node of textNodes) {
    if (inserted >= MAX_LINKS) break;
    const text = node.nodeValue || '';
    if (!text.trim()) continue;

    for (const target of sorted) {
      if (inserted >= MAX_LINKS) break;
      const key = target.keyword.toLowerCase();
      if (used.has(key)) continue;
      const rx = new RegExp(`\\b(${escapeRegExp(target.keyword)})\\b`, 'i');
      const m = rx.exec(text);
      if (!m) continue;

      const before = text.slice(0, m.index);
      const match = m[0];
      const after = text.slice(m.index + match.length);

      const frag = doc.createDocumentFragment();
      if (before) frag.appendChild(doc.createTextNode(before));
      const a = doc.createElement('a');
      a.href = target.href;
      a.textContent = match;
      a.setAttribute('class', 'text-blue-600 underline decoration-blue-300 hover:text-blue-700');
      frag.appendChild(a);
      if (after) frag.appendChild(doc.createTextNode(after));

      node.parentNode?.replaceChild(frag, node);
      used.add(key);
      inserted += 1;
      break;
    }
  }

  return root.innerHTML;
}

export default function FeedDetailPage() {
  const { show } = useToast();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale() as FeedLocale;
  const { isLoggedIn, user, hasRole } = useAuth();
  const [liked, setLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentItems, setCommentItems] = useState<FeedCommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [feed, setFeed] = useState<FeedPostItem | null>(null);
  const [linkTargets, setLinkTargets] = useState<InternalLinkTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverSrc, setCoverSrc] = useState('');

  useEffect(() => {
    let active = true;
    fetchPublicFeedDetail(String(params.id))
      .then((x) => {
        if (!active) return;
        setFeed(x);
      })
      .catch(() => {
        if (!active) return;
        setFeed(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [feedsResp, programsRes] = await Promise.all([
          fetchPublicFeeds(1, 120, ''),
          fetch(`${API_BASE_URL}/api/v1/master/programs?page=1&pageSize=150&publicMode=true`, { cache: 'no-store' }),
        ]);
        const feedLinks: InternalLinkTarget[] = (feedsResp.items || [])
          .filter((x) => Number(x.id) !== Number(params.id) && (x.slug || x.id) && x.title)
          .map((x) => ({ keyword: String(x.title), href: `/${locale}/feeds/${x.slug || x.id}` }));
        let packageLinks: InternalLinkTarget[] = [];
        if (programsRes.ok) {
          const json = (await programsRes.json()) as { items?: Array<{ slug?: string; id?: number; title?: string; name?: string }> };
          packageLinks = (json.items || [])
            .filter((x) => (x.slug || x.id) && (x.title || x.name))
            .map((x) => ({ keyword: String(x.title || x.name), href: `/${locale}/pack/${x.slug || x.id}` }));
        }
        if (active) setLinkTargets([...feedLinks, ...packageLinks]);
      } catch {
        if (active) setLinkTargets([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [locale, params.id]);

  useEffect(() => {
    if (!feed) return;
    setCoverSrc(feed.coverImageUrl || LOCAL_FEED_IMAGES[Number(feed.id || 0) % LOCAL_FEED_IMAGES.length]);
    setCommentsCount(Number(feed.comments || 0));
  }, [feed]);

  const linkedContentHtml = useMemo(() => {
    return autoLinkContent(sanitizeFeedHtml(String(feed?.content || '')), linkTargets);
  }, [feed?.content, linkTargets]);

  useEffect(() => {
    if (!feed || typeof window === 'undefined') return;
    const id = window.setTimeout(() => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch {
        // ignore adsense push error
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [feed?.id]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen p-4 space-y-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
          Memuat feed...
        </div>
      </div>
    );
  }
  if (!feed) return notFound();
  const isSuperAdmin = hasRole('superadmin');

  const openComments = () => {
    setCommentsOpen((prev) => !prev);
    if (!isLoggedIn) {
      show('Silakan login terlebih dahulu untuk menulis komentar.');
    }
    setCommentsLoading(true);
    fetchPublicFeedComments(String(feed.id), 1, 20)
      .then((json) => {
        setCommentItems(Array.isArray(json.items) ? json.items : []);
      })
      .catch(() => {
        setCommentItems([]);
      })
      .finally(() => setCommentsLoading(false));
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!isLoggedIn) return;
    if (!text) return;
    if (text.length > 500) return;
    setCommentSubmitting(true);
    try {
      const row = await createPublicFeedComment(String(feed.id), {
        name: user?.name || user?.userName || 'Pengguna',
        email: user?.email || null,
        commentText: text,
      });
      setCommentItems((prev) => [
        {
          id: row.id ?? `new-${Date.now()}`,
          name: row.name || user?.name || 'Pengguna',
          text: row.text || text,
          createdAt: row.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);
      setCommentsCount((v) => v + 1);
      setCommentText('');
      show('Komentar berhasil dikirim');
    } catch (e) {
      show(e instanceof Error ? e.message : 'Gagal kirim komentar');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const formatCommentDateTime = (raw?: string | null) => {
    if (!raw) return '-';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${locale}/feeds/${feed.slug || feed.id}`
      : `https://alfiantour.com/${locale}/feeds/${feed.slug || feed.id}`;
  const shareTitle = feed.title || 'Feed Alfian Tour';
  const shareText = `${shareTitle}\n\nBaca selengkapnya di: ${shareUrl}`;

  const shareTargets = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      setShareCopied(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <article className="bg-white min-h-screen animate-fade-up">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-zinc-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/feeds')}
            className="w-8 h-8 rounded-full border flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold">{feed.title}</h1>
            <p className="text-[11px] text-zinc-500">{feed.publishedAt ? new Date(feed.publishedAt).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US') : '-'}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden border">
            <Image
              src={coverSrc || buildTitlePlaceholder(feed.title)}
              alt={feed.title}
              fill
              className="object-cover"
              onError={() => setCoverSrc(buildTitlePlaceholder(feed.title))}
              unoptimized
            />
          </div>

          <div className="rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
            {feed.excerpt || '-'}
          </div>

          <div
            className="prose prose-sm max-w-none prose-p:text-zinc-700 prose-p:leading-7 prose-headings:text-zinc-900 prose-a:text-blue-600"
            dangerouslySetInnerHTML={{ __html: linkedContentHtml }}
          />

          <div className="rounded-2xl border border-zinc-100 bg-white p-2 overflow-hidden">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', textAlign: 'center', width: '100%', minHeight: '120px', maxHeight: '120px' }}
              data-ad-client="ca-pub-7379695285237095"
              data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_BLOG_SLOT || '0000000000'}
              data-ad-format="horizontal"
              data-full-width-responsive="true"
            />
          </div>

          <div className="border rounded-2xl p-3 bg-white">
            <div className="flex items-center justify-around">
              <button
                onClick={() => {
                  if (isLoggedIn) {
                    setLiked((prev) => !prev);
                    return;
                  }
                  setLikersOpen(true);
                }}
                className={cn("flex items-center gap-1.5 text-xs", liked ? "text-rose-500" : "text-zinc-500")}
              >
                <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                {Number(feed.likes || 0) + (liked ? 1 : 0)}
              </button>
              <button onClick={openComments} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <MessageCircle className="w-4 h-4" />
                {commentsCount}
              </button>
              <button onClick={() => setShareOpen(true)} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Share2 className="w-4 h-4" />
                {Number(feed.shares || 0)}
              </button>
            </div>
          </div>

          {commentsOpen ? (
            <div className="border rounded-2xl p-3 bg-white space-y-3">
              <h3 className="text-sm font-bold">Komentar</h3>
              {isLoggedIn ? (
                <div className="space-y-2">
                  <textarea
                    placeholder="Tulis komentar..."
                    maxLength={500}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
                    className="w-full border rounded-xl px-3 py-2 text-xs min-h-20"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-zinc-500">{commentText.length}/500</div>
                    <button
                      type="button"
                      disabled={commentSubmitting || commentText.trim().length === 0 || commentText.trim().length > 500}
                      onClick={() => void submitComment()}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      {commentSubmitting ? 'Mengirim...' : 'Kirim Komentar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500">Login untuk menulis komentar.</div>
              )}
              {commentsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl shimmer-bg" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {commentItems.length === 0 ? (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                      Komentar publik belum tersedia.
                    </div>
                  ) : commentItems.map((c, i) => (
                    <div key={`${c.id ?? i}`} className="rounded-xl bg-zinc-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold">{String(c.name ?? 'Pengguna')}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-[10px] text-zinc-500">{formatCommentDateTime(c.createdAt)}</div>
                          {isSuperAdmin ? (
                            <button
                              type="button"
                              className="text-[10px] text-red-600 underline underline-offset-2"
                              onClick={() => setDeleteCommentId(Number(c.id))}
                            >
                              Hapus
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-600 mt-1">{String(c.text ?? '-')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </article>

      <ModalShell
        open={shareOpen}
        onBackdropClick={() => setShareOpen(false)}
        zIndexClass="z-[140]"
        overlayClassName="bg-black/40"
        contentWrapperClassName="relative h-full w-full flex items-center justify-center p-4 pointer-events-none"
      >
          <div className="w-full max-w-[430px] bg-white rounded-3xl p-4 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-center">Bagikan Feed</h3>
            <textarea
              readOnly
              value={shareText}
              className="w-full min-h-24 border rounded-2xl px-3 py-2 text-xs text-zinc-700 bg-zinc-50"
            />
            <div className="flex items-center gap-2">
              <button onClick={copyShareText} className="flex-1 h-9 rounded-xl border text-xs font-semibold">
                {shareCopied ? 'Tersalin' : 'Copy Teks + Link'}
              </button>
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                <button
                  onClick={async () => {
                    try {
                      await navigator.share({ title: shareTitle, text: shareTitle, url: shareUrl });
                    } catch { }
                  }}
                  className="h-9 px-3 rounded-xl border text-xs font-semibold"
                >
                  Share
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {shareTargets.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 rounded-xl border text-xs font-medium hover:bg-zinc-50 inline-flex items-center justify-center"
                >
                  {s.label}
                </a>
              ))}
            </div>
            <div className="flex justify-center pt-1">
              <button onClick={() => setShareOpen(false)} className="text-[11px] text-zinc-500 underline underline-offset-2">
                Tutup
              </button>
            </div>
          </div>
      </ModalShell>

      {likersOpen && (
        <div className="absolute inset-0 z-[140] bg-black/40 flex items-center justify-center p-4" onClick={() => setLikersOpen(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-3xl p-4 max-h-[70dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-center">Disukai oleh</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-3">Login untuk memberikan like.</p>
            <div className="space-y-2">
              {FEED_LIKERS.map((name) => (
                <div key={name} className="rounded-xl border px-3 py-2 text-xs font-medium">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ModalShell
        open={deleteCommentId !== null}
        onBackdropClick={() => setDeleteCommentId(null)}
        zIndexClass="z-[150]"
        overlayClassName="bg-black/40"
      >
        <div className="bg-white w-full max-w-sm rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold">Konfirmasi Hapus Komentar</h3>
          <p className="text-xs text-zinc-600">Komentar ini akan dihapus langsung. Lanjutkan?</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="border rounded-lg px-3 py-1.5 text-xs" onClick={() => setDeleteCommentId(null)}>Batal</button>
            <button
              type="button"
              className="bg-red-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold"
              onClick={async () => {
                const cid = deleteCommentId;
                setDeleteCommentId(null);
                if (!cid) return;
                try {
                  await deleteAdminFeedComment(Number(feed.id), Number(cid));
                  setCommentItems((prev) => prev.filter((x) => Number(x.id) !== Number(cid)));
                  setCommentsCount((v) => Math.max(0, v - 1));
                  show('Komentar berhasil dihapus');
                } catch (e) {
                  show(e instanceof Error ? e.message : 'Gagal hapus komentar');
                }
              }}
            >
              Hapus
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
