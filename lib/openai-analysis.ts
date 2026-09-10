import OpenAI from "openai";
import type { ApplicationResult } from "./types";

const schema = { name: "resume_match_analysis", strict: true, schema: { type: "object", additionalProperties: false, required: ["score", "roleTitle", "summary", "matchedSkills", "missingSkills", "improvements", "rewrittenBullets"], properties: { score: { type: "integer", minimum: 0, maximum: 100 }, roleTitle: { type: "string" }, summary: { type: "string" }, matchedSkills: { type: "array", items: { type: "string" }, maxItems: 10 }, missingSkills: { type: "array", items: { type: "string" }, maxItems: 10 }, improvements: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 8 }, rewrittenBullets: { type: "array", items: { type: "string" }, maxItems: 5 } } } } as const;
export async function analyzeResume(resumeText: string, jobDescription: string, roleTitle: string): Promise<ApplicationResult> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({ model: process.env.OPENAI_MODEL || "gpt-5-mini", response_format: { type: "json_schema", json_schema: schema }, messages: [{ role: "system", content: "You are a precise resume-to-job evaluator. Use only evidence present in the resume. Never invent experience. Score role alignment from 0 to 100. Make improvements specific, concise, ATS-friendly, and honest. Suggested rewrites may strengthen phrasing but must not add facts, metrics, tools, or responsibilities absent from the resume." }, { role: "user", content: `ROLE TITLE\n${roleTitle}\n\nJOB DESCRIPTION\n${jobDescription}\n\nRESUME\n${resumeText}` }] });
  const content = response.choices[0]?.message?.content; if (!content) throw new Error("The AI returned an empty analysis."); return JSON.parse(content) as ApplicationResult;
}
