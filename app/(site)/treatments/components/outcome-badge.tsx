import type { EffectRating } from "@/src/lib/types";

interface OutcomeBadgeProps {
  outcome: EffectRating;
}

const OUTCOME_STYLES: Record<
  EffectRating,
  { bg: string; text: string; label: string }
> = {
  Rescue: {
    bg: "bg-accent-rescue-bg",
    text: "text-accent-rescue",
    label: "Rescue",
  },
  "Partial Rescue": {
    bg: "bg-chart-partial/20",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Partial",
  },
  "No effect": {
    bg: "bg-slate-200 dark:bg-slate-700",
    text: "text-slate-600 dark:text-slate-300",
    label: "No effect",
  },
  "Differential Rescue (Dose-dependent)": {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    label: "Differential",
  },
  NA: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-400 dark:text-slate-500",
    label: "NT",
  },
};

const NT_TOOLTIP = "Not Tested — this outcome axis was not measured in these studies.";

export function OutcomeBadge({ outcome }: OutcomeBadgeProps) {
  const style = OUTCOME_STYLES[outcome];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
      title={outcome === "NA" ? NT_TOOLTIP : undefined}
    >
      {style.label}
    </span>
  );
}
