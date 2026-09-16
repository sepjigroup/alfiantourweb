'use client';

import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className, 
  fallback = "https://placehold.co/600x400/e2e8f0/71717a?text=AlfianTour.com",
  ...props 
}: ImageWithFallbackProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      onError={(e) => {
        e.currentTarget.src = fallback;
      }}
      {...props}
    />
  );
}
