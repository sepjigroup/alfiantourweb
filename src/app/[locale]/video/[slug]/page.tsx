'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing-patch';
import { fetchPublicVideoDetail, trackVideoView } from '@/lib/videos';
import type { PublicVideoDetailResponse } from '@/types/video';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { Skeleton } from '@/components/Skeleton';

export default function VideoDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const [data, setData] = useState<PublicVideoDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setError('');
    fetchPublicVideoDetail(slug)
      .then((res) => {
        if (!active) return;
        setData(res);
        void trackVideoView(slug);
      })
      .catch(() => {
        if (!active) return;
        setError('Video tidak ditemukan');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-up">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="h-4 w-4 rounded-full border-2 border-zinc-300 border-t-primary-600 animate-spin" />
          Memuat video...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-4 text-sm text-red-500">{error || 'Video tidak tersedia'}</div>;
  }

  const { video, related } = data;

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <Link href="/feeds?tab=video" className="inline-flex text-xs text-blue-600">← Kembali ke Feeds Video</Link>
      <YouTubePlayer videoId={video.youTubeVideoId} />
      <div>
        <h1 className="text-lg font-extrabold">{video.title}</h1>
        <p className="mt-2 text-sm text-zinc-600 whitespace-pre-wrap">{video.description || '-'}</p>
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-bold">Related Videos</h2>
        <div className="grid grid-cols-1 gap-3">
          {related.map((x) => (
            <Link key={x.id} href={`/video/${x.slug}`} className="rounded-2xl border bg-white overflow-hidden">
              <img src={x.thumbnailUrl} alt={x.title} className="h-32 w-full object-cover" />
              <div className="p-2 text-xs font-semibold line-clamp-2">{x.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
