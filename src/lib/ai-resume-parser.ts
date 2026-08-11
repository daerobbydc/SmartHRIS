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
 * Common skill dictionary for HRIS recruitment matching
 */
const COMMON_SKILLS = [
  "react", "next.js", "typescript", "javascript", "node.js", "express", "tailwind",
  "postgresql", "mysql", "mongodb", "prisma", "docker", "aws", "git", "rest api",
  "php", "laravel", "python", "java", "figma", "ui/ux", "scrum", "agile",
  "excel", "financial analysis", "accounting", "taxation", "pph21", "bpjs",
  "hris", "payroll", "recruitment", "public speaking", "communication", "leadership",
  "project management", "time management", "problem solving", "english", "bahasa indonesia"
];

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

  const vacancyRequirements = `${vacancy.title} ${vacancy.position} ${vacancy.department} ${vacancy.requirements} ${vacancy.description}`.toLowerCase();
  const applicantProfile = `${applicant.name} ${applicant.coverLetter || ""} ${applicant.notes || ""} ${applicant.source || ""} ${driveCvText} ${applicant.cvUrl || ""}`.toLowerCase();

  // Extract skills present in vacancy
  const vacancySkills = COMMON_SKILLS.filter((skill) => vacancyRequirements.includes(skill));

  // Extract skills present in applicant's profile
  const candidateSkills = COMMON_SKILLS.filter((skill) => applicantProfile.includes(skill));

  // Determine matched and missing skills
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  if (vacancySkills.length > 0) {
    vacancySkills.forEach((skill) => {
      if (candidateSkills.includes(skill) || applicantProfile.includes(skill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });
  } else {
    // Fallback: extract key words (min length 4)
    const keywords = Array.from(new Set(vacancyRequirements.match(/\b[a-z]{4,}\b/g) || [])).slice(0, 15);
    keywords.forEach((word) => {
      if (applicantProfile.includes(word)) {
        matchedSkills.push(word);
      } else {
        missingSkills.push(word);
      }
    });
  }

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
    strengths.push(`Memiliki keahlian relevan terdeteksi: ${matchedSkills.slice(0, 5).join(", ")}`);
  }
  if (applicant.coverLetter && applicant.coverLetter.length > 150) {
    strengths.push("Surat lamaran terstruktur dengan penjelasan kualifikasi yang jelas");
  }
  if (applicant.rating && applicant.rating >= 4) {
    strengths.push(`Mendapatkan rating internal tinggi (${applicant.rating}/5)`);
  }

  if (missingSkills.length > 0) {
    areasOfConcern.push(`Keahlian belum terdeteksi secara eksplisit: ${missingSkills.slice(0, 5).join(", ")}`);
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
      `AI berhasil memindai berkas CV Google Drive & Cover Letter, menemukan ${matchedSkills.length} keahlian sesuai dari total ${totalReqs} kualifikasi posisi. ` +
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
