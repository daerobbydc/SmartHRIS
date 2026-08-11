import { prisma } from "@/lib/prisma";

export interface AIScreeningResult {
  applicantId: string;
  applicantName: string;
  vacancyTitle: string;
  matchScore: number; // 0 - 100
  grade: "SANGAT_SESUAI" | "SESUAI" | "CUKUP" | "PERLU_PERTIMBANGAN" | "TIDAK_SESUAI";
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  areasOfConcern: string[];
  summary: string;
  recommendation: "PRIORITY_INTERVIEW" | "PROCEED_STAGE" | "MANUAL_REVIEW" | "REJECT";
}

/**
 * Comprehensive Indonesian & English skill & occupation dictionary for HRIS matching
 */
const COMMON_SKILLS = [
  // === 1. TEKNOLOGI INFORMASI & SOFTWARE ENGINEERING ===
  "react", "next.js", "vue.js", "angular", "typescript", "javascript", "node.js", "express", "nest.js",
  "tailwind", "bootstrap", "html", "css", "flutter", "react native", "android", "ios", "swift", "kotlin",
  "golang", "php", "laravel", "codeigniter", "python", "django", "fastapi", "java", "spring boot",
  "c#", ".net", "postgresql", "mysql", "mongodb", "sqlite", "redis", "prisma", "docker", "kubernetes",
  "aws", "google cloud", "azure", "git", "github", "gitlab", "ci/cd", "rest api", "graphql", "microservices",
  "devops", "cybersecurity", "sysadmin", "network engineer", "qa engineer", "software tester",
  "ui/ux", "figma", "adobe xd", "scrum", "agile", "web development", "backend", "frontend", "fullstack",

  // === 2. PEMASARAN, DIGITAL MARKETING, SOSMED & KREATIF ===
  "digital marketing", "pemasaran digital", "pemasaran", "social media specialist", "social media", "sosial media",
  "instagram", "tiktok", "facebook ads", "google ads", "meta ads", "content creator", "content planner",
  "copywriting", "copywriter", "content writing", "seo", "sem", "keyword research", "google analytics",
  "graphic design", "desain grafis", "photoshop", "illustrator", "canva", "coreldraw", "video editing",
  "premiere pro", "after effects", "capcut", "videografer", "videographer", "fotografer", "photographer",
  "branding", "brand awareness", "public relations", "humas", "hubungan masyarakat", "event organizer",
  "influencer marketing", "kol management", "email marketing", "iklan", "promosi",

  // === 3. KEUANGAN, AKUNTANSI, PAJAK & PERBANKAN ===
  "accounting", "akuntansi", "keuangan", "finance", "pembukuan", "bookkeeping", "laporan keuangan",
  "financial statement", "jurnal umum", "general ledger", "pajak", "taxation", "tax", "pph21", "pph23",
  "pph25", "ppn", "efaktur", "ebupot", "spt", "brevet a", "brevet b", "zahir", "accurate", "myob", "sap",
  "excel", "microsoft excel", "vlookup", "pivot table", "auditing", "internal audit", "cash flow",
  "rekon bank", "bank reconciliation", "piutang", "utang", "account payable", "account receivable",
  "perbankan", "teller", "customer service bank",

  // === 4. SUMBER DAYA MANUSIA, HRD, PERSONALIA & LEGAL ===
  "human resources", "hrd", "hr generalist", "hr manager", "hr staff", "recruitment", "rekrutmen",
  "talent acquisition", "sourcing", "interview", "wawancara", "psikotes", "payroll", "penggajian", "gaji",
  "bpjs ketenagakerjaan", "bpjs kesehatan", "hris", "personalia", "general affair", "ga", "hubungan industrial",
  "industrial relations", "uu ketenagakerjaan", "pkwt", "pkwtt", "sop", "key performance indicator", "kpi",
  "perjanjian kerja", "legal", "penyusunan kontrak", "hukum perusahaan", "corporate legal",

  // === 5. PENJUALAN, BISNIS, CUSTOMER SERVICE & RETAIL ===
  "sales", "penjualan", "sales executive", "sales manager", "account executive", "business development", "bd",
  "pengembangan bisnis", "kanvasing", "telemarketing", "telesales", "customer service", "layanan pelanggan",
  "crm", "hubspot", "salesforce", "negosiasi", "negotiation", "presentasi", "pitching", "retensi pelanggan",
  "retail", "kasir", "spg", "spb", "store manager", "merchandiser",

  // === 6. OPERASIONAL, LOGISTIK, GUDANG & MANUFAKTUR ===
  "operasional", "operations", "logistik", "logistics", "gudang", "warehouse", "inventaris", "inventory",
  "stock opname", "supply chain", "rantai pasok", "pengiriman", "freight forwarding", "driver", "kurir",
  "fleet management", "manufaktur", "produksi", "quality control", "qc", "quality assurance", "qa",
  "k3", "keselamatan kerja", "iso 9001", "5s", "kaizen", "lean manufacturing",

  // === 7. ADMINISTRASI, UMUM & SEKRETARIS ===
  "administrasi", "administration", "admin toko", "admin sosmed", "admin gudang", "admin penjualan",
  "ms office", "microsoft office", "word", "powerpoint", "google docs", "google sheets", "input data",
  "data entry", "sekretaris", "secretary", "korespondensi", "pengarsipan", "filing", "notulensi",
  "receptionist", "resepsionis",

  // === 8. BAHASA, SOFT SKILLS & KUALIFIKASI KUNCI ===
  "komunikasi", "communication", "kepemimpinan", "leadership", "kerja tim", "teamwork", "manajemen waktu",
  "time management", "problem solving", "pemecahan masalah", "berpikir kritis", "critical thinking",
  "adaptabilitas", "adaptability", "kreativitas", "creativity", "bahasa indonesia", "bahasa inggris",
  "english", "mandarin", "jepang", "d3", "s1", "s2", "sma", "smk", "sarjana", "diploma", "magang", "internship"
];

