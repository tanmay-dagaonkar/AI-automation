"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, FileText, KeyRound, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, Target, UploadCloud } from "lucide-react";
import type { ApplicationResult, PublicApplication, SubmissionReceipt } from "@/lib/types";

type View = "submit" | "results" | "dashboard";
type SavedReceipt = SubmissionReceipt & { trackingToken: string };
const statusLabel: Record<PublicApplication["status"], string> = { pending_approval: "Waiting for approval", processing: "Analyzing", completed: "Ready", failed: "Needs attention", rejected: "Not approved" };

function ResultCard({ result }: { result: ApplicationResult }) {
  return <section className="resultCard">
    <div className="resultTop"><div><p className="eyebrow">MATCH ANALYSIS</p><h2>{result.roleTitle || "Resume review"}</h2><p>{result.summary}</p></div><div className={`score score${Math.floor(result.score / 20)}`}><strong>{result.score}</strong><span>/100</span></div></div>
    <div className="matchGrid"><div><h3>Strong matches</h3><div className="tags">{result.matchedSkills.map(skill => <span className="good" key={skill}>{skill}</span>)}</div></div><div><h3>Missing or unclear</h3><div className="tags">{result.missingSkills.map(skill => <span className="gap" key={skill}>{skill}</span>)}</div></div></div>
    <div className="recommendations"><h3>Resume improvements</h3><ol>{result.improvements.map(item => <li key={item}>{item}</li>)}</ol></div>
    {result.rewrittenBullets.length > 0 && <div className="recommendations"><h3>Suggested bullet rewrites</h3><ul>{result.rewrittenBullets.map(item => <li key={item}>{item}</li>)}</ul></div>}
    <p className="disclaimer">AI guidance can miss context. Review every suggestion before changing or submitting a resume.</p>
  </section>;
}

