import { type CiteResult } from "@/components/CiteResults";

type Props = {
  text: string;
  results: CiteResult[];
  linkOnlyFound?: boolean; // if true, only link (and render) found citations
  highlightNotFound?: boolean; // if true, render not-found ranges as highlighted spans
};

export default function LinkifiedText({ text, results, linkOnlyFound = true, highlightNotFound = false }: Props) {
  const len = text.length;

  // Build link ranges from results
  const ranges = results
    .map((r) => {
      const found = r.status === 200 && Array.isArray(r.clusters) && r.clusters.length > 0;
      const start = clamp(0, r.start_index ?? 0, len);
      let end = typeof r.end_index === "number" ? r.end_index : NaN;
      if (!Number.isFinite(end) || end <= start) {
        const fallbackLen = r.citation ? r.citation.length : 0;
        end = start + fallbackLen;
      }
      if (end <= start) end = start + 1;
      if (end > len) end = len;
      const abs = r.clusters?.[0]?.absolute_url;
      const href = found && abs ? `https://www.courtlistener.com${abs}` : undefined;
      return { start, end, href, found };
    })
    .filter((r) => {
      if (linkOnlyFound) return r.found;
      // when showing all, optionally include not-found; if not highlighting not-found, skip them
      return r.found || highlightNotFound;
    })
    .sort((a, b) => a.start - b.start);

  // Remove overlaps: prefer earlier ranges; drop any that overlap prior accepted
  const nonOverlapping: typeof ranges = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start >= cursor) {
      nonOverlapping.push(r);
      cursor = r.end;
    }
  }

  // Stitch text + anchors
  const parts: React.ReactNode[] = [];
  let i = 0;
  for (const r of nonOverlapping) {
    if (i < r.start) parts.push(text.slice(i, r.start));
    const slice = text.slice(r.start, r.end);
    if (r.href) {
      parts.push(
        <a key={`${r.start}-${r.end}`} className="underline text-blue-700" href={r.href} target="_blank" rel="noreferrer">
          {slice}
        </a>
      );
    } else {
      // Not-found highlight
      parts.push(
        <span key={`${r.start}-${r.end}`} className="bg-yellow-100 text-zinc-900">
          {slice}
        </span>
      );
    }
    i = r.end;
  }
  if (i < len) parts.push(text.slice(i));

  return <div className="whitespace-pre-wrap break-words">{parts}</div>;
}

function clamp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(max, x));
}
