"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { EffectRating } from "@/src/lib/types";
import { BarChartTooltip } from "./chart-tooltip";

interface TreatmentData {
  treatment_identifier: string;
  canonical_name: string;
  treatment_short: string;
  study_count: number;
  dominant_outcome: EffectRating;
}

interface TopTreatmentsChartProps {
  data: TreatmentData[];
  tall?: boolean;
}

const COMPOUND_COLORS_LIGHT = [
  "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948",
  "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC", "#D37295", "#8CD17D",
];

const COMPOUND_COLORS_DARK = [
  "#6E97C0", "#F5A54D", "#E87779", "#95CFC9", "#7CC272", "#F2D56E",
  "#CB99C0", "#FFB5BC", "#BF9080", "#D4CCC8", "#E08CAF", "#A6E09A",
];

function truncateName(name: string, maxLength: number = 24): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + "...";
}

export function TopTreatmentsChart({ data, tall = false }: TopTreatmentsChartProps) {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const palette = isDark ? COMPOUND_COLORS_DARK : COMPOUND_COLORS_LIGHT;

  const chartData = data.map((d) => ({
    ...d,
    displayName: d.treatment_short || d.canonical_name,
  }));

  const chartHeight = tall ? 380 : 320;
  const barSize = tall ? 28 : 22;

  return (
    <div style={{ width: "100%", height: chartHeight }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 16 }}
          barSize={barSize}
          barCategoryGap="15%"
        >
          <XAxis
            type="number"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            width={140}
            tick={{ fill: "var(--text-primary)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-muted)" }}
            content={<BarChartTooltip />}
          />
          <Bar dataKey="study_count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={palette[index % 12]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
