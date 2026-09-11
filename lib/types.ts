export type ApplicationStatus = "pending_approval" | "processing" | "completed" | "analysis_failed" | "rejected";
export type ApplicationResult = { score: number; roleTitle: string; summary: string; matchedSkills: string[]; missingSkills: string[]; improvements: string[]; rewrittenBullets: string[] };
export type PublicApplication = { id: string; applicantName: string; applicantEmail?: string; jobUrl: string; fileName: string; status: ApplicationStatus; createdAt: string; updatedAt: string; result?: ApplicationResult; error?: string };
export type SubmissionReceipt = { id: string; status: ApplicationStatus; trackingToken: string };
