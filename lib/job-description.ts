import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";

const MAX_HTML = 1_500_000;
function privateIp(address: string) { if (address === "::1" || address === "0.0.0.0") return true; if (address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true; const p = address.split(".").map(Number); return p.length === 4 && (p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127)); }
async function safeUrl(raw: string) { const url = new URL(raw); if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Only public HTTP(S) job URLs are supported."); if (url.hostname === "localhost" || (isIP(url.hostname) > 0 && privateIp(url.hostname))) throw new Error("Private network URLs are not allowed."); const addresses = await lookup(url.hostname, { all: true }); if (!addresses.length || addresses.some(({ address }) => privateIp(address))) throw new Error("The job URL resolves to a private network."); return url; }

export async function extractJobDescription(rawUrl: string) {
  let url = await safeUrl(rawUrl); let response: Response | undefined;
  for (let redirects = 0; redirects < 4; redirects++) { response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(12_000), headers: { "user-agent": "RolePilot/1.0 resume matching assistant", accept: "text/html,application/xhtml+xml" } }); if (![301, 302, 303, 307, 308].includes(response.status)) break; const location = response.headers.get("location"); if (!location) throw new Error("The job URL redirected without a destination."); url = await safeUrl(new URL(location, url).toString()); }
  if (!response?.ok) throw new Error(`Could not read the job page (${response?.status || "network error"}).`);
  if (!(response.headers.get("content-type") || "").includes("text/html")) throw new Error("The job URL did not return an HTML page.");
  if (Number(response.headers.get("content-length") || 0) > MAX_HTML) throw new Error("The job page is too large to analyze safely.");
  const html = await response.text(); if (html.length > MAX_HTML) throw new Error("The job page is too large to analyze safely.");
  const $ = cheerio.load(html); let roleTitle = $("h1").first().text().trim(); let description = "";
  $('script[type="application/ld+json"]').each((_, element) => { if (description) return; try { const parsed = JSON.parse($(element).text()); const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] || [parsed]; const job = nodes.find((node: Record<string, unknown>) => node?.["@type"] === "JobPosting"); if (job) { description = String(job.description || ""); roleTitle = String(job.title || roleTitle); } } catch { /* ignore malformed metadata */ } });
  if (description) description = cheerio.load(description).text();
  if (!description) { $("script,style,noscript,svg,nav,header,footer").remove(); description = $("main,article,[role=main]").first().text() || $("body").text(); }
  description = description.replace(/\s+/g, " ").trim().slice(0, 35_000);
  if (description.length < 300) throw new Error("The job page did not expose enough description text. Add the backup job description and retry.");
  return { roleTitle: roleTitle.slice(0, 180), description, resolvedUrl: url.toString() };
}
