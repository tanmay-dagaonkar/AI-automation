import { ObjectId } from "mongodb";
import { applications } from "@/lib/mongodb";
import { publicApplication } from "@/lib/public-application";
import { hashToken } from "@/lib/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { const { id } = await context.params; const token = new URL(request.url).searchParams.get("token") || ""; if (!ObjectId.isValid(id) || !token) return Response.json({ error: "Not found." }, { status: 404 }); const row = await (await applications()).findOne({ _id: new ObjectId(id), trackingTokenHash: hashToken(token) }); if (!row) return Response.json({ error: "Not found." }, { status: 404 }); return Response.json(publicApplication(row)); }
