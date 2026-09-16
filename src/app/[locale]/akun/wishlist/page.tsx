import type { Metadata } from "next";
import WishlistClient from "./WishlistClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titleByLocale: Record<string, string> = {
    id: "Wishlist",
    en: "Wishlist",
    ar: "قائمة الرغبات",
  };

  return {
    title: titleByLocale[locale] ?? titleByLocale.id,
  };
}

export default function WishlistPage() {
  return <WishlistClient />;
}
