import { AlertTriangle } from "lucide-react";
import type { TreatmentMetadata } from "@/src/lib/queries";

interface ModelsSexSummaryProps {
  metadata: TreatmentMetadata;
}

export function ModelsSexSummary({ metadata }: ModelsSexSummaryProps) {
  const modelsToShow = metadata.distinct_models.slice(0, 6);
  const remainingModels = metadata.distinct_models.length - 6;

  const malesOnly = metadata.sex_breakdown["Males only"] || 0;
  const notMentioned = metadata.sex_breakdown["Not mentioned"] || 0;
  const maleOnlyOrUnspecified = malesOnly + notMentioned;
  const hasSexCoverageGap =
    maleOnlyOrUnspecified / metadata.experiment_count >= 0.7;

  const sexEntries = Object.entries(metadata.sex_breakdown).filter(
    ([, count]) => count > 0
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Models card */}
      <div className="rounded-md border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Models tested
        </h3>
        <div className="space-y-1.5">
          {modelsToShow.map((model) => (
            <div
              key={model.name}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-foreground">{model.name}</span>
              <span className="text-muted-foreground">({model.count})</span>
            </div>
          ))}
          {remainingModels > 0 && (
            <p className="text-xs text-muted-foreground">
              +{remainingModels} more
            </p>
          )}
          {metadata.distinct_models.length === 0 && (
            <p className="text-sm text-muted-foreground">No model data available</p>
          )}
        </div>
      </div>

      {/* Sex composition card */}
      <div className="rounded-md border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Sex composition
        </h3>
        <div className="space-y-1.5">
          {sexEntries.map(([sex, count]) => (
            <div
              key={sex}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-foreground">{sex}</span>
              <span className="text-muted-foreground">({count})</span>
            </div>
          ))}
          {sexEntries.length === 0 && (
            <p className="text-sm text-muted-foreground">No sex data available</p>
          )}
        </div>
        {hasSexCoverageGap && (
          <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Sex coverage gap — most studies are male-only or do not report sex.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
