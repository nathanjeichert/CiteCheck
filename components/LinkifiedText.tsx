import { type CiteResult, type Tier, classifyCitations } from "./CiteResults";

type Props = {
  text: string;
  results: CiteResult[];
  linkOnlyFound?: boolean;
  highlightNotFound?: boolean;
};

const tierColors: Record<Tier, string> = {
  green: "underline decoration-warm-green text-warm-accent hover:text-warm-accent-light",
  orange: "underline decoration-warm-orange text-warm-orange",
  red: "bg-warm-yellow-bg text-warm-text",
};

export default function LinkifiedText({ text, results, linkOnlyFound = true, highlightNotFound = false }: Props) {
  const len = text.length;
  const classified = classifyCitations(results, text);

  const ranges = classified
    .map((c) => {
      const r = c.result;
      const start = clamp(0, r.start_index ?? 0, len);
      let end = typeof r.end_index === "number" ? r.end_index : NaN;
      if (!Number.isFinite(end) || end <= start) {
        const fallbackLen = r.citation ? r.citation.length : 0;
        end = start + fallbackLen;
      }
      if (end <= start) end = start + 1;
      if (end > len) end = len;
      return { start, end, href: c.href, tier: c.tier };
    })
    .filter((r) => {
      if (linkOnlyFound) return r.tier === "green" || r.tier === "orange";
      return r.tier === "green" || r.tier === "orange" || highlightNotFound;
    })
    .sort((a, b) => a.start - b.start);

  // Remove overlaps
  const nonOverlapping: typeof ranges = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start >= cursor) {
      nonOverlapping.push(r);
      cursor = r.end;
    }
  }

  const parts: React.ReactNode[] = [];
  let i = 0;
  for (const r of nonOverlapping) {
    if (i < r.start) parts.push(text.slice(i, r.start));
    const slice = text.slice(r.start, r.end);
    const cls = tierColors[r.tier];
    if (r.href) {
      parts.push(
        <a key={`${r.start}-${r.end}`} className={`${cls} transition-colors`} href={r.href} target="_blank" rel="noreferrer">
          {slice}
        </a>
      );
    } else {
      parts.push(
        <span key={`${r.start}-${r.end}`} className={cls}>
          {slice}
        </span>
      );
    }
    i = r.end;
  }
  if (i < len) parts.push(text.slice(i));

  return <div className="whitespace-pre-wrap break-words text-sm text-warm-body leading-relaxed">{parts}</div>;
}

function clamp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(max, x));
}
