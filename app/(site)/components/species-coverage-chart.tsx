"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Species } from "@/src/lib/types";
import { PieChartTooltip } from "./chart-tooltip";

interface SpeciesCoverageChartProps {
  data: Record<Species, number>;
  totalExperiments: number;
  large?: boolean;
}

const SPECIES_COLORS: Record<Species, { light: string; dark: string }> = {
  Mouse: { light: "#E69F00", dark: "#FFB84D" },
  Rat: { light: "#56B4E9", dark: "#7AC8F2" },
  "Fruit Fly": { light: "#009E73", dark: "#2DBC93" },
  Zebrafish: { light: "#0072B2", dark: "#2D8FCB" },
};

const SPECIES_ORDER: Species[] = ["Mouse", "Rat", "Fruit Fly", "Zebrafish"];

export function SpeciesCoverageChart({
  data,
  totalExperiments,
  large = false,
}: SpeciesCoverageChartProps) {
  const chartData = SPECIES_ORDER.map((species) => ({
    name: species,
    value: data[species],
    percentage: Math.round((data[species] / totalExperiments) * 100),
  }));

  const totalSpecies = SPECIES_ORDER.filter((s) => data[s] > 0).length;

  const chartHeight = large ? 380 : 280;

  return (
    <div className="relative w-full px-4">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="75%"
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SPECIES_COLORS[entry.name as Species].light}
                className="dark:hidden"
              />
            ))}
          </Pie>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="75%"
            paddingAngle={2}
            dataKey="value"
            className="hidden dark:block"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-dark-${index}`}
                fill={SPECIES_COLORS[entry.name as Species].dark}
              />
            ))}
          </Pie>
          <Tooltip content={<PieChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div
            className={`font-bold text-foreground ${large ? "text-3xl lg:text-5xl" : "text-2xl"}`}
          >
            {totalSpecies}
          </div>
          <div
            className={`text-muted-foreground ${large ? "text-xs lg:text-sm mt-1" : "text-xs"}`}
          >
            species
          </div>
        </div>
      </div>
      <div
        className={`flex flex-wrap justify-center gap-x-4 gap-y-2 ${large ? "mt-4 lg:mt-6" : "mt-2"}`}
      >
        {chartData
          .filter((d) => d.value > 0)
          .map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className={`rounded-sm ${large ? "h-3 w-3 lg:h-4 lg:w-4" : "h-3 w-3"}`}
                style={{
                  backgroundColor: SPECIES_COLORS[entry.name as Species].light,
                }}
              />
              <span
                className={`text-muted-foreground ${large ? "text-xs lg:text-sm" : "text-xs"}`}
              >
                {entry.name}: {entry.value} ({entry.percentage}%)
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
