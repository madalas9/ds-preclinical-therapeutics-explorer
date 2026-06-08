"use client";

import type { EffectRating } from "@/src/lib/types";
import { OUTCOME_ORDER } from "@/src/lib/types";
import type { TreatmentOutcomeBreakdowns } from "@/src/lib/queries";

interface OutcomeThreeAxisCardProps {
  breakdowns: TreatmentOutcomeBreakdowns;
  experimentCount: number;
}

const OUTCOME_COLORS: Record<EffectRating, string> = {
  Rescue: "var(--chart-rescue)",
  "Partial Rescue": "var(--chart-partial)",
  "Differential Rescue (Dose-dependent)": "var(--chart-differential)",
  "No effect": "var(--chart-no-effect)",
  NA: "var(--chart-na)",
};

const OUTCOME_LABELS: Record<EffectRating, string> = {
  Rescue: "Rescue",
  "Partial Rescue": "Partial",
  "Differential Rescue (Dose-dependent)": "Differential",
  "No effect": "No effect",
  NA: "NA",
};

function HorizontalStackedBar({
  counts,
  label,
  subLabel,
}: {
  counts: Record<EffectRating, number>;
  label: string;
  subLabel: string;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{subLabel}</p>
        </div>
        <div className="h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">No data</span>
        </div>
      </div>
    );
  }

  const nonZero = OUTCOME_ORDER.filter((o) => counts[o] > 0);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{subLabel}</p>
      </div>
      <div className="flex h-7 w-full overflow-hidden rounded">
        {OUTCOME_ORDER.map((outcome) => {
          const count = counts[outcome];
          if (count === 0) return null;
          const width = (count / total) * 100;
          return (
            <div
              key={outcome}
              className="h-full transition-all"
              style={{
                width: `${width}%`,
                backgroundColor: OUTCOME_COLORS[outcome],
              }}
              title={`${OUTCOME_LABELS[outcome]}: ${count} (${Math.round(width)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {nonZero.map((outcome) => {
          const count = counts[outcome];
          const pct = Math.round((count / total) * 100);
          return (
            <span key={outcome} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: OUTCOME_COLORS[outcome] }}
              />
              {OUTCOME_LABELS[outcome]}: {count} ({pct}%)
            </span>
          );
        })}
      </div>
    </div>
  );
}

function generateInterpretations(
  breakdowns: TreatmentOutcomeBreakdowns,
  experimentCount: number
): string[] {
  const interpretations: string[] = [];

  const axes = [
    { name: "Behavioral", data: breakdowns.behavior },
    { name: "Cellular", data: breakdowns.cellular },
    { name: "Molecular", data: breakdowns.molecular },
  ];

  const behaviorTotal = Object.values(breakdowns.behavior).reduce((a, b) => a + b, 0);
  const behaviorNA = breakdowns.behavior.NA;
  if (behaviorTotal > 0 && behaviorNA / behaviorTotal > 0.5) {
    const cellularRescues =
      breakdowns.cellular.Rescue + breakdowns.cellular["Partial Rescue"];
    const molecularRescues =
      breakdowns.molecular.Rescue + breakdowns.molecular["Partial Rescue"];
    const primaryAxis = cellularRescues >= molecularRescues ? "cellular" : "molecular";
    const hasRescues = Math.max(cellularRescues, molecularRescues) > 0;
    interpretations.push(
      `Note: ${Math.round((behaviorNA / behaviorTotal) * 100)}% of conditions did not measure a behavioral outcome. Evidence here is primarily ${primaryAxis} where rescues ${hasRescues ? "are" : "are not"} present.`
    );
  }

  for (const axis of axes) {
    const total = Object.values(axis.data).reduce((a, b) => a + b, 0);
    if (total === 0) continue;

    const rescueCount = axis.data.Rescue + axis.data["Partial Rescue"];
    const noEffectCount = axis.data["No effect"];

    if (rescueCount / total >= 0.5) {
      interpretations.push(
        `${axis.name}: most conditions report a (partial) rescue.`
      );
    } else if (noEffectCount / total >= 0.5) {
      interpretations.push(`${axis.name}: most conditions report no effect.`);
    }
  }

  const hasData = axes.filter(
    (a) => Object.values(a.data).reduce((sum, c) => sum + c, 0) > 0
  );
  const mixed = hasData.filter((a) => {
    const total = Object.values(a.data).reduce((sum, c) => sum + c, 0);
    const rescueCount = a.data.Rescue + a.data["Partial Rescue"];
    const noEffectCount = a.data["No effect"];
    return rescueCount / total < 0.5 && noEffectCount / total < 0.5;
  });

  if (mixed.length >= 2 && interpretations.length < 3) {
    interpretations.push(
      "Mixed evidence across measurement types — drill into individual experiments below for context."
    );
  }

  return interpretations.slice(0, 3);
}

export function OutcomeThreeAxisCard({
  breakdowns,
  experimentCount,
}: OutcomeThreeAxisCardProps) {
  const interpretations = generateInterpretations(breakdowns, experimentCount);

  return (
    <div className="rounded-md border border-border bg-surface p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Outcome breakdown</h2>
        <p className="text-sm text-muted-foreground">
          {experimentCount} experimental conditions across 3 measurement axes
        </p>
      </div>

      <div className="space-y-6">
        <HorizontalStackedBar
          counts={breakdowns.behavior}
          label="Behavioral outcomes"
          subLabel="Behavior tasks (e.g. MWM, NOR, Y-maze)"
        />
        <HorizontalStackedBar
          counts={breakdowns.cellular}
          label="Cellular outcomes"
          subLabel="Cellular / morphological effects"
        />
        <HorizontalStackedBar
          counts={breakdowns.molecular}
          label="Molecular outcomes"
          subLabel="Specific gene/protein/transcript effects"
        />
      </div>

      {interpretations.length > 0 && (
        <div className="mt-6 rounded-md bg-surface-muted p-4">
          <div className="space-y-1 text-sm italic text-muted-foreground">
            {interpretations.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
