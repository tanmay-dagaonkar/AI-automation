"use client";
import {FormEvent,useEffect,useMemo,useState} from "react";
import {ArrowRight,BriefcaseBusiness,Check,Clipboard,FileSearch,LoaderCircle,Plus,Sparkles,Target} from "lucide-react";
import {analyzeJobLocally} from "@/lib/analyze";

type Status="Analyzed"|"Applied"|"Interview";
type Analysis={score:number;matchedSkills:string[];missingSkills:string[];summary:string;coverLetter:string;recruiterMessage:string;resumeSuggestions:string[]};
type Application=Analysis&{id:string;role:string;company:string;status:Status;createdAt:string};
const samples:Application[]=[
 {id:"sample-1",role:"Senior Software Engineer",company:"Mastercard",status:"Interview",createdAt:"09 Sep",score:82,matchedSkills:["React","Java","Spring Boot"],missingSkills:["Oracle SQL"],summary:"Strong full-stack alignment.",coverLetter:"",recruiterMessage:"",resumeSuggestions:[]},
 {id:"sample-2",role:"Java Fullstack React Lead",company:"Wipro",status:"Applied",createdAt:"06 Sep",score:91,matchedSkills:["React","Java","Microservices"],missingSkills:["Team size evidence"],summary:"Excellent technical match.",coverLetter:"",recruiterMessage:"",resumeSuggestions:[]}
];
const defaultProfile="6.5 years in full-stack development. React, TypeScript, Angular, Java 8, Spring Boot, microservices, Hibernate/JPA, MySQL, REST APIs, AWS, Azure OpenAI, Gemini Live API, multilingual voice AI, CI/CD. Tech Lead experience delivering customer-facing products and guiding engineers.";
const tone=(score:number)=>score>=80?"high":score>=65?"medium":"low";

