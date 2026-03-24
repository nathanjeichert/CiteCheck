"use client";

import { useState } from "react";

type Cluster = {
  absolute_url?: string;
  id?: number;
  case_name?: string | null;
  caseName?: string | null;
  date_filed?: string | null;
  precedential_status?: string | null;
  citations?: { volume?: number; reporter?: string; page?: string; type?: number }[];
};

export type CiteResult = {
  citation: string;
  normalized_citations?: string[];
  start_index?: number;
  end_index?: number;
  status: number;
  error_message?: string;
  clusters?: Cluster[];
};

export type Tier = "green" | "orange" | "red";

/** Extract a 4-digit year from text near the citation's end_index */
function extractYearFromContext(text: string | undefined, endIndex: number | undefined): number | null {
  if (!text || endIndex == null) return null;
  // Look at the 20 chars after the citation for a parenthetical year
  const window = text.slice(endIndex, endIndex + 20);
  const m = window.match(/\((\d{4})\)/);
  return m ? parseInt(m[1], 10) : null;
}

/** Get the year from a cluster's date_filed */
function clusterYear(cluster: Cluster): number | null {
  if (!cluster.date_filed) return null;
  const y = parseInt(cluster.date_filed.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

/** Get case name from cluster (API may use either key) */
function clusterCaseName(cluster: Cluster): string | null {
  return (cluster.case_name ?? cluster.caseName ?? null) as string | null;
}

/** Words too common in case names to be meaningful for matching */
const STOP_WORDS = new Set([
  "v", "vs", "in", "re", "ex", "rel", "the", "of", "and", "for", "a", "an",
  "city", "county", "state", "states", "united", "board", "department", "dept",
  "commission", "committee", "district", "division", "office", "bureau",
  "inc", "corp", "co", "ltd", "llc", "lp", "na", "al", "et", "no",
]);

/** Extract meaningful words from one side of a "v." split, lowercased, punctuation stripped */
function extractWords(s: string): Set<string> {
  const words = s.toLowerCase().replace(/[.,;:()'"""]/g, "").split(/\s+/).filter(Boolean);
  return new Set(words.filter((w) => w.length > 1 && !STOP_WORDS.has(w)));
}

/** Compare cited case name against API case name.
 *  Returns "match" if we can't parse or both sides overlap,
 *  "partial" if one side has zero overlap, "none" if both sides have zero overlap. */
function compareNames(citedName: string, apiName: string): "match" | "partial" | "none" {
  const splitPattern = /\bv\.?\s/i;
  const citedParts = citedName.split(splitPattern);
  const apiParts = apiName.split(splitPattern);
  if (citedParts.length < 2 || apiParts.length < 2) return "match"; // can't compare, assume ok

  const citedLeft = extractWords(citedParts[0]);
  const citedRight = extractWords(citedParts.slice(1).join(" "));
  const apiLeft = extractWords(apiParts[0]);
  const apiRight = extractWords(apiParts.slice(1).join(" "));

  // If either side has no meaningful words after filtering, skip
  if (citedLeft.size === 0 || citedRight.size === 0) return "match";
  if (apiLeft.size === 0 || apiRight.size === 0) return "match";

  const leftOverlap = [...citedLeft].some((w) => apiLeft.has(w));
  const rightOverlap = [...citedRight].some((w) => apiRight.has(w));

  if (leftOverlap && rightOverlap) return "match";
  if (leftOverlap || rightOverlap) return "partial";
  return "none";
}

/** Try to extract a case name from the source text before the citation's start_index.
 *  Looks for a "Name v. Name," pattern preceding the volume number. */
function extractCitedCaseName(text: string | undefined, startIndex: number | undefined): string | null {
  if (!text || startIndex == null || startIndex === 0) return null;
  // Grab up to 200 chars before the citation
  const before = text.slice(Math.max(0, startIndex - 200), startIndex);
  // Look for "Word(s) v. Word(s)," at the end — the comma typically separates name from cite
  const m = before.match(/([A-Z][A-Za-z.''\-]+(?:\s+[A-Za-z.''\-]+)*\s+v\.?\s+[A-Z][A-Za-z.''\-]+(?:\s+[A-Za-z.''\-]+)*),?\s*$/);
  return m ? m[1].trim() : null;
}

export type ClassifiedCite = {
  result: CiteResult;
  tier: Tier;
  reasons: string[];
  caseName: string | null;
  citedName: string | null;
  year: number | null;
  href: string | null;
  parallelCites: string[];
  namesMismatch: boolean;
};

export function classifyCitations(results: CiteResult[], sourceText?: string): ClassifiedCite[] {
  return results.map((r) => {
    const cluster = r.clusters?.[0];
    const caseName = cluster ? clusterCaseName(cluster) : null;
    const filedYear = cluster ? clusterYear(cluster) : null;
    const citedYear = extractYearFromContext(sourceText, r.end_index ?? undefined);
    const abs = cluster?.absolute_url;
    const href = abs ? `https://www.courtlistener.com${abs}` : null;
    const parallelCites = (cluster?.citations ?? [])
      .map((c) => [c.volume, c.reporter, c.page].filter(Boolean).join(" "))
      .filter(Boolean);

    const reasons: string[] = [];

    const citedName = extractCitedCaseName(sourceText, r.start_index ?? undefined);

    // Red: not found or no clusters
    if (r.status === 404 || (r.status === 200 && (!r.clusters || r.clusters.length === 0))) {
      reasons.push("No matching case found in the CourtListener database");
      return { result: r, tier: "red" as Tier, reasons, caseName: null, citedName, year: null, href: null, parallelCites: [], namesMismatch: false };
    }

    // Status 400: unrecognized reporter
    if (r.status === 400) {
      reasons.push("Unrecognized reporter abbreviation — check for typos");
      if (r.error_message) reasons.push(r.error_message);
      return { result: r, tier: "orange" as Tier, reasons, caseName, citedName, year: filedYear, href, parallelCites, namesMismatch: false };
    }

    // Status 300: ambiguous
    if (r.status === 300) {
      const names = (r.clusters ?? []).map((c) => clusterCaseName(c)).filter(Boolean);
      reasons.push(`Ambiguous citation — could match: ${names.join("; ") || "multiple cases"}`);
      if (r.normalized_citations && r.normalized_citations.length > 1) {
        reasons.push(`Possible reporters: ${r.normalized_citations.join(", ")}`);
      }
      return { result: r, tier: "orange" as Tier, reasons, caseName, citedName, year: filedYear, href, parallelCites, namesMismatch: false };
    }

    // Status 429 or other non-200
    if (r.status !== 200) {
      reasons.push(r.error_message || `Unexpected status (${r.status})`);
      return { result: r, tier: "orange" as Tier, reasons, caseName, citedName, year: filedYear, href, parallelCites, namesMismatch: false };
    }

    // --- Status 200 with clusters: check for orange conditions ---

    // Year mismatch
    if (citedYear != null && filedYear != null && citedYear !== filedYear) {
      reasons.push(`Year mismatch: you cited (${citedYear}), case was decided ${filedYear}`);
    }

    // Normalized citation differs
    const norm = r.normalized_citations?.[0];
    if (norm && norm !== r.citation) {
      reasons.push(`Normalized to: ${norm}`);
    }

    // Unpublished / non-precedential
    const precStatus = cluster?.precedential_status;
    if (precStatus && /unpublished|non-precedential|errata|separate|relating/i.test(precStatus)) {
      reasons.push(`Precedential status: ${precStatus}`);
    }

    // Case name mismatch check
    let namesMismatch = false;
    let nameComparison: "match" | "partial" | "none" = "match";
    if (citedName && caseName) {
      nameComparison = compareNames(citedName, caseName);
      if (nameComparison === "partial") {
        namesMismatch = true;
        reasons.push(`Possible case name mismatch: you cited "${citedName}" but this reporter citation corresponds to "${caseName}"`);
      } else if (nameComparison === "none") {
        namesMismatch = true;
        reasons.push(`Case name mismatch: you cited "${citedName}" but this reporter citation corresponds to "${caseName}"`);
      }
    }

    // Red if both sides of the name are completely wrong
    if (nameComparison === "none") {
      return { result: r, tier: "red" as Tier, reasons, caseName, citedName, year: filedYear, href, parallelCites, namesMismatch };
    }

    const tier: Tier = reasons.length > 0 ? "orange" : "green";
    return { result: r, tier, reasons, caseName, citedName, year: filedYear, href, parallelCites, namesMismatch };
  });
}

function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  return (
    <span className="relative group/tip">
      {children}
      <span className="pointer-events-none absolute left-0 bottom-full mb-2 z-20 hidden group-hover/tip:block
                        w-72 rounded-lg border border-warm-border bg-warm-white p-3 text-xs text-warm-body shadow-lg">
        {content}
      </span>
    </span>
  );
}

export default function CiteResults({ results, sourceText }: { results: CiteResult[]; sourceText?: string }) {
  const [copied, setCopied] = useState(false);
  const classified = classifyCitations(results, sourceText);

  const green = classified.filter((c) => c.tier === "green");
  const orange = classified.filter((c) => c.tier === "orange");
  const red = classified.filter((c) => c.tier === "red");

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-warm-border bg-warm-yellow-bg p-4 text-sm text-warm-yellow">
        No citations detected.
      </div>
    );
  }

  async function copyResults() {
    const lines: string[] = [];
    for (const [label, items] of [["VERIFIED", green], ["NEEDS ATTENTION", orange], ["NOT FOUND", red]] as const) {
      if (items.length > 0) {
        if (lines.length > 0) lines.push("");
        lines.push(`${label} (${items.length}):`);
        items.forEach((c) => {
          const norm = c.result.normalized_citations?.[0] ?? c.result.citation;
          const extra = c.caseName ? ` — ${c.caseName}` : "";
          const url = c.href ? ` — ${c.href}` : "";
          lines.push(`  ${norm}${extra}${url}`);
          c.reasons.forEach((r) => lines.push(`    ⚠ ${r}`));
        });
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard may fail */ }
  }

  const allGood = results.length > 0 && orange.length === 0 && red.length === 0;

  return (
    <section className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg bg-[rgba(30,58,95,0.06)] px-4 py-3">
        <p className="text-sm font-medium text-warm-accent">
          {green.length} verified
          {orange.length > 0 && <span className="text-warm-orange">{" / "}{orange.length} attention</span>}
          {red.length > 0 && <span className="text-warm-red">{" / "}{red.length} not found</span>}
          <span className="text-warm-muted">{" "}of {results.length} citation{results.length !== 1 ? "s" : ""}</span>
        </p>
        <button
          type="button"
          onClick={copyResults}
          className="text-sm text-warm-muted underline hover:text-warm-accent transition-colors"
        >
          {copied ? "Copied!" : "Copy results"}
        </button>
      </div>

      {allGood && (
        <div className="rounded-lg border border-green-200 bg-warm-green-bg p-4 text-sm font-medium text-warm-green">
          All citations verified.
        </div>
      )}

      {/* Not Found (red) */}
      {red.length > 0 && (
        <ResultSection title="Not Found" items={red} icon="✕" iconColor="text-warm-red" borderColor="border-red-100" />
      )}

      {/* Needs Attention (orange) */}
      {orange.length > 0 && (
        <ResultSection title="Needs Attention" items={orange} icon="!" iconColor="text-warm-orange" borderColor="border-orange-100" />
      )}

      {/* Verified (green) */}
      {green.length > 0 && (
        <ResultSection title="Verified" items={green} icon="✓" iconColor="text-warm-green" borderColor="border-green-100" />
      )}
    </section>
  );
}

function ResultSection({
  title, items, icon, iconColor, borderColor,
}: {
  title: string;
  items: ClassifiedCite[];
  icon: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-warm-dim">{title}</h2>
      <div className="space-y-2">
        {items.map((c, i) => {
          const norm = c.result.normalized_citations?.[0] ?? c.result.citation;
          return (
            <div
              key={i}
              className={`flex items-start justify-between gap-3 rounded-lg border ${borderColor} bg-warm-white p-4`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <Tooltip
                  content={
                    <TooltipContent c={c} />
                  }
                >
                  <span className={`mt-0.5 ${iconColor} font-bold text-sm select-none flex-shrink-0 cursor-help`}>
                    {icon}
                  </span>
                </Tooltip>
                <div className="min-w-0">
                  {c.caseName && (
                    <p className={`text-sm font-medium break-words ${c.namesMismatch ? "text-warm-orange" : "text-warm-text"}`}>
                      {c.caseName}{c.year ? ` (${c.year})` : ""}
                    </p>
                  )}
                  <p className={`${c.caseName ? "mt-0.5 text-xs text-warm-muted" : "text-sm text-warm-body"} break-words`}>{norm}</p>
                  {c.namesMismatch && c.citedName && (
                    <p className="mt-1 text-xs text-warm-orange">
                      Name mismatch — you cited &ldquo;{c.citedName}&rdquo;
                    </p>
                  )}
                  {c.tier === "orange" && !c.namesMismatch && c.reasons.length > 0 && (
                    <p className="mt-1 text-xs text-warm-orange">{c.reasons[0]}</p>
                  )}
                  {c.tier === "red" && c.result.error_message && (
                    <p className="mt-1 text-xs text-warm-dim">{c.result.error_message}</p>
                  )}
                </div>
              </div>
              {c.href && (
                <a
                  href={c.href}
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
  );
}

function TooltipContent({ c }: { c: ClassifiedCite }) {
  return (
    <>
      {c.caseName && <p className="font-medium text-warm-text">{c.caseName}</p>}
      {c.year && <p className="mt-1">Decided: {c.year}</p>}
      {c.parallelCites.length > 1 && (
        <p className="mt-1">Parallel cites: {c.parallelCites.join(", ")}</p>
      )}
      {c.result.normalized_citations?.[0] && c.result.normalized_citations[0] !== c.result.citation && (
        <p className="mt-1">Normalized: {c.result.normalized_citations[0]}</p>
      )}
      {c.reasons.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 list-disc pl-3">
          {c.reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}
      {c.reasons.length === 0 && c.tier === "green" && (
        <p className="mt-1 text-warm-green">Citation verified — volume, reporter, page, and year all match.</p>
      )}
    </>
  );
}
