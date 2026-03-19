"use client";

import { useState } from "react";
import Spinner from "../components/Spinner";
import CiteResults, { type CiteResult } from "../components/CiteResults";
import LinkifiedText from "../components/LinkifiedText";
import CitationHelp from "../components/CitationHelp";
import { MAX_INPUT_CHARS } from "../lib/validation";

export default function Page() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CiteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const over = text.length > MAX_INPUT_CHARS;

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Request failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function onClear() {
    setText("");
    setResults(null);
    setError(null);
    setShowNotFound(false);
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">CiteCheck</h1>
      <p className="text-sm text-zinc-600">
        Paste text with Bluebook citations and click <strong>Check Cites</strong>.
      </p>
      <CitationHelp />
      <textarea
        aria-label="Text containing legal citations"
        className="w-full min-h-[220px] rounded-xl border p-3"
        placeholder="Paste your text…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between text-sm text-zinc-600">
        <span>Characters: {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}</span>
        {over && <span className="text-red-700 font-medium">Over limit</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCheck}
          disabled={loading || !text.trim() || over}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-label="Check citations"
        >
          {loading ? (<><Spinner /> Checking…</>) : "Check Cites"}
        </button>
        {(text || results) && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-red-700" role="alert">Error: {error}</p>}
      {results && (
        <div className="space-y-4">
          <CiteResults results={results} />
          <details className="rounded-xl border p-3">
            <summary className="cursor-pointer select-none text-sm text-zinc-700">
              Linkified Text (found citations)
            </summary>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNotFound}
                  onChange={(e) => setShowNotFound(e.target.checked)}
                />
                Highlight not-found citations
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