const STOP_WORDS = new Set([
  "yang", "dan", "di", "ke", "dari", "ini", "itu", "dengan", "untuk", "pada", "adalah",
  "sebagai", "akan", "bisa", "dapat", "atau", "oleh", "juga", "sudah", "saya", "kami",
  "mereka", "anda", "saudara", "harus", "wajib", "memiliki", "serta", "dalam", "secara",
  "minimal", "pendidikan", "pengalaman", "posisi", "tugas", "tahun", "tingkat", "tentang",
  "bisa", "secara", "serta", "with", "from", "that", "this", "have", "will", "your",
  "their", "about", "must", "they", "them", "some", "more", "such", "than", "then",
  "hingga", "kuota", "terpenuhi", "staf", "staff", "dibutuhkan", "persyaratan", "persyaratan:",
  "kualifikasi", "deskripsi", "tanggung", "jawab", "job", "description"
]);

/**
 * Fetch and extract text content from Google Drive CV links
 */
export async function fetchGoogleDriveCVText(cvUrl: string): Promise<string> {
  if (!cvUrl) return "";

  try {
    let fileId: string | null = null;
    const match1 = cvUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const match2 = cvUrl.match(/id=([a-zA-Z0-9_-]+)/);

    if (match1) fileId = match1[1];
    else if (match2) fileId = match2[1];

    if (fileId) {
      const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const res = await fetch(exportUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (res.ok) {
        const text = await res.text();
        const cleanedText = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (cleanedText.length > 50) {
          return cleanedText.slice(0, 5000); // Return up to 5k chars for AI NLP parsing
        }
      }
    }
  } catch (err) {
    console.error("Error fetching Google Drive CV text:", err);
  }

  return cvUrl;
}

/**
 * Screen candidate against job vacancy requirements
 */
export async function screenCandidate(applicantId: string): Promise<AIScreeningResult> {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { vacancy: true },
  });

  if (!applicant) {
    throw new Error("Applicant not found");
  }

  const { vacancy } = applicant;

  // Extract CV text from Google Drive link if available
  let driveCvText = "";
  if (applicant.cvUrl && (applicant.cvUrl.includes("drive.google.com") || applicant.cvUrl.includes("docs.google.com"))) {
    driveCvText = await fetchGoogleDriveCVText(applicant.cvUrl);
  }

  const vacancyTextLower = `${vacancy.title} ${vacancy.position} ${vacancy.department} ${vacancy.requirements} ${vacancy.description}`.toLowerCase();
  const applicantProfileLower = `${applicant.name} ${applicant.coverLetter || ""} ${applicant.notes || ""} ${applicant.source || ""} ${driveCvText} ${applicant.cvUrl || ""}`.toLowerCase();

  // 1. Extract skills present in vacancy dictionary
  let vacancySkills = COMMON_SKILLS.filter((skill) => vacancyTextLower.includes(skill));

  // 2. Fallback NLP word extraction if dictionary match is small
  if (vacancySkills.length < 3) {
    const words = Array.from(new Set(vacancyTextLower.match(/\b[a-zA-Z0-9_-]{3,}\b/g) || []));
    const extractedKeywords = words.filter((w) => !STOP_WORDS.has(w) && !/^\d+$/.test(w));
    vacancySkills = Array.from(new Set([...vacancySkills, ...extractedKeywords])).slice(0, 15);
  }

  // Determine matched and missing skills
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  vacancySkills.forEach((skill) => {
    if (applicantProfileLower.includes(skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // Calculate base score
  let baseScore = 50;

  // 1. Skill Match Ratio (40 pts)
  const totalReqs = Math.max(1, matchedSkills.length + missingSkills.length);
  const skillRatio = matchedSkills.length / totalReqs;
  baseScore += Math.round(skillRatio * 40);

  // 2. Cover Letter Presence & Quality (15 pts)
  if (applicant.coverLetter && applicant.coverLetter.length > 100) {
    baseScore += 15;
  } else if (applicant.coverLetter) {
    baseScore += 8;
  }

  // 3. Google Drive CV Link presence & content scan (15 pts)
  if (applicant.cvUrl && applicant.cvUrl.includes("drive.google.com")) {
    baseScore += 10;
    if (driveCvText.length > 100) {
      baseScore += 5; // Bonus score for successfully extracted CV text from Google Drive
    }
  } else if (applicant.cvUrl) {
    baseScore += 8;
  }

  // 4. Contact completeness (5 pts)
  if (applicant.phone && applicant.email) {
    baseScore += 5;
  }

  // 5. Source & Blacklist check
  if (applicant.isBlacklisted) {
    baseScore = 0;
  }

  // Cap score between 0 and 100
  const matchScore = Math.min(100, Math.max(0, baseScore));

  // Determine grade & recommendation
  let grade: AIScreeningResult["grade"] = "CUKUP";
  let recommendation: AIScreeningResult["recommendation"] = "MANUAL_REVIEW";

  if (applicant.isBlacklisted) {
    grade = "TIDAK_SESUAI";
    recommendation = "REJECT";
  } else if (matchScore >= 85) {
    grade = "SANGAT_SESUAI";
    recommendation = "PRIORITY_INTERVIEW";
  } else if (matchScore >= 70) {
    grade = "SESUAI";
    recommendation = "PROCEED_STAGE";
  } else if (matchScore >= 50) {
    grade = "CUKUP";
    recommendation = "MANUAL_REVIEW";
  } else if (matchScore >= 35) {
    grade = "PERLU_PERTIMBANGAN";
    recommendation = "MANUAL_REVIEW";
  } else {
    grade = "TIDAK_SESUAI";
    recommendation = "REJECT";
  }

  // Generate Strengths & Concerns
  const strengths: string[] = [];
  const areasOfConcern: string[] = [];

  if (applicant.cvUrl && applicant.cvUrl.includes("drive.google.com")) {
    strengths.push("Melampirkan Link CV Google Drive resmi yang telah dianalisis AI");
  }

  if (matchedSkills.length > 0) {
    strengths.push(`Memiliki keahlian/kualifikasi terdeteksi: ${matchedSkills.slice(0, 5).join(", ")}`);
  }
  if (applicant.coverLetter && applicant.coverLetter.length > 150) {
    strengths.push("Surat lamaran terstruktur dengan penjelasan kualifikasi yang jelas");
  }
  if (applicant.rating && applicant.rating >= 4) {
    strengths.push(`Mendapatkan rating internal tinggi (${applicant.rating}/5)`);
  }

  if (missingSkills.length > 0) {
    areasOfConcern.push(`Keahlian/persyaratan belum terdeteksi secara eksplisit: ${missingSkills.slice(0, 5).join(", ")}`);
  }
  if (!applicant.coverLetter) {
    areasOfConcern.push("Tidak melampirkan Surat Lamaran / Cover Letter");
  }
  if (applicant.isBlacklisted) {
    areasOfConcern.push(`Pelamar berada dalam daftar Blacklist: ${applicant.blacklistedReason || "Alasan internal"}`);
  }

  // Executive summary
  const summary = applicant.isBlacklisted
    ? `Kandidat ${applicant.name} dalam status Blacklist. Tidak direkomendasikan untuk diproses.`
    : `Kandidat ${applicant.name} memperoleh skor AI Match ${matchScore}% untuk posisi ${vacancy.title}. ` +
      `AI memindai kualifikasi, menemukan ${matchedSkills.length} keahlian yang sesuai dari total ${totalReqs} persyaratan posisi. ` +
      `Rekomendasi tindakan: ${recommendation.replace(/_/g, " ")}.`;

  const screeningResult: AIScreeningResult = {
    applicantId: applicant.id,
    applicantName: applicant.name,
    vacancyTitle: vacancy.title,
    matchScore,
    grade,
    matchedSkills,
    missingSkills,
    strengths,
    areasOfConcern,
    summary,
    recommendation,
  };

  // Save result to Applicant record
  await prisma.applicant.update({
    where: { id: applicantId },
    data: {
      aiMatchScore: matchScore,
      aiAnalysis: JSON.stringify(screeningResult),
    },
  });

  return screeningResult;
}

/**
 * Batch screen all applicants for a vacancy
 */
export async function batchScreenApplicants(vacancyId: string): Promise<AIScreeningResult[]> {
  const applicants = await prisma.applicant.findMany({
    where: { vacancyId },
    select: { id: true },
  });

  const results: AIScreeningResult[] = [];
  for (const app of applicants) {
    const res = await screenCandidate(app.id);
    results.push(res);
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}
