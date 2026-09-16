'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from '@/i18n/routing-patch';
import { useAuth } from '@/lib/auth';
import { FEED_LIKERS } from '@/lib/feeds';
import { fetchPublicFeedComments, type FeedCommentItem } from '@/lib/feeds-api';
import { ModalShell } from '@/components/ui/ModalShell';
import { useLocale } from 'next-intl';

interface FeedCardProps {
  id: number;
  slug?: string;
  time: string;
  title: string;
  excerpt: string;
  image?: string;
  avatar?: string;
  username?: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

export function FeedCard({ 
  id,
  slug,
  time, 
  title, 
  excerpt,
  image, 
  avatar = '/favicon-32x32.png',
  username = 'Alfian Sejahtera Abadi',
  likes = 0,
  comments = 0,
  shares = 0,
}: FeedCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const { isLoggedIn } = useAuth();
  const [isZoomed, setIsZoomed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentItems, setCommentItems] = useState<FeedCommentItem[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(image ?? '');
  const [imageVisible, setImageVisible] = useState(Boolean(image));
  const zoomImage = imageSrc;
  const useUnoptimizedImage =
    imageSrc.startsWith('http://localhost:') ||
    imageSrc.startsWith('http://127.0.0.1:') ||
    imageSrc.startsWith('https://localhost:') ||
    imageSrc.startsWith('https://127.0.0.1:');

  useEffect(() => {
    setImageSrc(image ?? '');
    setImageVisible(Boolean(image));
  }, [image]);

  const openComments = () => {
    setCommentsOpen(true);
    setCommentsLoading(true);
    fetchPublicFeedComments(String(id), 1, 20)
      .then((json) => {
        setCommentItems(Array.isArray(json.items) ? json.items : []);
      })
      .catch(() => {
        setCommentItems([]);
      })
      .finally(() => setCommentsLoading(false));
  };
  const feedPath = `/${locale}/feeds/${slug || id}`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${feedPath}` : feedPath;
  const shareText = `${title}\n${shareUrl}`;
  const openShare = (target: 'wa' | 'x' | 'fb' | 'copy') => {
    if (target === 'copy') {
      void navigator.clipboard.writeText(shareUrl);
      setShareOpen(false);
      return;
    }
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(title);
    const url = target === 'wa'
      ? `https://wa.me/?text=${encodeURIComponent(shareText)}`
      : target === 'x'
        ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        : `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setShareOpen(false);
  };

  return (
    <>
      <div
        className="bg-white border-b border-zinc-100 p-4 flex gap-3 hover:bg-zinc-50/50 transition-colors cursor-pointer active:bg-zinc-100"
        onClick={() => router.push(`/feeds/${slug || id}`)}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
            <Image src={avatar} alt="Feed Icon" width={26} height={26} className="object-contain" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[13px] font-bold text-zinc-900 truncate">
                {username}
              </span>
              <span className="text-[13px] text-zinc-400 flex-shrink-0">·</span>
              <span className="text-[13px] text-zinc-400 flex-shrink-0">
                {time}
              </span>
            </div>
            <button className="text-zinc-400 p-1 -mr-1 hover:text-zinc-600 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Text Content */}
          <p className="text-[14px] text-zinc-800 leading-normal font-medium">
            {title}
          </p>
          <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-2">
            {excerpt}
          </p>

          {/* Image */}
          {imageSrc && imageVisible ? (
            <div 
              className="relative mt-2 rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50 aspect-video group"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(true);
              }}
            >
              <Image
                src={imageSrc}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 640px"
                unoptimized={useUnoptimizedImage}
                onError={() => setImageSrc("https://placehold.co/600x400/BE40DD/FFFFFF.png?text=AlfianTour")}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex items-center justify-between max-w-[280px] mt-3 -ml-1 text-zinc-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isLoggedIn) {
                  setLiked((prev) => !prev);
                  return;
                }
                setLikersOpen(true);
              }}
              className={cn(
                "flex items-center gap-1.5 transition-colors group",
                liked ? "text-rose-500" : "hover:text-rose-500",
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-rose-50">
                <Heart size={18} className={liked ? "fill-current" : ""} />
              </div>
              <span className="text-xs">{likes + (liked ? 1 : 0)}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openComments();
              }}
              className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50">
                <MessageCircle size={18} />
              </div>
              <span className="text-xs">{comments}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen(true);
              }}
              className="flex items-center gap-1.5 hover:text-green-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-green-50">
                <Share2 size={18} />
              </div>
              <span className="text-xs">{shares}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Portal-like Modal */}
      <ModalShell open={Boolean(isZoomed && zoomImage)} onBackdropClick={() => setIsZoomed(false)} zIndexClass="z-[100]">
        <div className="bg-black/95 rounded-2xl p-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full bg-white/10 transition-colors"
            onClick={() => setIsZoomed(false)}
          >
            <X size={24} />
          </button>
          <div className="relative w-full max-w-4xl aspect-video lg:aspect-auto lg:h-[80vh]">
            <Image
              src={zoomImage}
              alt={title}
              fill
              className="object-contain"
              priority
              unoptimized={useUnoptimizedImage}
            />
          </div>
        </div>
      </ModalShell>

      <ModalShell open={commentsOpen} onBackdropClick={() => setCommentsOpen(false)} zIndexClass="z-[140]" overlayClassName="bg-black/40" contentWrapperClassName="relative h-full w-full flex items-center justify-center p-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-[430px] bg-white rounded-3xl p-4 max-h-[70dvh] overflow-y-auto animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold mb-3 text-center">Komentar</h3>
            {commentsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl shimmer-bg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {commentItems.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                    Komentar publik belum tersedia.
                  </div>
                ) : commentItems.map((c, i) => (
                  <div key={`${c.id ?? i}`} className="rounded-xl bg-zinc-50 p-3">
                    <div className="text-xs font-semibold">{String(c.name ?? 'Pengguna')}</div>
                    <div className="text-xs text-zinc-600 mt-1">{String(c.text ?? '-')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </ModalShell>

      <ModalShell open={shareOpen} onBackdropClick={() => setShareOpen(false)} zIndexClass="z-[140]" overlayClassName="bg-black/40" contentWrapperClassName="relative h-full w-full flex items-center justify-center p-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-[430px] bg-white rounded-3xl p-4 max-h-[70dvh] overflow-y-auto animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold mb-3 text-center">Bagikan</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => openShare('wa')} className="px-3 py-3 rounded-xl border text-xs font-medium hover:bg-zinc-50">WhatsApp</button>
              <button onClick={() => openShare('x')} className="px-3 py-3 rounded-xl border text-xs font-medium hover:bg-zinc-50">X / Twitter</button>
              <button onClick={() => openShare('fb')} className="px-3 py-3 rounded-xl border text-xs font-medium hover:bg-zinc-50">Facebook</button>
              <button onClick={() => openShare('copy')} className="px-3 py-3 rounded-xl border text-xs font-medium hover:bg-zinc-50">Copy Link</button>
            </div>
          </div>
      </ModalShell>

      <ModalShell open={likersOpen} onBackdropClick={() => setLikersOpen(false)} zIndexClass="z-[140]" overlayClassName="bg-black/40" contentWrapperClassName="relative h-full w-full flex items-center justify-center p-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-[430px] bg-white rounded-3xl p-4 max-h-[70dvh] overflow-y-auto animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
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
      </ModalShell>
    </>
  );
}
