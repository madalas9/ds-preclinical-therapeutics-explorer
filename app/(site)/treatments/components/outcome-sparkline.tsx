import type { EffectRating } from "@/src/lib/types";
import { OUTCOME_ORDER } from "@/src/lib/types";

interface OutcomeSparklineProps {
  counts: Record<EffectRating, number>;
}

const OUTCOME_COLORS: Record<EffectRating, string> = {
  Rescue: "bg-accent-rescue",
  "Partial Rescue": "bg-chart-partial",
  "Differential Rescue (Dose-dependent)": "bg-amber-400",
  "No effect": "bg-slate-300 dark:bg-slate-600",
  NA: "bg-slate-200 dark:bg-slate-700",
};

const OUTCOME_LABELS: Record<EffectRating, string> = {
  Rescue: "Rescue",
  "Partial Rescue": "Partial",
  "Differential Rescue (Dose-dependent)": "Differential",
  "No effect": "No effect",
  NA: "NT",
};

export function OutcomeSparkline({ counts }: OutcomeSparklineProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="group relative flex h-5 w-full max-w-[120px] items-center gap-px overflow-hidden rounded">
      {OUTCOME_ORDER.map((outcome) => {
        const count = counts[outcome];
        if (count === 0) return null;
        const width = (count / total) * 100;
        return (
          <div
            key={outcome}
            className={`h-full ${OUTCOME_COLORS[outcome]}`}
            style={{ width: `${width}%` }}
            title={`${OUTCOME_LABELS[outcome]}: ${count}`}
          />
        );
      })}
      <div className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center bg-black/60 text-[10px] text-white group-hover:flex">
        {OUTCOME_ORDER.filter((o) => counts[o] > 0)
          .map((o) => `${counts[o]} ${OUTCOME_LABELS[o].charAt(0)}`)
          .join(" · ")}
      </div>
    </div>
  );
}
