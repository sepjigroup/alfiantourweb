'use client';

type Props = {
  videoId: string;
  className?: string;
  autoplay?: boolean;
};

export function YouTubePlayer({ videoId, className, autoplay = false }: Props) {
  const src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=${autoplay ? 1 : 0}`;
  return (
    <div className={className ?? ''}>
      <div className="relative w-full overflow-hidden rounded-2xl bg-black" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={src}
          title="YouTube player"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
