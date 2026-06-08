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
  Mouse: { light: "#E69F00", dark: "#FFB84D" },       // cat-1 orange
  Rat: { light: "#56B4E9", dark: "#7AC8F2" },         // cat-2 sky blue
  "Fruit Fly": { light: "#009E73", dark: "#2DBC93" }, // cat-3 bluish green
  Zebrafish: { light: "#0072B2", dark: "#2D8FCB" },   // cat-5 deep blue
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

  const outerRadius = large ? 170 : 110;
  const innerRadius = large ? 100 : 70;
  const chartHeight = large ? 420 : 280;

  return (
    <div className="relative w-full">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
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
            innerRadius={innerRadius}
            outerRadius={outerRadius}
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
            className={`font-bold text-foreground ${large ? "text-4xl" : "text-2xl"}`}
          >
            {totalSpecies}
          </div>
          <div
            className={`text-muted-foreground ${large ? "text-sm mt-1" : "text-xs"}`}
          >
            species
            <br />
            {totalExperiments} exp.
          </div>
        </div>
      </div>
      <div
        className={`flex flex-wrap justify-center gap-x-4 gap-y-2 ${large ? "mt-6" : "mt-2"}`}
      >
        {chartData
          .filter((d) => d.value > 0)
          .map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className={`rounded-sm ${large ? "h-4 w-4" : "h-3 w-3"}`}
                style={{
                  backgroundColor: SPECIES_COLORS[entry.name as Species].light,
                }}
              />
              <span
                className={`text-muted-foreground ${large ? "text-sm" : "text-xs"}`}
              >
                {entry.name}: {entry.value} ({entry.percentage}%)
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