export default function Home() {
  const [view, setView] = useState<View>("submit");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [myApplications, setMyApplications] = useState<PublicApplication[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminRows, setAdminRows] = useState<PublicApplication[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState("");

  useEffect(() => { try { setReceipts(JSON.parse(localStorage.getItem("rolepilot-receipts") || "[]")); setAdminKey(sessionStorage.getItem("rolepilot-admin-key") || ""); } catch { /* ignore damaged local state */ } }, []);
  const readyCount = useMemo(() => myApplications.filter(item => item.status === "completed").length, [myApplications]);

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage(""); const form = event.currentTarget;
    try {
      const response = await fetch("/api/applications", { method: "POST", body: new FormData(form) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Upload failed.");
      const next: SavedReceipt[] = [{ ...payload, trackingToken: payload.trackingToken }, ...receipts].slice(0, 20);
      setReceipts(next); localStorage.setItem("rolepilot-receipts", JSON.stringify(next)); form.reset(); setMessage("Uploaded securely. Your review is now waiting for approval."); setView("results"); await loadMyResults(next);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); } finally { setSubmitting(false); }
  }

  async function loadMyResults(items = receipts) {
    setLoadingResults(true);
    try {
      const rows = await Promise.all(items.map(async receipt => { const response = await fetch(`/api/applications/${receipt.id}?token=${encodeURIComponent(receipt.trackingToken)}`, { cache: "no-store" }); return response.ok ? response.json() as Promise<PublicApplication> : null; }));
      setMyApplications(rows.filter((row): row is PublicApplication => Boolean(row)));
    } finally { setLoadingResults(false); }
  }

  async function loadDashboard() {
    if (!adminKey) return setMessage("Enter the dashboard key first."); setAdminLoading(true); setMessage("");
    try { const response = await fetch("/api/applications", { headers: { "x-admin-key": adminKey }, cache: "no-store" }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Could not load dashboard."); sessionStorage.setItem("rolepilot-admin-key", adminKey); setAdminRows(payload.applications); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not load dashboard."); } finally { setAdminLoading(false); }
  }

  async function analyzeNow(id: string) {
    setAnalyzingId(id); setMessage("");
    try { const response = await fetch(`/api/applications/${id}/analyze`, { method: "POST", headers: { "x-admin-key": adminKey } }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Analysis failed."); await loadDashboard(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Analysis failed."); } finally { setAnalyzingId(""); }
  }

  return <main className="appShell"><aside className="sidebar"><div className="brand"><span><Target size={20}/></span>RolePilot</div><nav aria-label="Main navigation"><button className={view === "submit" ? "active" : ""} onClick={() => setView("submit")}><UploadCloud/>Submit resume</button><button className={view === "results" ? "active" : ""} onClick={() => { setView("results"); loadMyResults(); }}><FileText/>My results</button><button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BriefcaseBusiness/>Lead dashboard</button></nav><div className="secureNote"><ShieldCheck/><span><strong>Private by design</strong>Resume files and extracted text never appear in public responses.</span></div></aside>
    <section className="workspace"><header className="topbar"><div><p className="eyebrow">AI JOB APPLICATION REVIEW</p><h1>{view === "submit" ? "Upload once. Improve with evidence." : view === "results" ? "Your application reviews" : "Review queue"}</h1></div><span className="systemStatus"><i/>MongoDB workflow</span></header>{message && <div className="notice" role="status">{message}</div>}
    {view === "submit" && <div className="submitLayout"><form className="panel uploadForm" onSubmit={submitApplication}><div className="step"><span>01</span><div><h2>Candidate details</h2><p>Used only to identify this review in the dashboard.</p></div></div><div className="twoCols"><label>Full name<input name="applicantName" required maxLength={100} placeholder="Your name"/></label><label>Email<input name="applicantEmail" type="email" required maxLength={200} placeholder="you@example.com"/></label></div><label>Job description URL<input name="jobUrl" type="url" required placeholder="https://company.com/jobs/role"/></label><label>Resume PDF<div className="fileDrop"><UploadCloud/><div><strong>Choose a PDF resume</strong><span>Maximum 4 MB</span></div><input name="resume" type="file" accept="application/pdf,.pdf" required/></div></label><label>Backup job description <small>Optional, useful when a job site blocks automated access.</small><textarea name="fallbackJobDescription" rows={5} minLength={80} placeholder="Paste the job description here if the URL requires a login…"/></label><label>Submission access code <small>Only required if the owner enabled one.</small><input name="accessCode" type="password" autoComplete="off" placeholder="Optional"/></label><label className="consent"><input name="consent" type="checkbox" value="yes" required/><span>I consent to storing and analyzing this resume for job-application feedback.</span></label><button className="primary" disabled={submitting}>{submitting ? <><LoaderCircle className="spin"/>Uploading…</> : <>Submit for review <ArrowRight/></>}</button></form>
    <section className="processCard"><p className="eyebrow">WHAT HAPPENS NEXT</p><h2>A small, controlled workflow</h2><ol><li><span><UploadCloud/></span><div><strong>Stored securely</strong><p>The original PDF, extracted text, and job URL are saved in MongoDB.</p></div></li><li><span><Clock3/></span><div><strong>Approval requested</strong><p>ChatGPT checks the queue hourly and asks before analysis begins.</p></div></li><li><span><Sparkles/></span><div><strong>Evidence-based review</strong><p>The public job description and resume are compared without inventing experience.</p></div></li><li><span><CheckCircle2/></span><div><strong>Results published</strong><p>The score and practical improvements appear under My results.</p></div></li></ol></section></div>}
    {view === "results" && <section className="resultsPage"><div className="sectionHead"><div><h2>Tracked submissions</h2><p>Tracking keys stay only in this browser.</p></div><button className="secondary" onClick={() => loadMyResults()} disabled={loadingResults}><RefreshCw className={loadingResults ? "spin" : ""}/>Refresh</button></div>{receipts.length === 0 ? <div className="panel emptyState"><FileText/><h2>No submissions yet</h2><p>Upload a resume and its first status will appear here.</p><button className="primary compact" onClick={() => setView("submit")}>Submit a resume</button></div> : <><div className="miniStats"><article><strong>{receipts.length}</strong><span>Submitted</span></article><article><strong>{readyCount}</strong><span>Ready</span></article><article><strong>{receipts.length - readyCount}</strong><span>In progress</span></article></div><div className="resultList">{myApplications.map(item => <article className="panel submission" key={item.id}><div className="submissionHead"><div><p>{item.applicantName}</p><h2>{item.fileName}</h2><a href={item.jobUrl} target="_blank" rel="noreferrer">View job post</a></div><span className={`badge ${item.status}`}>{statusLabel[item.status]}</span></div>{item.status === "failed" && <p className="errorText">{item.error || "The analysis could not be completed."}</p>}{item.result && <ResultCard result={item.result}/>}</article>)}</div></>}</section>}
    {view === "dashboard" && <section className="dashboardPage"><div className="panel keyPanel"><div><KeyRound/><div><h2>Owner access</h2><p>Use the same value configured as <code>ADMIN_KEY</code> on the server.</p></div></div><div><input value={adminKey} onChange={event => setAdminKey(event.target.value)} type="password" placeholder="Dashboard key"/><button className="primary compact" onClick={loadDashboard} disabled={adminLoading}>{adminLoading ? <LoaderCircle className="spin"/> : "Open dashboard"}</button></div></div>{adminRows.length > 0 && <div className="panel tableWrap"><table><thead><tr><th>Candidate</th><th>Job URL</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead><tbody>{adminRows.map(item => <tr key={item.id}><td><strong>{item.applicantName}</strong><span>{item.applicantEmail}</span></td><td><a href={item.jobUrl} target="_blank" rel="noreferrer">Open job</a></td><td><span className={`badge ${item.status}`}>{statusLabel[item.status]}</span></td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td>{item.status === "pending_approval" || item.status === "failed" ? <button className="analyzeButton" onClick={() => analyzeNow(item.id)} disabled={Boolean(analyzingId)}>{analyzingId === item.id ? <LoaderCircle className="spin"/> : <Sparkles/>}Approve & analyze</button> : item.result ? <strong>{item.result.score}/100</strong> : "—"}</td></tr>)}</tbody></table></div>}</section>}</section></main>;
}
