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
        className="text-zinc-500 underline hover:text-zinc-700"
        aria-expanded={open}
      >
        {open ? "Hide citation examples" : "What citation formats are supported?"}
      </button>
      {open && (
        <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-zinc-700">
          <p className="mb-2">
            CiteCheck recognizes standard Bluebook case citations. Paste any text containing citations like:
          </p>
          <ul className="space-y-1 pl-4 list-disc">
            {EXAMPLES.map((ex, i) => (
              <li key={i}>
                <code className="text-xs bg-white px-1 py-0.5 rounded border">{ex.cite}</code>
                <span className="ml-1 text-zinc-500">({ex.note})</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-zinc-500">
            Citations are verified against the CourtListener database maintained by the Free Law Project.
          </p>
        </div>
      )}
    </div>
  );
}
