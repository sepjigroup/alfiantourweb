import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer-bg rounded-2xl", className)} />;
}

export function PackCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function FeedCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-4 flex gap-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return <Skeleton className="h-48 w-full rounded-3xl" />;
}
