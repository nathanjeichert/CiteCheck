"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "What citation formats are supported?",
    answer: (
      <>
        <p>
          CiteCheck recognizes standard Bluebook case citations with a volume, reporter, and page
          number. For example:
        </p>
        <ul className="mt-2 space-y-1 pl-4 list-disc">
          <li><code className="text-xs bg-warm-white px-1 py-0.5 rounded border border-warm-border font-mono">Brown v. Board of Education, 347 U.S. 483 (1954)</code></li>
          <li><code className="text-xs bg-warm-white px-1 py-0.5 rounded border border-warm-border font-mono">Palsgraf v. Long Island R.R. Co., 248 N.Y. 339 (1928)</code></li>
        </ul>
        <p className="mt-2">
          Shortform citations such as <em>Id.</em>, <em>supra</em>, and short case name references
          are not supported. Only full citations with a volume, reporter, and starting page can be verified.
        </p>
      </>
    ),
  },
  {
    question: "Is every case in every jurisdiction covered?",
    answer: (
      <>
        <p>
          No. CiteCheck verifies citations against the{" "}
          <a href="https://www.courtlistener.com" target="_blank" rel="noreferrer" className="underline hover:text-warm-accent">
            CourtListener
          </a>{" "}
          database maintained by the Free Law Project, a legal-data nonprofit. Their database
          includes over 10 million opinions across more than 3,300 courts, including:
        </p>
        <ul className="mt-2 space-y-1 pl-4 list-disc">
          <li>All federal courts (Supreme Court, Circuit Courts, District Courts, Bankruptcy Courts)</li>
          <li>Specialized federal courts (Tax Court, Court of Federal Claims, etc.)</li>
          <li>All 50 state supreme courts and most state appellate courts</li>
        </ul>
        <p className="mt-2">
          However, coverage is not exhaustive. Older state court opinions (especially pre-1950s),
          state trial court decisions, and some unpublished opinions may be missing. A citation
          marked &ldquo;not found&rdquo; may still be valid if the case is not yet in CourtListener&rsquo;s database.
        </p>
      </>
    ),
  },
  {
    question: "How are cases verified?",
    answer: (
      <>
        <p>
          CiteCheck validates citations based on the <strong>volume number</strong>,{" "}
          <strong>reporter abbreviation</strong>, and <strong>starting page number</strong>. If a
          publication year is included in the citation, the year is also checked against the
          case&rsquo;s decision date.
        </p>
        <p className="mt-2">
          Importantly, this means CiteCheck does <strong>not</strong> verify:
        </p>
        <ul className="mt-1 space-y-1 pl-4 list-disc">
          <li>Whether the <strong>case name</strong> (party names) matches the citation — the case name from CourtListener is displayed for you to confirm</li>
          <li>Whether quotes attributed to the case are accurate</li>
          <li>Whether the holding or legal rule is correctly stated</li>
          <li>Whether the case is still good law (not overruled or distinguished)</li>
        </ul>
        <p className="mt-2">
          A citation to a real volume/reporter/page that is attributed to the wrong case name will
          appear as &ldquo;verified&rdquo; — always check the case name shown in the results.
        </p>
      </>
    ),
  },
  {
    question: "Is my data safe?",
    answer: (
      <>
        <p>
          Yes. The text you paste into CiteCheck is <strong>not stored</strong> by this tool and is{" "}
          <strong>not submitted to any generative AI model</strong>. Your text is sent only to the{" "}
          <a href="https://www.courtlistener.com/help/api/rest/citation-lookup/" target="_blank" rel="noreferrer" className="underline hover:text-warm-accent">
            CourtListener Citation Lookup API
          </a>{" "}
          for processing.
        </p>
        <p className="mt-2">
          CourtListener is operated by the{" "}
          <a href="https://free.law" target="_blank" rel="noreferrer" className="underline hover:text-warm-accent">
            Free Law Project
          </a>
          , a 501(c)(3) nonprofit. Per their documentation, they do not track API queries, though
          they collect basic statistical information for system monitoring. Your text is not logged
          or retained by their service.
        </p>
      </>
    ),
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <aside className="rounded-lg border border-warm-border bg-warm-white overflow-hidden">
      <h2 className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-warm-dim bg-warm-subtle border-b border-warm-border flex items-center gap-2">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
        FAQ
      </h2>
      <div className="divide-y divide-warm-border">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left px-4 py-3 text-sm font-medium text-warm-body hover:bg-warm-subtle transition-colors flex items-center justify-between gap-2"
              aria-expanded={openIndex === i}
            >
              <span>{item.question}</span>
              <svg
                className={`w-4 h-4 text-warm-dim flex-shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4 text-xs text-warm-muted leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
