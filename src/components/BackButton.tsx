'use client';

import { useRouter } from '@/i18n/routing-patch';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="p-2 rounded-xl hover:bg-zinc-100 transition-colors"
      aria-label="Back"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
