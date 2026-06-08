import { ExternalLink } from "lucide-react";
import type { TreatmentMetadata } from "@/src/lib/queries";

interface ReferencesListProps {
  references: TreatmentMetadata["distinct_references"];
}

export function ReferencesList({ references }: ReferencesListProps) {
  if (references.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface p-4">
        <h2 className="text-lg font-bold text-foreground mb-2">References</h2>
        <p className="text-sm text-muted-foreground">
          No external references available for this compound.
        </p>
      </div>
    );
  }

  const sorted = [...references].sort((a, b) => {
    if (a.year_hint && b.year_hint) {
      return b.year_hint - a.year_hint;
    }
    if (a.year_hint) return -1;
    if (b.year_hint) return 1;
    return a.citation.localeCompare(b.citation);
  });

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <h2 className="text-lg font-bold text-foreground mb-3">References</h2>
      <div className="space-y-2">
        {sorted.map((ref, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="text-foreground">{ref.citation}</span>
            {ref.doi && ref.doi !== "NA" && (
              <>
                <span className="text-muted-foreground">—</span>
                <a
                  href={ref.doi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-interactive hover:text-interactive-hover font-mono text-xs break-all"
                >
                  {ref.doi}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
