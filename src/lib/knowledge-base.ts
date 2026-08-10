import { prisma } from "@/lib/prisma";

// ==================== KNOWLEDGE BASE ====================

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  views: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KBFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

type KnowledgeBaseRecord = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string | null;
  author: string;
  views: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function formatArticle(a: KnowledgeBaseRecord): KBArticle {
  return {
    ...a,
    tags: a.tags ? a.tags.split(",") : [],
  };
}

/**
 * Get all published articles
 */
export async function getArticles(category?: string): Promise<KBArticle[]> {
  const where: Record<string, unknown> = { isPublished: true };
  if (category) where.category = category;

  const articles = await prisma.knowledgeBase.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return articles.map((a) => formatArticle(a as KnowledgeBaseRecord));
}

/**
 * Get article by ID
 */
export async function getArticleById(id: string): Promise<KBArticle | null> {
  const article = await prisma.knowledgeBase.findUnique({
    where: { id },
  });

  if (!article) return null;

  await prisma.knowledgeBase.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  return formatArticle(article as KnowledgeBaseRecord);
}

/**
 * Search articles
 */
export async function searchArticles(query: string): Promise<KBArticle[]> {
  const articles = await prisma.knowledgeBase.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { tags: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { views: "desc" },
  });

  return articles.map((a) => formatArticle(a as KnowledgeBaseRecord));
}

/**
 * Get popular articles
 */
export async function getPopularArticles(limit: number = 5): Promise<KBArticle[]> {
  const articles = await prisma.knowledgeBase.findMany({
    where: { isPublished: true },
    orderBy: { views: "desc" },
    take: limit,
  });

  return articles.map((a) => formatArticle(a as KnowledgeBaseRecord));
}

/**
 * Get KB categories
 */
export async function getKBCategories(): Promise<{ category: string; count: number }[]> {
  const categories = await prisma.knowledgeBase.groupBy({
    by: ["category"],
    where: { isPublished: true },
    _count: { category: true },
  });

  return categories.map((c) => ({
    category: c.category,
    count: c._count.category,
  }));
}

// Default FAQ data
export const DEFAULT_FAQS: Omit<KBFAQ, "id">[] = [
  {
    question: "Bagaimana cara mengajukan cuti?",
    answer: "Silakan login ke SmartHRIS, masuk ke menu Self Service > Pengajuan, pilih tipe cuti, isi tanggal dan alasan. Pengajuan akan dikirim ke manager untuk approval.",
    category: "Cuti",
    order: 1,
  },
  {
    question: "Jam kerja berapa?",
    answer: "Jam kerja standar SmartHRIS adalah Senin-Jumat, 08:00 - 17:00. Jam istirahat: 12:00 - 13:00. Grace period 15 menit.",
    category: "Absensi",
    order: 2,
  },
  {
    question: "Bagaimana cara absen online?",
    answer: "Buka menu Absensi > Absen Online. Pastikan GPS aktif dan Anda berada di dalam radius kantor (100m). Klik tombol Check In/Check Out.",
    category: "Absensi",
    order: 3,
  },
  {
    question: "Kapan gaji ditransfer?",
    answer: "Gaji ditransfer pada tanggal 25 setiap bulannya. Slip gaji dapat dilihat di menu Layanana > Gaji.",
    category: "Payroll",
    order: 4,
  },
  {
    question: "Bagaimana cara mengajukan lembur?",
    answer: "Ajukan lembur melalui menu Absensi > Lembur. Lembur harus disetujui oleh manager. Pembayaran lembur digabung dengan gaji bulanan.",
    category: "Absensi",
    order: 5,
  },
  {
    question: "Apa itu BPJS Ketenagakerjaan?",
    answer: "BPJS Ketenagakerjaan meliputi JHT (Jaminan Hari Tua), JP (Jaminan Pensiun), JKK (Jaminan Kecelakaan Kerja), dan JKM (Jaminan Kematian). Iuran otomatis dipotong dari gaji.",
    category: "Benefit",
    order: 6,
  },
  {
    question: "Bagaimana cara melihat slip gaji?",
    answer: "Login ke SmartHRIS, masuk ke menu Layanana > Gaji. Pilih bulan yang diinginkan. Slip gaji juga dikirim via email setiap akhir bulan.",
    category: "Payroll",
    order: 7,
  },
  {
    question: "Bagaimana cara mengubah data pribadi?",
    answer: "Untuk perubahan data seperti nomor telepon atau alamat, dapat dilakukan di profil. Untuk perubahan data penting (nama, NPWP, rekening bank), silakan ajukan ke HR.",
    category: "Umum",
    order: 8,
  },
];
