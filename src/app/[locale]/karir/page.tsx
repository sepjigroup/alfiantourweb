import { Link } from "@/i18n/routing-patch";
import { BackButton } from "@/components/BackButton";
import { fetchPublicCareers, toCareerAssetUrl } from "@/lib/careers-api";
import { getLocalizedAlternates } from "@/lib/seo";
import { ImageWithFallback } from "@/components/ImageWithFallback";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title: "Karir Alfian Tour",
    description: "Lowongan kerja resmi Alfian Tour untuk tim operasional, marketing, dan layanan jamaah.",
    alternates: getLocalizedAlternates(locale, "/karir"),
  };
}

export default async function CareersPage() {
  let rows: Awaited<ReturnType<typeof fetchPublicCareers>>["items"] = [];
  try {
    const data = await fetchPublicCareers(1, 50);
    rows = data.items ?? [];
  } catch {
    rows = [];
  }

  return (
    <div className="p-4 space-y-4 animate-fade-up">
      <div className="flex items-center gap-3 pt-2">
        <BackButton />
        <h1 className="text-lg font-extrabold">Karir Alfian Tour</h1>
      </div>
      <p className="text-xs text-zinc-500">
        Bergabung dengan tim Alfian Tour untuk melayani perjalanan ibadah dengan profesional, hangat, dan bertanggung jawab.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
          Belum ada lowongan aktif saat ini. Silakan cek kembali secara berkala.
        </div>
      ) : null}

      <div className="space-y-3">
        {rows.map((job) => {
          const image = toCareerAssetUrl(job.coverImageUrl);
          return (
            <article key={job.id} className="overflow-hidden rounded-2xl border bg-white">
              <Link href={`/karir/${job.slug || job.id}`} className="block sm:flex">
                {image ? (
                  <div className="sm:w-44 sm:flex-shrink-0">
                    <ImageWithFallback src={image} alt={job.title} className="h-40 w-full object-cover sm:h-full" />
                  </div>
                ) : null}
                <div className="p-4 space-y-2 flex-1">
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-zinc-600">
                    {job.department ? <span className="rounded-full bg-zinc-100 px-2 py-1">{job.department}</span> : null}
                    {job.employmentType ? <span className="rounded-full bg-zinc-100 px-2 py-1">{job.employmentType}</span> : null}
                    {job.workMode ? <span className="rounded-full bg-zinc-100 px-2 py-1">{job.workMode}</span> : null}
                  </div>
                  <h2 className="text-sm font-extrabold leading-snug">{job.title}</h2>
                  <p className="text-xs text-zinc-500">
                    {[job.location, job.salaryRange].filter(Boolean).join(" • ") || "Detail tersedia di halaman lowongan."}
                  </p>
                  {job.summary ? <p className="text-xs text-zinc-600 line-clamp-3">{job.summary}</p> : null}
                  <div className="pt-1 text-xs font-semibold text-primary-700">Lihat detail ›</div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
