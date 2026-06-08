"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { SexCategory } from "@/src/lib/types";
import { PieChartTooltip } from "./chart-tooltip";

interface SexCoverageChartProps {
  data: Record<SexCategory, number>;
}

const SEX_COLORS: Record<SexCategory, { light: string; dark: string }> = {
  "Males only": { light: "#FBBF24", dark: "#F59E0B" },
  "Females only": { light: "#94A3B8", dark: "#CBD5E1" },
  "Males and Females": { light: "#64748B", dark: "#94A3B8" },
  "Males and Females, Not mentioned": { light: "#CBD5E1", dark: "#64748B" },
  "Not mentioned": { light: "#E2E8F0", dark: "#475569" },
};

const SHORT_LABELS: Record<SexCategory, string> = {
  "Males only": "Males only",
  "Females only": "Females only",
  "Males and Females": "Both sexes",
  "Males and Females, Not mentioned": "Both (unspecified)",
  "Not mentioned": "Not mentioned",
};

const SEX_ORDER: SexCategory[] = [
  "Males only",
  "Females only",
  "Males and Females",
  "Males and Females, Not mentioned",
  "Not mentioned",
];

export function SexCoverageChart({ data }: SexCoverageChartProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const malesOnlyPercentage = Math.round((data["Males only"] / total) * 100);

  const chartData = SEX_ORDER.map((sex) => ({
    name: SHORT_LABELS[sex],
    value: data[sex],
    percentage: Math.round((data[sex] / total) * 100),
  }));

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
          >
            {SEX_ORDER.map((sex, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SEX_COLORS[sex].light}
                className="dark:hidden"
              />
            ))}
          </Pie>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            className="hidden dark:block"
          >
            {SEX_ORDER.map((sex, index) => (
              <Cell
                key={`cell-dark-${index}`}
                fill={SEX_COLORS[sex].dark}
              />
            ))}
          </Pie>
          <Tooltip content={<PieChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-chart-differential">
            {malesOnlyPercentage}%
          </div>
          <div className="text-xs text-muted-foreground">
            male-only
            <br />
            coverage gap
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {SEX_ORDER.filter((sex) => data[sex] > 0).map((sex) => (
          <div key={sex} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundColor: SEX_COLORS[sex].light,
              }}
            />
            <span className="text-xs text-muted-foreground">
              {SHORT_LABELS[sex]}: {Math.round((data[sex] / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
