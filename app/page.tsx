"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import CiteResults, { type CiteResult } from "@/components/CiteResults";
import LinkifiedText from "@/components/LinkifiedText";

export default function Page() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CiteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const max = Number(process.env.NEXT_PUBLIC_MAX_INPUT_CHARS || 64000);
  const over = text.length > max;

  async function onCheck() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/check-cites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setResults(data.results as CiteResult[]);
    } catch (e: any) {
      setError(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">CiteCheck</h1>
      <p className="text-sm text-zinc-600">
        Paste text with Bluebook citations and click <strong>Check Cites</strong>.
      </p>
      <textarea
        className="w-full min-h-[220px] rounded-xl border p-3"
        placeholder="Paste your text…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between text-sm text-zinc-600">
        <span>Characters: {text.length.toLocaleString()} / {max.toLocaleString()}</span>
        {over && <span className="text-red-700">Over limit</span>}
      </div>
      <button
        onClick={onCheck}
        disabled={loading || !text.trim() || over}
        className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? (<><Spinner /> Checking…</>) : "Check Cites"}
      </button>

      {error && <p className="text-red-700">Error: {error}</p>}
      {results && (
        <div className="space-y-4">
          <CiteResults results={results} />
          <details className="rounded-xl border p-3">
            <summary className="cursor-pointer select-none text-sm text-zinc-700">
              Linkified Text (found citations)
            </summary>
            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={showNotFound}
                  onChange={(e) => setShowNotFound(e.target.checked)}
                />
                Show “not found” highlights
              </label>
            </div>
            <div className="mt-3 rounded-md bg-zinc-50 p-3">
              <LinkifiedText
                text={text}
                results={results}
                linkOnlyFound={!showNotFound}
                highlightNotFound={showNotFound}
              />
            </div>
          </details>
        </div>
      )}
    </main>
  );
}
