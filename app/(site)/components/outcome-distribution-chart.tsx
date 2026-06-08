"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";
import type { EffectRating } from "@/src/lib/types";
import { OUTCOME_ORDER } from "@/src/lib/types";

interface OutcomeDistributionChartProps {
  data: Record<EffectRating, number>;
}

const CHART_COLORS: Record<EffectRating, { light: string; dark: string }> = {
  Rescue: { light: "#059669", dark: "#10B981" },
  "Partial Rescue": { light: "#6EE7B7", dark: "#34D399" },
  "Differential Rescue (Dose-dependent)": { light: "#FBBF24", dark: "#F59E0B" },
  "No effect": { light: "#CBD5E1", dark: "#475569" },
  NA: { light: "#E2E8F0", dark: "#334155" },
};

const SHORT_LABELS: Record<EffectRating, string> = {
  Rescue: "Rescue",
  "Partial Rescue": "Partial",
  "Differential Rescue (Dose-dependent)": "Differential",
  "No effect": "No effect",
  NA: "NA",
};

export function OutcomeDistributionChart({
  data,
}: OutcomeDistributionChartProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  const chartData = OUTCOME_ORDER.map((outcome) => ({
    outcome,
    count: data[outcome],
    percentage: Math.round((data[outcome] / total) * 100),
    shortLabel: SHORT_LABELS[outcome],
  }));

  let cumulative = 0;
  const stackedData = chartData.map((d) => {
    const start = cumulative;
    cumulative += d.percentage;
    return {
      ...d,
      start,
      width: d.percentage,
    };
  });

  return (
    <div className="w-full">
      <div className="flex h-12 w-full overflow-hidden rounded-lg">
        {stackedData.map((segment) => {
          const colors = CHART_COLORS[segment.outcome];
          return (
            <div
              key={segment.outcome}
              className="relative flex items-center justify-center transition-colors"
              style={{
                width: `${segment.width}%`,
                backgroundColor: `var(--chart-${segment.outcome === "Rescue" ? "rescue" : segment.outcome === "Partial Rescue" ? "partial" : segment.outcome === "Differential Rescue (Dose-dependent)" ? "differential" : segment.outcome === "No effect" ? "no-effect" : "na"})`,
                minWidth: segment.width > 0 ? "40px" : "0",
              }}
              title={`${segment.outcome}: ${segment.count} (${segment.percentage}%)`}
            >
              {segment.width >= 8 && (
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      segment.outcome === "Rescue" ||
                      segment.outcome === "Differential Rescue (Dose-dependent)"
                        ? "#FFFFFF"
                        : "#0F172A",
                  }}
                >
                  {segment.count}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {stackedData.map((segment) => (
          <div key={segment.outcome} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundColor: `var(--chart-${segment.outcome === "Rescue" ? "rescue" : segment.outcome === "Partial Rescue" ? "partial" : segment.outcome === "Differential Rescue (Dose-dependent)" ? "differential" : segment.outcome === "No effect" ? "no-effect" : "na"})`,
              }}
            />
            <span className="text-xs text-muted-foreground">
              {segment.shortLabel}: {segment.count} ({segment.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
