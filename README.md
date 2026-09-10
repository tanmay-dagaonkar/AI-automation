# RolePilot

A deliberately small resume-review workflow:

1. A candidate uploads a PDF resume and public job-description URL.
2. The PDF is stored in MongoDB GridFS; extracted text and metadata are stored in `rolepilot.applications`.
3. The record waits in `pending_approval` until the owner approves it in ChatGPT or the dashboard.
4. The public job page is fetched with SSRF and size protections, then compared with the resume.
5. A structured score and practical improvements are stored and shown using a private browser tracking token.

## Run locally

```bash
cp .env.example .env.local
pnpm install --ignore-scripts
pnpm dev
```

Use a MongoDB database user limited to read/write access on `rolepilot`. Resume files are limited to text-based PDFs up to 4 MB so the multipart request stays below Vercel's function payload limit.

## Deploy

This version requires a server and cannot run on GitHub Pages. Import the repository into Vercel, set the `.env.example` variables, and deploy it as a normal Next.js project. GitHub remains the source repository; Vercel supplies the API runtime and secrets.

For MongoDB Atlas, allow the hosting provider's outbound network access and use a strong app-specific password. Never put connection strings or API keys in GitHub.

## ChatGPT approval workflow

The hourly check uses the connected MongoDB Atlas account. It finds `rolepilot.applications` records with `status: "pending_approval"` and no `notifiedAt`. The notification includes the record ID, candidate name, and job URL, then asks the owner whether to analyze it.

After the owner says yes, ChatGPT reads `resumeText` and `jobUrl`, retrieves the public job description, produces the `ApplicationResult` shape in `lib/types.ts`, and updates the record to `status: "completed"` with `result` and a current `updatedAt`. If a job site blocks access, use `fallbackJobDescription`. Never infer experience absent from `resumeText`.

## Security boundaries

- Public responses omit resume text, candidate email, stored-file IDs, and credentials.
- Owner listing and server-side analysis require `ADMIN_KEY`.
- Tracking tokens are random and stored only as SHA-256 hashes.
- Job redirects are checked against private and link-local networks.
- This MVP intentionally omits accounts, billing, OCR, and broad file-format support.
