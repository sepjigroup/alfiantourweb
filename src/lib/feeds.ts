export type FeedLocale = "id" | "en" | "ar";

export type FeedPost = {
  id: number;
  slug: string;
  image: string;
  author: string;
  time: Record<FeedLocale, string>;
  readTime: Record<FeedLocale, string>;
  title: Record<FeedLocale, string>;
  excerpt: Record<FeedLocale, string>;
  content: Record<FeedLocale, string[]>;
  likes: number;
  comments: number;
  shares: number;
};

export const FEED_LIKERS = [
  "Siti Aisyah",
  "Ahmad Fauzi",
  "Nurul Huda",
  "Rizky Pratama",
  "Fatimah Zahra",
];

export const FEED_COMMENTS = [
  { name: "Ibu Nani", text: "MasyaAllah, artikelnya sangat membantu untuk persiapan." },
  { name: "Bpk Rahman", text: "Poinnya jelas dan mudah dipahami. Terima kasih." },
  { name: "Alya", text: "Saya jadi lebih tenang untuk keberangkatan pertama." },
];

export const FEED_POSTS: FeedPost[] = [
  {
    id: 1,
    slug: "haji-mabrur-impian-setiap-muslim",
    image: "https://picsum.photos/id/101/800/500",
    author: "Alfian Sejahtera Abadi",
    time: { id: "2 jam lalu", en: "2 hours ago", ar: "منذ ساعتين" },
    readTime: { id: "Baca 4 menit", en: "4 min read", ar: "4 دقائق قراءة" },
    title: {
      id: "Haji Mabrur Impian Setiap Muslim",
      en: "Hajj Mabrur: Every Muslim's Dream",
      ar: "الحج المبرور حلم كل مسلم",
    },
    excerpt: {
      id: "Makna haji mabrur bukan hanya ritual, tetapi perubahan akhlak setelah pulang ke tanah air.",
      en: "Hajj mabrur is not only ritual completion, but real character transformation after returning home.",
      ar: "الحج المبرور ليس مجرد أداء المناسك، بل تحول حقيقي في الأخلاق بعد العودة.",
    },
    content: {
      id: [
        "Haji mabrur adalah ibadah yang diterima Allah dan tercermin dalam perubahan perilaku jamaah setelah pulang.",
        "Tanda-tandanya antara lain semakin menjaga shalat, mudah memaafkan, dan lebih peduli kepada sesama.",
        "Persiapan haji sebaiknya dimulai dari niat, ilmu manasik, kesehatan fisik, serta kesiapan mental keluarga.",
      ],
      en: [
        "A mabrur hajj is accepted by Allah and reflected in a pilgrim's improved conduct after returning home.",
        "Its signs include better prayer consistency, forgiveness, and stronger care for others.",
        "Preparation should cover intention, manasik knowledge, physical health, and family readiness.",
      ],
      ar: [
        "الحج المبرور هو الحج المقبول عند الله ويظهر أثره في سلوك الحاج بعد العودة.",
        "من علاماته المحافظة على الصلاة، وسعة الصدر، والاهتمام بالآخرين.",
        "ويبدأ الاستعداد له بالنية والعلم بالمناسك والصحة البدنية والتهيؤ الأسري.",
      ],
    },
    likes: 124,
    comments: 18,
    shares: 9,
  },
  {
    id: 2,
    slug: "tips-agar-tidak-kesasar-di-masjidil-haram",
    image: "https://picsum.photos/id/102/800/500",
    author: "Alfian Sejahtera Abadi",
    time: { id: "kemarin", en: "yesterday", ar: "أمس" },
    readTime: { id: "Baca 5 menit", en: "5 min read", ar: "5 دقائق قراءة" },
    title: {
      id: "Tips Lengkap Agar Tak Kesasar di Masjidil Haram",
      en: "Complete Tips to Avoid Getting Lost in Masjidil Haram",
      ar: "نصائح كاملة لتجنب الضياع في المسجد الحرام",
    },
    excerpt: {
      id: "Catat gate, simpan pin lokasi hotel, dan gunakan titik kumpul tetap untuk rombongan.",
      en: "Note your gate, save hotel pin location, and keep a fixed meeting point for your group.",
      ar: "دوّن البوابة، واحفظ موقع الفندق، وحدد نقطة تجمع ثابتة للمجموعة.",
    },
    content: {
      id: [
        "Masjidil Haram sangat luas, sehingga jamaah baru perlu strategi sederhana agar tidak panik.",
        "Gunakan foto penanda jalur, hafalkan nomor gate utama, dan simpan kartu hotel setiap saat.",
        "Saat terpisah, tetap tenang, menuju titik kumpul, dan hubungi pembimbing melalui grup resmi.",
      ],
      en: [
        "Masjidil Haram is very large, so first-time pilgrims need simple anti-panic strategies.",
        "Use route marker photos, memorize key gate numbers, and keep your hotel card with you.",
        "If separated, stay calm, go to the meeting point, and contact your guide through the official group.",
      ],
      ar: [
        "المسجد الحرام واسع جدا، لذلك يحتاج الحاج الجديد إلى خطوات بسيطة لتجنب الارتباك.",
        "التقط صورا للمعالم، واحفظ أرقام البوابات المهمة، واحتفظ ببطاقة الفندق دائما.",
        "عند الانفصال عن المجموعة، التزم الهدوء واذهب لنقطة التجمع وتواصل مع المشرف.",
      ],
    },
    likes: 98,
    comments: 22,
    shares: 14,
  },
  {
    id: 3,
    slug: "persiapan-fisik-sebelum-umrah",
    image: "https://picsum.photos/id/103/800/500",
    author: "Alfian Sejahtera Abadi",
    time: { id: "2 hari lalu", en: "2 days ago", ar: "منذ يومين" },
    readTime: { id: "Baca 4 menit", en: "4 min read", ar: "4 دقائق قراءة" },
    title: {
      id: "Persiapan Fisik Sebelum Berangkat Umrah",
      en: "Physical Preparation Before Umrah Departure",
      ar: "التحضير البدني قبل السفر للعمرة",
    },
    excerpt: {
      id: "Latihan jalan 30 menit, jaga hidrasi, dan konsultasi riwayat medis sebelum keberangkatan.",
      en: "Walk 30 minutes daily, maintain hydration, and review medical history before departure.",
      ar: "امشِ 30 دقيقة يوميا، وحافظ على الترطيب، وراجع تاريخك الطبي قبل السفر.",
    },
    content: {
      id: [
        "Ibadah umrah membutuhkan stamina karena aktivitas berjalan cukup intens di area masjid.",
        "Mulai latihan ringan 4-6 minggu sebelum berangkat untuk menyesuaikan fisik secara bertahap.",
        "Jangan abaikan tidur cukup, asupan gizi, dan obat rutin yang harus dibawa selama perjalanan.",
      ],
      en: [
        "Umrah requires stamina as walking activity can be intensive around mosque areas.",
        "Start light training 4-6 weeks before departure to build gradual physical adaptation.",
        "Do not neglect sleep quality, nutrition, and routine medication to bring during the trip.",
      ],
      ar: [
        "تتطلب العمرة لياقة بدنية بسبب كثرة المشي في محيط الحرم.",
        "ابدأ تمارين خفيفة قبل السفر بـ 4 إلى 6 أسابيع لبناء التدرج البدني.",
        "لا تهمل النوم الكافي والتغذية الجيدة والأدوية الدورية أثناء الرحلة.",
      ],
    },
    likes: 87,
    comments: 11,
    shares: 7,
  },
  {
    id: 4,
    slug: "keutamaan-umrah-di-bulan-ramadhan",
    image: "https://picsum.photos/id/104/800/500",
    author: "Alfian Sejahtera Abadi",
    time: { id: "3 hari lalu", en: "3 days ago", ar: "منذ 3 أيام" },
    readTime: { id: "Baca 3 menit", en: "3 min read", ar: "3 دقائق قراءة" },
    title: {
      id: "Keutamaan Umrah di Bulan Ramadhan",
      en: "The Virtues of Umrah in Ramadan",
      ar: "فضائل العمرة في رمضان",
    },
    excerpt: {
      id: "Ramadhan memberi nuansa ibadah lebih khusyuk dan pahala yang berlipat bagi jamaah umrah.",
      en: "Ramadan brings deeper devotion and multiplied rewards for umrah pilgrims.",
      ar: "رمضان يمنح روحانية أعلى وأجرا مضاعفا لمعتمري بيت الله.",
    },
    content: {
      id: [
        "Umrah di bulan Ramadhan memiliki keutamaan besar sebagaimana banyak dijelaskan dalam hadits.",
        "Selain pahala, jamaah juga merasakan suasana kebersamaan ibadah yang sangat kuat.",
        "Perencanaan jauh hari diperlukan karena kuota terbatas dan tingkat kepadatan lebih tinggi.",
      ],
      en: [
        "Umrah in Ramadan has major virtues as widely described in hadith narrations.",
        "Beyond reward, pilgrims experience a powerful atmosphere of collective worship.",
        "Early planning is essential due to limited quota and higher crowd density.",
      ],
      ar: [
        "للعمرة في رمضان فضل عظيم كما ورد في الأحاديث.",
        "إضافة إلى الأجر، يشعر المعتمر بأجواء إيمانية جماعية مميزة.",
        "ويحتاج الأمر إلى تخطيط مبكر بسبب محدودية المقاعد وكثافة الزوار.",
      ],
    },
    likes: 141,
    comments: 26,
    shares: 19,
  },
];

export function getFeedById(id: number) {
  return FEED_POSTS.find((item) => item.id === id);
}
