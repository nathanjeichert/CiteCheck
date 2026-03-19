"use client";

import { useState } from "react";

const EXAMPLES = [
  { cite: "Brown v. Board of Education, 347 U.S. 483 (1954)", note: "U.S. Supreme Court" },
  { cite: "Miranda v. Arizona, 384 U.S. 436 (1966)", note: "U.S. Supreme Court" },
  { cite: "Palsgraf v. Long Island R.R. Co., 248 N.Y. 339 (1928)", note: "State court" },
  { cite: "Chevron U.S.A., Inc. v. NRDC, 467 U.S. 837 (1984)", note: "U.S. Supreme Court" },
];

export default function CitationHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-warm-muted hover:underline hover:text-warm-accent transition-colors"
        aria-expanded={open}
      >
        {open ? "Hide citation examples" : "What citation formats are supported?"}
      </button>
      {open && (
        <div className="mt-3 rounded-lg border border-warm-border bg-warm-subtle p-4 text-warm-body">
          <p className="mb-3 text-sm">
            CiteCheck recognizes standard Bluebook case citations. Paste any text containing citations like:
          </p>
          <ul className="space-y-2 pl-4 list-disc text-sm">
            {EXAMPLES.map((ex, i) => (
              <li key={i}>
                <code className="text-xs bg-warm-white px-1.5 py-0.5 rounded border border-warm-border font-mono">
                  {ex.cite}
                </code>
                <span className="ml-1.5 text-warm-dim">({ex.note})</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-warm-dim">
            Citations are verified against the CourtListener database maintained by the Free Law Project.
          </p>
        </div>
      )}
    </div>
  );
}
