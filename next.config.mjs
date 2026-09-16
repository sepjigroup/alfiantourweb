import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    const reserved =
      "id|en|ar|api|_next|about|agen|akun|contact|feeds|information|layanan|owner-login|pack|testimoni|video|sitemap\\.xml|robots\\.txt|ads\\.txt|favicon\\.ico";
    return [
      {
        source: "/:locale(id|en|ar)/produk-lain",
        destination: "/:locale/toko",
        permanent: true,
      },
      {
        source: "/:locale(id|en|ar)/produk-lain/:path*",
        destination: "/:locale/toko/:path*",
        permanent: true,
      },
      {
        source: "/@:username([A-Za-z0-9_-]+)",
        destination: "/id/ref/:username",
        permanent: false,
      },
      {
        source: `/:username((?!${reserved}$)[A-Za-z0-9_-]+)`,
        destination: "/id/ref/:username",
        permanent: false,
      },
    ];
  },
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5054",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5054",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  compress: true,
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
