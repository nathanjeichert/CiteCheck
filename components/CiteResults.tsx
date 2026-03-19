"use client";

import { useState } from "react";

type Cluster = { absolute_url?: string; id?: number; caseName?: string | null };
export type CiteResult = {
  citation: string;
  normalized_citations?: string[];
  start_index?: number;
  end_index?: number;
  status: number;
  error_message?: string;
  clusters?: Cluster[];
};

export default function CiteResults({ results }: { results: CiteResult[] }) {
  const [copied, setCopied] = useState(false);
  const failed = results.filter(
    (r) => r.status !== 200 || !r.clusters || r.clusters.length === 0
  );
  const found = results.filter(
    (r) => r.status === 200 && r.clusters && r.clusters.length > 0
  );
  const allGood = results.length > 0 && failed.length === 0;

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-warm-border bg-warm-yellow-bg p-4 text-sm text-warm-yellow">
        No citations detected.
      </div>
    );
  }

  async function copyResults() {
    const lines: string[] = [];
    if (found.length > 0) {
      lines.push(`FOUND (${found.length}):`);
      found.forEach((r) => {
        const norm = r.normalized_citations?.[0] ?? r.citation;
        const url = r.clusters?.[0]?.absolute_url
          ? `https://www.courtlistener.com${r.clusters[0].absolute_url}`
          : "";
        lines.push(`  ${norm}${url ? ` — ${url}` : ""}`);
      });
    }
    if (failed.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push(`NOT FOUND (${failed.length}):`);
      failed.forEach((r) => {
        lines.push(
          `  ${r.citation}${r.error_message ? ` — ${r.error_message}` : ""}`
        );
      });
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  }

  return (
    <section className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg bg-[rgba(30,58,95,0.06)] px-4 py-3">
        <p className="text-sm font-medium text-warm-accent">
          {found.length} of {results.length} citation
          {results.length !== 1 ? "s" : ""} verified
        </p>
        <button
          type="button"
          onClick={copyResults}
          className="text-sm text-warm-muted underline hover:text-warm-accent transition-colors"
        >
          {copied ? "Copied!" : "Copy results"}
        </button>
      </div>

      {allGood ? (
        <div className="rounded-lg border border-green-200 bg-warm-green-bg p-4 text-sm font-medium text-warm-green">
          All citations found.
        </div>
      ) : (
        <>
          {/* Not Found section */}
          {failed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-warm-dim">
                Not Found
              </h2>
              <div className="space-y-2">
                {failed.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-warm-border bg-warm-white p-4"
                  >
                    <span className="mt-0.5 text-warm-red font-bold text-sm select-none flex-shrink-0">
                      ✕
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-warm-body break-words">
                        {r.citation}
                      </p>
                      {r.error_message && (
                        <p className="mt-1 text-xs text-warm-dim">
                          {r.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Found section */}
      {found.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-warm-dim">
            Found
          </h2>
          <div className="space-y-2">
            {found.map((r, i) => {
              const norm = r.normalized_citations?.[0] ?? r.citation;
              const url = r.clusters?.[0]?.absolute_url
                ? `https://www.courtlistener.com${r.clusters[0].absolute_url}`
                : undefined;
              return (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg border border-warm-border bg-warm-white p-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 text-warm-green font-bold text-sm select-none flex-shrink-0">
                      ✓
                    </span>
                    <p className="text-sm text-warm-body break-words">{norm}</p>
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 text-sm font-medium text-warm-accent hover:text-warm-accent-light transition-colors whitespace-nowrap"
                    >
                      View →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
