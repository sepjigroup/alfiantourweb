import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toast";
import AppShell from "./AppShell";
import DesktopShell from "@/components/DesktopShell";
import { DeviceLayout } from "@/components/DeviceLayout";

export const metadata: Metadata = {
  title: {
    default: "Alfian Tour | PT. Alfian Sejahtera Abadi",
    template: "%s | PT. Alfian Sejahtera Abadi",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "id" | "en" | "ar")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ToastProvider>
        <DeviceLayout
          mobile={<AppShell locale={locale}>{children}</AppShell>}
          desktop={<DesktopShell locale={locale}>{children}</DesktopShell>}
        />
      </ToastProvider>
    </NextIntlClientProvider>
  );
}
