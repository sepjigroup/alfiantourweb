export const SUPERADMIN_USERNAME = process.env.NEXT_PUBLIC_SUPERADMIN_USERNAME ?? 'superadmin';
export const SUPERADMIN_WHATSAPP = (process.env.NEXT_PUBLIC_SUPERADMIN_WHATSAPP ?? '6285722022786').replace(/\D/g, '');

export function buildSuperadminWaUrl(message?: string): string {
  const base = `https://wa.me/${SUPERADMIN_WHATSAPP}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

