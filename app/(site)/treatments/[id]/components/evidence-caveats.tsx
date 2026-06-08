import { Info } from "lucide-react";
import type { TreatmentMetadata } from "@/src/lib/queries";

interface EvidenceCaveatsProps {
  metadata: TreatmentMetadata;
}

export function EvidenceCaveats({ metadata }: EvidenceCaveatsProps) {
  const caveats: string[] = [];

  if (metadata.study_count <= 2) {
    caveats.push(
      `Evidence base is thin — only ${metadata.study_count} distinct publication${metadata.study_count === 1 ? "" : "s"}.`
    );
  }

  const allMaleOrUnspecified = Object.entries(metadata.sex_breakdown).every(
    ([sex, count]) =>
      count === 0 || sex === "Males only" || sex === "Not mentioned"
  );
  if (allMaleOrUnspecified && metadata.experiment_count > 0) {
    caveats.push("All studies use male-only or sex-unspecified cohorts.");
  }

  if (
    metadata.distinct_species.length === 1 &&
    metadata.distinct_species[0] === "Mouse"
  ) {
    caveats.push(
      "Only mouse models tested — no cross-species validation in this dataset."
    );
  }

  if (metadata.treatment_original_variants.length > 0) {
    caveats.push(
      `Some studies reference this compound by alternate name(s): ${metadata.treatment_original_variants.join(", ")}.`
    );
  }

  if (caveats.length === 0) return null;

  return (
    <div className="rounded-md bg-surface-muted p-4 flex items-start gap-3">
      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="space-y-1 text-sm text-muted-foreground">
        {caveats.map((caveat, i) => (
          <p key={i}>{caveat}</p>
        ))}
      </div>
    </div>
  );
}
