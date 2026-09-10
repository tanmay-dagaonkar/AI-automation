import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ObjectId } from "mongodb";
import { applications, resumeBucket } from "@/lib/mongodb";
import { publicApplication } from "@/lib/public-application";
import { extractResumeText } from "@/lib/resume";
import { hashToken, isAdmin, validAccessCode } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const field = (form: FormData, name: string) => String(form.get(name) || "").trim();

export async function POST(request: Request) {
  let fileId: ObjectId | undefined;
  try {
    const form = await request.formData();
    const applicantName = field(form, "applicantName"); const applicantEmail = field(form, "applicantEmail").toLowerCase(); const jobUrl = field(form, "jobUrl"); const fallbackJobDescription = field(form, "fallbackJobDescription"); const resume = form.get("resume");
    if (!validAccessCode(field(form, "accessCode"))) return Response.json({ error: "Invalid submission access code." }, { status: 403 });
    if (!applicantName || applicantName.length > 100) return Response.json({ error: "Enter a valid name." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(applicantEmail) || applicantEmail.length > 200) return Response.json({ error: "Enter a valid email." }, { status: 400 });
    try { const parsed = new URL(jobUrl); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); } catch { return Response.json({ error: "Enter a valid public job URL." }, { status: 400 }); }
    if (field(form, "consent") !== "yes") return Response.json({ error: "Consent is required before storing a resume." }, { status: 400 });
    if (!(resume instanceof File) || !resume.name.toLowerCase().endsWith(".pdf")) return Response.json({ error: "Upload a PDF resume." }, { status: 400 });
    if (!resume.size || resume.size > MAX_FILE_SIZE) return Response.json({ error: "The PDF must be between 1 byte and 4 MB." }, { status: 400 });
    const buffer = Buffer.from(await resume.arrayBuffer()); const resumeText = await extractResumeText(buffer);
    if (resumeText.length < 100) return Response.json({ error: "We could not extract enough text from this PDF. Try a text-based resume PDF." }, { status: 400 });
    const bucket = await resumeBucket(); const upload = bucket.openUploadStream(resume.name.replace(/[^a-zA-Z0-9._ -]/g, "_"), { metadata: { applicantEmail, uploadedAt: new Date() } }); fileId = upload.id; await pipeline(Readable.from(buffer), upload);
    const trackingToken = randomBytes(32).toString("base64url"); const now = new Date();
    const result = await (await applications()).insertOne({ applicantName, applicantEmail, jobUrl, fallbackJobDescription: fallbackJobDescription || undefined, fileId, fileName: resume.name, mimeType: "application/pdf", fileSize: resume.size, resumeText, trackingTokenHash: hashToken(trackingToken), status: "pending_approval", createdAt: now, updatedAt: now });
    return Response.json({ id: result.insertedId.toHexString(), status: "pending_approval", trackingToken }, { status: 201 });
  } catch (error) { if (fileId) try { await (await resumeBucket()).delete(fileId); } catch { /* best-effort cleanup */ } console.error(error); return Response.json({ error: error instanceof Error ? error.message : "Could not store this submission." }, { status: 500 }); }
}

export async function GET(request: Request) { if (!isAdmin(request)) return Response.json({ error: "Unauthorized." }, { status: 401 }); const rows = await (await applications()).find({}, { projection: { resumeText: 0, trackingTokenHash: 0 } }).sort({ createdAt: -1 }).limit(100).toArray(); return Response.json({ applications: rows.map(row => publicApplication(row, true)) }); }