export default function Home(){
 const [apps,setApps]=useState<Application[]>(samples),[role,setRole]=useState(""),[company,setCompany]=useState(""),[jd,setJd]=useState(""),[profile,setProfile]=useState(defaultProfile);
 const [analysis,setAnalysis]=useState<Analysis|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(""),[copied,setCopied]=useState("");
 useEffect(()=>{const saved=localStorage.getItem("rolepilot-applications");if(saved)setApps(JSON.parse(saved))},[]);
 const stats=useMemo(()=>({tracked:apps.length,interviews:apps.filter(a=>a.status==="Interview").length,average:apps.length?Math.round(apps.reduce((s,a)=>s+a.score,0)/apps.length):0}),[apps]);
 async function analyze(e:FormEvent){e.preventDefault();setError("");setLoading(true);setAnalysis(null);try{await new Promise(r=>setTimeout(r,450));setAnalysis(analyzeJobLocally(role,company,jd,profile))}catch(e){setError(e instanceof Error?e.message:"Could not analyze this job.")}finally{setLoading(false)}}
 function save(){if(!analysis)return;const next=[{...analysis,id:crypto.randomUUID(),role,company,status:"Analyzed" as Status,createdAt:new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short"}).format(new Date())},...apps.filter(a=>!a.id.startsWith("sample-"))];setApps(next);localStorage.setItem("rolepilot-applications",JSON.stringify(next));setAnalysis(null);setRole("");setCompany("");setJd("")}
 function advance(id:string){const flow:Status[]=["Analyzed","Applied","Interview"];const next=apps.map(a=>a.id===id?{...a,status:flow[(flow.indexOf(a.status)+1)%flow.length]}:a);setApps(next);localStorage.setItem("rolepilot-applications",JSON.stringify(next))}
 async function copy(text:string,label:string){await navigator.clipboard.writeText(text);setCopied(label);setTimeout(()=>setCopied(""),1300)}
 return <main className="shell">
  <aside><div className="brand"><b><Target size={19}/></b><span>RolePilot</span></div><nav><a href="#analyze" className="active"><Sparkles/>Analyze job</a><a href="#applications"><BriefcaseBusiness/>Applications</a></nav><div className="person"><i>TD</i><span><strong>Tanmay</strong><small>Full-stack developer</small></span></div></aside>
  <section className="workspace">
   <header><div><p className="eyebrow">JOB APPLICATION COPILOT</p><h1>Turn a job post into an action plan.</h1></div><span className="privacy">● Saved on this device</span></header>
   <section className="stats"><article><FileSearch/><div><strong>{stats.tracked}</strong><span>Roles tracked</span></div></article><article><Target/><div><strong>{stats.average}%</strong><span>Average fit</span></div></article><article><BriefcaseBusiness/><div><strong>{stats.interviews}</strong><span>Interviews</span></div></article></section>
   <div className="grid" id="analyze">
    <form className="panel form" onSubmit={analyze}><div className="panelHead"><div><em>01</em><h2>New opportunity</h2></div><p>Paste the role details and get a focused application pack.</p></div>
     <div className="two"><label>Job title<input required value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Senior Software Engineer"/></label><label>Company<input required value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g. Mastercard"/></label></div>
     <label>Job description<textarea required minLength={80} value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the complete job description here…" rows={8}/></label>
     <label>Your experience summary<textarea required minLength={40} value={profile} onChange={e=>setProfile(e.target.value)} rows={5}/></label>
     {error&&<p className="error">{error}</p>}<button className="primary" disabled={loading}>{loading?<><LoaderCircle className="spin"/>Analyzing fit…</>:<>Analyze opportunity <ArrowRight/></>}</button>
    </form>
    <section className="panel result" aria-live="polite">{!analysis?<div className="empty"><i><Sparkles/></i><h2>Your application pack appears here</h2><p>Get a fit score, evidence-based gaps, resume changes, a cover letter, and a recruiter message.</p><ul><li><Check/>No invented experience</li><li><Check/>Specific to the job post</li><li><Check/>Ready to edit and send</li></ul></div>:
     <div className="analysis"><div className="resultHead"><div><p className="eyebrow">FIT ANALYSIS</p><h2>{role} <span>at {company}</span></h2></div><div className={"score "+tone(analysis.score)}><strong>{analysis.score}</strong><small>/100</small></div></div><p className="summary">{analysis.summary}</p>
      <div className="skills"><div><h3>Strong matches</h3>{analysis.matchedSkills.map(s=><span className="matched" key={s}>{s}</span>)}</div><div><h3>Gaps to address</h3>{analysis.missingSkills.map(s=><span className="missing" key={s}>{s}</span>)}</div></div>
      <div className="block"><h3>Resume changes</h3><ol>{analysis.resumeSuggestions.map(s=><li key={s}>{s}</li>)}</ol></div>
      <div className="block"><div><h3>Recruiter message</h3><button type="button" onClick={()=>copy(analysis.recruiterMessage,"message")}><Clipboard/>{copied==="message"?"Copied":"Copy"}</button></div><p>{analysis.recruiterMessage}</p></div>
      <div className="block cover"><div><h3>Cover letter</h3><button type="button" onClick={()=>copy(analysis.coverLetter,"letter")}><Clipboard/>{copied==="letter"?"Copied":"Copy"}</button></div><p>{analysis.coverLetter}</p></div>
      <button className="save" onClick={save}><Plus/>Save to application board</button>
     </div>}</section>
   </div>
   <section className="applications" id="applications"><div className="sectionHead"><div><em>02</em><h2>Application board</h2></div><p>Click a status to move it forward.</p></div><div className="tableWrap"><table><thead><tr><th>Role</th><th>Company</th><th>Fit</th><th>Key gap</th><th>Status</th><th>Added</th></tr></thead><tbody>{apps.map(a=><tr key={a.id}><td><strong>{a.role}</strong></td><td>{a.company}</td><td><b className={tone(a.score)}>{a.score}%</b></td><td>{a.missingSkills[0]||"—"}</td><td><button className={"status "+a.status.toLowerCase()} onClick={()=>advance(a.id)}>{a.status}</button></td><td>{a.createdAt}</td></tr>)}</tbody></table></div></section>
  </section>
 </main>
}
