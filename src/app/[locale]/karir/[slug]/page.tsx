import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing-patch";
import { BackButton } from "@/components/BackButton";
import { fetchPublicCareerDetail, toCareerAssetUrl } from "@/lib/careers-api";
import { getLocalizedAlternates } from "@/lib/seo";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alfiantour.com';
  const canonicalUrl = `${siteUrl}/${locale}/karir/${slug}`;
  try {
    const job = await fetchPublicCareerDetail(slug);
    const title = `${job.title} | Karir Alfian Tour`;
    const description = job.summary || `Lowongan kerja resmi untuk posisi ${job.title} di Alfian Tour.`;
    const image = toCareerAssetUrl(job.coverImageUrl) || `${siteUrl}/newlogo2.png`;
    return {
      title,
      description,
      alternates: getLocalizedAlternates(locale, `/karir/${slug}`),
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Karir Alfian Tour',
        type: 'website',
        images: [{ url: image, width: 800, height: 600, alt: job.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    const title = "Karir Alfian Tour";
    const description = "Lowongan kerja resmi Alfian Tour.";
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${siteUrl}/${locale}/karir/${slug}`,
        siteName: 'Karir Alfian Tour',
      },
    };
  }
}

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  let job: Awaited<ReturnType<typeof fetchPublicCareerDetail>>;
  try {
    job = await fetchPublicCareerDetail(slug);
  } catch {
    notFound();
  }

  const image = toCareerAssetUrl(job.coverImageUrl);
  const isExternalApply = !!(job.applyUrl && (job.applyUrl.startsWith("http://") || job.applyUrl.startsWith("https://")));
  const applyHref = isExternalApply ? (job.applyUrl as string) : `/${locale}/karir/${slug}/apply`;

  // Structured Data (JSON-LD) for JobPosting
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alfiantour.com';
  const jobLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    'title': job.title,
    'description': `${job.summary || ''}\n\n${job.description || ''}\n\nKualifikasi:\n${job.requirements || ''}\n\nTanggung Jawab:\n${job.responsibilities || ''}`.trim(),
    'datePosted': job.publishedAt ? new Date(job.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    'validThrough': job.expiredAt ? new Date(job.expiredAt).toISOString().split('T')[0] : undefined,
    'employmentType': job.employmentType || 'FULL_TIME',
    'hiringOrganization': {
      '@type': 'Organization',
      'name': 'Alfian Tour',
      'sameAs': siteUrl,
      'logo': `${siteUrl}/newlogo2.png`
    },
    'jobLocation': {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': job.location || 'Indonesia',
        'addressCountry': 'ID'
      }
    },
    'baseSalary': job.salaryRange ? {
      '@type': 'MonetaryAmount',
      'currency': 'IDR',
      'value': {
        '@type': 'QuantitativeValue',
        'value': job.salaryRange,
        'unitText': 'MONTH'
      }
    } : undefined
  };

  return (
    <>
      {/* JSON-LD structured data for Google Job Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobLd) }}
      />

      <div className="p-4 space-y-4 animate-fade-up">
        <div className="flex items-center gap-3 pt-2">
          <BackButton />
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold leading-tight">{job.title}</h1>
            <p className="text-xs text-zinc-500">{[job.department, job.location].filter(Boolean).join(" • ")}</p>
          </div>
        </div>

        {image ? <ImageWithFallback src={image} alt={job.title} className="h-52 w-full rounded-2xl border object-cover" /> : null}

        <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-zinc-600">
          {job.employmentType ? <span className="rounded-full bg-zinc-100 px-2 py-1">{job.employmentType}</span> : null}
          {job.workMode ? <span className="rounded-full bg-zinc-100 px-2 py-1">{job.workMode}</span> : null}
          {job.salaryRange ? <span className="rounded-full bg-zinc-100 px-2 py-1">{job.salaryRange}</span> : null}
        </div>

        {job.summary ? <p className="rounded-2xl border bg-white p-4 text-sm text-zinc-700">{job.summary}</p> : null}

        <CareerSection title="Deskripsi" body={job.description} />
        <CareerSection title="Tanggung Jawab" body={job.responsibilities} />
        <CareerSection title="Kualifikasi" body={job.requirements} />
        <CareerSection title="Benefit" body={job.benefits} />

        {applyHref ? (
          isExternalApply ? (
            <a
              href={applyHref}
              target="_blank"
              rel="noreferrer"
              className="sticky bottom-20 xl:bottom-4 block rounded-2xl bg-primary-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg"
            >
              Lamar Sekarang
            </a>
          ) : (
            <Link
              href={applyHref}
              className="sticky bottom-20 xl:bottom-4 block rounded-2xl bg-primary-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg"
            >
              Lamar Sekarang
            </Link>
          )
        ) : null}
      </div>
    </>
  );
}

function CareerSection({ title, body }: { title: string; body?: string | null }) {
  if (!String(body ?? "").trim()) return null;
  return (
    <section className="rounded-2xl border bg-white p-4">
      <h2 className="text-sm font-extrabold">{title}</h2>
      <div className="prose prose-sm mt-2 max-w-none whitespace-pre-line text-sm text-zinc-700">{body}</div>
    </section>
  );
}
