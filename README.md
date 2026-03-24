# CiteCheck

Verify Bluebook-style case citations using CourtListener's Citation Lookup & Verification API.

## Features

- **Three-tier citation classification:**
  - **Verified (green):** Volume, reporter, page, and year all confirmed against CourtListener's database.
  - **Needs Attention (orange):** Citation found but something is off — year mismatch, ambiguous reporter, unrecognized reporter abbreviation, or non-precedential opinion.
  - **Not Found (red):** No matching case in the database. May indicate a hallucinated or incorrect citation.
- **Hover tooltips** with case name, decision date, parallel citations, and detailed explanations.
- **Inline linkified text** with color-coded citations linked to CourtListener.
- **FAQ sidebar** explaining supported formats, jurisdiction coverage, verification methodology, and data privacy.

## Quick start

```bash
pnpm i  # or npm i / yarn
cp .env.example .env.local  # set COURTLISTENER_API_TOKEN
pnpm dev
```

Open http://localhost:3000

Paste text with citations → Check Cites

## Configuration

- `COURTLISTENER_API_TOKEN` — get a token from [CourtListener](https://www.courtlistener.com) and keep it server-side.
- `MAX_INPUT_CHARS` — default 64,000.

## How it works

The server route posts your text to CourtListener's Citation Lookup API:

```
POST https://www.courtlistener.com/api/rest/v4/citation-lookup/
Content-Type: application/x-www-form-urlencoded
Body: text=<your_text>
```

Each citation in the response is classified into one of three tiers:

| Tier | Condition |
|------|-----------|
| **Verified** | `status 200`, single matching cluster, and year matches (if provided) |
| **Needs Attention** | `status 200` with year mismatch, `status 300` (ambiguous reporter), `status 400` (unrecognized reporter), or unpublished opinion |
| **Not Found** | `status 404` or no matching clusters |

### What CiteCheck verifies

CiteCheck validates citations by **volume, reporter, and page number**, plus the publication year when present. It does **not** verify case names, quoted holdings, or whether the case is still good law.

The case name returned by CourtListener is displayed alongside each result so users can manually confirm the citation points to the expected case.

### Coverage

Citations are verified against CourtListener's database of 10M+ opinions across 3,300+ courts. Coverage is strongest for federal courts and state appellate courts. Older state court opinions and unpublished decisions may have gaps. A "not found" result does not necessarily mean a citation is fabricated.

### Privacy

User text is not stored by CiteCheck and is not submitted to any AI model. Text is sent only to CourtListener's API, operated by the Free Law Project (a 501(c)(3) nonprofit), which does not track API queries.

## Hosting

Currently deployed on Vercel as a Next.js application.
