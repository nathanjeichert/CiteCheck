"use client";

import { useState } from "react";
import Spinner from "../components/Spinner";
import CiteResults, { type CiteResult } from "../components/CiteResults";
import LinkifiedText from "../components/LinkifiedText";
import FAQ from "../components/FAQ";
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
        body: JSON.stringify({ text }),
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
    <div className="min-h-full flex flex-col">
      {/* Nav bar */}
      <nav className="sticky top-0 z-10 bg-warm-white border-b border-warm-border">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-6 py-3">
          <span className="font-serif text-xl font-bold text-warm-text tracking-tight">
            CiteCheck
          </span>
          <div className="flex items-center gap-4 text-sm text-warm-muted">
            <a
              href="https://github.com/nathaneichert"
              target="_blank"
              rel="noreferrer"
              className="hover:text-warm-accent transition-colors"
            >
              GitHub
            </a>
            <span className="text-warm-dim">by Nathan Eichert</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto w-full max-w-2xl px-6 pt-14 pb-12 flex-1">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-serif text-[28px] font-bold text-warm-text leading-tight">
              CiteCheck
            </h1>
            <p className="mt-2 text-[15px] text-warm-muted leading-relaxed">
              Paste text with Bluebook citations to verify them against CourtListener.
            </p>
          </div>

          <FAQ />

          {/* Textarea */}
          <div>
            <textarea
              aria-label="Text containing legal citations"
              className="w-full min-h-[220px] rounded-lg bg-warm-white text-warm-body text-sm leading-relaxed
                         border-[1.5px] border-warm-border p-4 font-sans
                         placeholder:text-warm-dim
                         focus:border-warm-accent focus:outline-none focus:ring-1 focus:ring-warm-accent/20
                         transition-colors"
              placeholder="Paste your text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-1.5 flex items-center justify-between text-xs text-warm-dim">
              <span>
                {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()} characters
              </span>
              {over && (
                <span className="text-warm-red font-medium">Over limit</span>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCheck}
              disabled={loading || !text.trim() || over}
              className="inline-flex items-center gap-2 rounded-md bg-warm-accent px-5 py-2.5 text-sm font-medium text-white
                         hover:bg-warm-accent-light disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-accent
                         transition-colors"
              aria-label="Check citations"
            >
              {loading ? (
                <>
                  <Spinner /> Checking...
                </>
              ) : (
                "Check Cites"
              )}
            </button>
            {(text || results) && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-md border border-warm-border px-5 py-2.5 text-sm font-medium text-warm-body
                           bg-transparent hover:bg-warm-white hover:border-warm-border-hover
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-accent/40
                           transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-warm-red-bg p-4 text-sm text-warm-red"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              <CiteResults results={results} sourceText={text} />

              {/* Linkified Text */}
              <details className="rounded-lg border border-warm-border bg-warm-white overflow-hidden">
                <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-warm-body hover:bg-warm-subtle transition-colors">
                  Linkified Text (found citations)
                </summary>
                <div className="border-t border-warm-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-warm-body cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showNotFound}
                        onChange={(e) => setShowNotFound(e.target.checked)}
                        className="rounded"
                      />
                      Highlight not-found citations
                    </label>
                  </div>
                  <div className="mt-3 rounded-lg bg-warm-subtle p-4">
                    <LinkifiedText
                      text={text}
                      results={results}
                      linkOnlyFound={!showNotFound}
                      highlightNotFound={showNotFound}
                    />
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-border py-6">
        <p className="text-center text-xs text-warm-dim">
          Powered by{" "}
          <a
            href="https://www.courtlistener.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-warm-muted transition-colors"
          >
            CourtListener
          </a>
        </p>
      </footer>
    </div>
  );
}
