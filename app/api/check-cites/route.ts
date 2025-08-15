import { NextRequest, NextResponse } from "next/server";
import { CheckCitesSchema } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CL_URL = "https://www.courtlistener.com/api/rest/v3/citation-lookup/";

// 15s timeout for upstream call
async function fetchWithTimeout(input: RequestInfo, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 15000, ...rest } = init;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // @ts-expect-error Type narrowing for Node fetch
    const res = await fetch(input, { ...rest, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = CheckCitesSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { text } = parsed.data;

    const body = new URLSearchParams({ text });
    const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };

    const token = process.env.COURTLISTENER_API_TOKEN?.trim();
    if (token) headers["Authorization"] = `Token ${token}`;

    const res = await fetchWithTimeout(CL_URL, {
      method: "POST",
      headers,
      body,
      timeoutMs: 15000
    });

    // Handle upstream non-2xx with best-effort message passthrough
    const raw = await res.text();
    const maybeJson = (() => {
      try { return JSON.parse(raw); } catch { return null; }
    })();

    if (!res.ok) {
      const detail = typeof maybeJson === "object" && maybeJson && "detail" in maybeJson ? (maybeJson as any).detail : raw.slice(0, 500);
      const status = res.status === 429 ? 503 : res.status; // surface as retryable if rate-limited
      return NextResponse.json({ error: `CourtListener error: ${detail || res.statusText}` }, { status });
    }

    const arr = Array.isArray(maybeJson) ? maybeJson : (maybeJson?.results ?? []);
    if (!Array.isArray(arr)) {
      return NextResponse.json({ error: "Unexpected response format from CourtListener." }, { status: 502 });
    }

    // Normalize each object to the shape the UI expects
    const results = arr.map((r: any) => ({
      citation: r?.citation ?? "",
      normalized_citations: r?.normalized_citations ?? [],
      start_index: r?.start_index ?? null,
      end_index: r?.end_index ?? null,
      status: typeof r?.status === "number" ? r.status : 0,
      error_message: r?.error_message ?? "",
      clusters: Array.isArray(r?.clusters) ? r.clusters : []
    }));

    // No caching for API responses
    return NextResponse.json({ results }, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "Upstream timeout." : (err?.message || "Server error.");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
