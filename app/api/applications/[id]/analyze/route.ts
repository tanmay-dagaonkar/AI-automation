import { ObjectId } from "mongodb";
import { extractJobDescription } from "@/lib/job-description";
import { applications } from "@/lib/mongodb";
import { analyzeResume } from "@/lib/openai-analysis";
import { publicApplication } from "@/lib/public-application";
import { isAdmin } from "@/lib/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized." }, { status: 401 }); const { id } = await context.params; if (!ObjectId.isValid(id)) return Response.json({ error: "Not found." }, { status: 404 }); const collection = await applications();
  const row = await collection.findOneAndUpdate({ _id: new ObjectId(id), status: { $in: ["pending_approval", "analysis_failed"] } }, { $set: { status: "processing", updatedAt: new Date() }, $unset: { error: "" } }, { returnDocument: "after" });
  if (!row) return Response.json({ error: "This submission is already processing or complete." }, { status: 409 });
  try { let roleTitle = ""; let jobDescription = ""; try { const extracted = await extractJobDescription(row.jobUrl); roleTitle = extracted.roleTitle; jobDescription = extracted.description; } catch (error) { if (!row.fallbackJobDescription || row.fallbackJobDescription.length < 80) throw error; roleTitle = "Job application"; jobDescription = row.fallbackJobDescription; } const result = await analyzeResume(row.resumeText, jobDescription, roleTitle); const updated = await collection.findOneAndUpdate({ _id: row._id }, { $set: { status: "completed", result, updatedAt: new Date() }, $unset: { error: "" } }, { returnDocument: "after" }); return Response.json(updated ? publicApplication(updated, true) : { result }); }
  catch (error) { const message = error instanceof Error ? error.message : "Analysis failed."; await collection.updateOne({ _id: row._id }, { $set: { status: "analysis_failed", error: message.slice(0, 500), updatedAt: new Date() } }); return Response.json({ error: message }, { status: 502 }); }
}
