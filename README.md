# CiteCheck

Verify Bluebook-style case citations using CourtListener’s Citation Lookup & Verification API.

## Quick start

```bash
pnpm i  # or npm i / yarn
cp .env.example .env.local  # set COURTLISTENER_API_TOKEN
pnpm dev
```

Open http://localhost:3000

Paste text with citations → Check Cites

## Configuration
- COURTLISTENER_API_TOKEN — get a token from CourtListener and keep it server-side.
- MAX_INPUT_CHARS — default 64,000.

## How it works
The server route posts your text to:

```
POST https://www.courtlistener.com/api/rest/v3/citation-lookup/
Content-Type: application/x-www-form-urlencoded
Body: text=<your_text>
```

A citation counts as found only if `status === 200` and `clusters.length > 0`.

### Notes
- Endpoint & method: `POST /api/rest/v3/citation-lookup/`.
- Body format: `application/x-www-form-urlencoded` with `text` key.
- Response handling: Expect an array; handle `{ results: [...] }` just in case.
- Input size: Enforced ~64k characters per FLP guidance.

### Hosting note (path vs subdomain)
- Cloud Run domain mappings support domains/subdomains, not base-path routing. Use a load balancer URL map or have your main app proxy `/citecheck/*` to the service if you want a path like `/citecheck`.

---

### Hand-off checklist
1. Create repo, add files, set `COURTLISTENER_API_TOKEN` in `.env.local`.
2. `npm i && npm run dev` to test locally.
3. Deploy to Cloud Run using the Dockerfile.
4. Map either `citecheck.yourdomain.com` (simple) or front with a load balancer for `/citecheck/*` path routing.

If you want, we can also add a tiny linkifier that re-renders your pasted text with inline anchors using `start_index`/`end_index` for debugging.
Now included: open the “Linkified Text (found citations)” panel after running a check to see inline links to CourtListener where matches were found.
