import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
export async function extractResumeText(buffer: Buffer) { const parser = new PDFParse({ data: buffer, CanvasFactory }); try { const result = await parser.getText(); return result.text.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(); } finally { await parser.destroy(); } }
