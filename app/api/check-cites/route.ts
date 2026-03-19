import { NextRequest, NextResponse } from "next/server";
import { CheckCitesSchema } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CL_URL = "https://www.courtlistener.com/api/rest/v4/citation-lookup/";

async function fetchWithTimeout(input: RequestInfo, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 15_000, ...rest } = init;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: ctrl.signal });
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

    const token = process.env.COURTLISTENER_API_TOKEN?.trim();
    if (!token) {
      console.warn("[CiteCheck] COURTLISTENER_API_TOKEN is not set — requests may be rate-limited or rejected.");
    }

    const body = new URLSearchParams({ text });
    const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
    if (token) headers["Authorization"] = `Token ${token}`;

    const res = await fetchWithTimeout(CL_URL, {
      method: "POST",
      headers,
      body,
      timeoutMs: 15_000
    });

    const raw = await res.text();
    let maybeJson: unknown;
    try { maybeJson = JSON.parse(raw); } catch { maybeJson = null; }

    if (!res.ok) {
      if (res.status === 429) {
        return NextResponse.json(
          { error: "Citation service is rate-limited. Please wait a moment and try again." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Citation service returned an error. Please try again later." },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const obj = maybeJson as Record<string, unknown> | unknown[] | null;
    const arr = Array.isArray(obj) ? obj : (obj && typeof obj === "object" && "results" in obj ? (obj as Record<string, unknown>).results : []);
    if (!Array.isArray(arr)) {
      return NextResponse.json({ error: "Unexpected response format from citation service." }, { status: 502 });
    }

    const results = (arr as Record<string, unknown>[]).map((r) => ({
      citation: typeof r.citation === "string" ? r.citation : "",
      normalized_citations: Array.isArray(r.normalized_citations) ? r.normalized_citations : [],
      start_index: typeof r.start_index === "number" ? r.start_index : null,
      end_index: typeof r.end_index === "number" ? r.end_index : null,
      status: typeof r.status === "number" ? r.status : 0,
      error_message: typeof r.error_message === "string" ? r.error_message : "",
      clusters: Array.isArray(r.clusters) ? r.clusters : []
    }));

    return NextResponse.json({ results }, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out. Please try again." }, { status: 504 });
    }
    const msg = err instanceof Error ? err.message : "Server error.";
    console.error("[CiteCheck] Unexpected error:", msg);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
