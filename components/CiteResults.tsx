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
  const failed = results.filter(r => r.status !== 200 || !r.clusters || r.clusters.length === 0);
  const found = results.filter(r => r.status === 200 && r.clusters && r.clusters.length > 0);
  const allGood = results.length > 0 && failed.length === 0;

  if (results.length === 0) {
    return <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">No citations detected.</div>;
  }

  return (
    <section className="space-y-4">
      {allGood ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 font-medium">✅ All Cases Found!</div>
      ) : (
        <>
          <h2 className="text-lg font-semibold">Not Found</h2>
          <ul className="list-disc space-y-2 pl-6">
            {failed.map((r, i) => (
              <li key={i} className="text-red-700">
                ❌ <span className="font-mono">{r.citation}</span>{" "}
                {r.error_message ? <em>— {r.error_message}</em> : null}
              </li>
            ))}
          </ul>
        </>
      )}

      {found.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer select-none text-sm text-zinc-700 group-open:pb-2">Show Found</summary>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            {found.map((r, i) => {
              const norm = r.normalized_citations?.[0] ?? r.citation;
              const url = r.clusters?.[0]?.absolute_url ? `https://www.courtlistener.com${r.clusters[0].absolute_url}` : undefined;
              return (
                <li key={i}>
                  ✅ <span className="font-mono">{norm}</span>
                  {url ? (
                    <>
                      {" "}— <a className="underline" href={url} target="_blank" rel="noreferrer">View</a>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}

