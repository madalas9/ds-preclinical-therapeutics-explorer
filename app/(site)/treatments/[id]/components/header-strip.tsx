import { ExternalLink } from "lucide-react";
import type { TreatmentMetadata } from "@/src/lib/queries";

interface HeaderStripProps {
  metadata: TreatmentMetadata;
}

export function HeaderStrip({ metadata }: HeaderStripProps) {
  const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(metadata.canonical_name)}`;
  const meshUrl = `https://meshb.nlm.nih.gov/search?searchInField=termDescriptor&query=${encodeURIComponent(metadata.canonical_name)}`;

  return (
    <div className="rounded-md border border-border bg-surface p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left side */}
        <div className="space-y-3">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {metadata.treatment_identifier}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {metadata.canonical_name}
          </h1>
          {metadata.treatment_original_variants.length > 0 && (
            <p className="text-sm text-muted-foreground/70">
              Also reported as: {metadata.treatment_original_variants.join(", ")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {metadata.experiment_count} experiments · {metadata.study_count} studies ·{" "}
            {metadata.distinct_models.length} models · {metadata.distinct_species.length} species
          </p>
          {(metadata.dominant_administration_route || metadata.dose_examples.length > 0) && (
            <p className="text-xs text-muted-foreground/70">
              {metadata.dominant_administration_route && (
                <>Dominant route: {metadata.dominant_administration_route}</>
              )}
              {metadata.dominant_administration_route && metadata.dose_examples.length > 0 && (
                <> · </>
              )}
              {metadata.dose_examples.length > 0 && (
                <>Sample doses: {metadata.dose_examples.join("; ")}</>
              )}
            </p>
          )}
        </div>

        {/* Right side - external links */}
        <div className="flex flex-row gap-2 lg:flex-col">
          <a
            href={pubchemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            View on PubChem
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={meshUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            Search MeSH
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
