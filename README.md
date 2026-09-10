# RolePilot — AI Job Application Copilot

A focused, browser-based MVP that turns a job description and candidate profile into an explainable fit score, honest skill gaps, resume suggestions, a recruiter message, a tailored cover letter, and a device-local application tracker.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Architecture

- Next.js, React, and TypeScript
- free, explainable browser-side analysis for a testable MVP
- browser `localStorage` for saved applications

A production iteration can replace `analyzeJobLocally()` with OpenAI or Azure OpenAI structured output while preserving the UI and response shape.

## Production

Every push to `main` builds and deploys the static application to GitHub Pages through `.github/workflows/deploy-pages.yml`.

## MVP guardrails

- Never invent candidate experience.
- Show gaps instead of hiding them.
- Keep application data on the current device.
- No authentication, database, scraping, or auto-applying in v1.

## Validation

Use it for 10 real applications. Measure tailoring time and recruiter response rate before adding integrations.
