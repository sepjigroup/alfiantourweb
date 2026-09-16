# alfiantourweb

Frontend web application for Alfian Tour built with Next.js 16 (React 19, TypeScript, Tailwind CSS, and `next-intl`).

## Persiapan & Menjalankan di Komputer Lain / Server

### 1. Prasyarat
- **Node.js**: versi 20.x atau 22.x LTS (disarankan >= 20.9.0)
- **npm**: versi 10.x atau lebih baru

### 2. Instalasi Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment (.env)
Pastikan file `.env.production` atau `.env.local` sudah ada:
```env
NEXT_PUBLIC_API_URL=https://api.alfiantour.com
NEXT_PUBLIC_SITE_URL=https://alfiantour.com
NEXT_PUBLIC_AMP_SITE_URL=https://alfiantour.com

NEXT_PUBLIC_SUPERADMIN_USERNAME=superadmin
NEXT_PUBLIC_SUPERADMIN_WHATSAPP=6285722022786
```

### 4. Menjalankan di Lingkungan Development
```bash
npm run dev
```
Buka browser di `http://localhost:3000` (atau port yang ditentukan).

### 5. Build dan Jalankan untuk Production
```bash
npm run build
npm start
```
Aplikasi production akan berjalan dan siap melayani permintaan.
