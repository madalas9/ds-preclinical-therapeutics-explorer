"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EffectRating } from "@/src/lib/types";
import { OUTCOME_ORDER } from "@/src/lib/types";
import type { TreatmentOutcomeBreakdowns, TreatmentMetadata } from "@/src/lib/queries";

// === Types ===

interface CompareItemViz {
  metadata: TreatmentMetadata;
  outcomes: TreatmentOutcomeBreakdowns;
}

interface ComparisonVisualizationsProps {
  items: CompareItemViz[];
  selectedIds: string[];
}

// === Constants ===

const OUTCOME_COLORS: Record<EffectRating, string> = {
  Rescue: "var(--chart-rescue)",
  "Partial Rescue": "var(--chart-partial)",
  "Differential Rescue (Dose-dependent)": "var(--chart-differential)",
  "No effect": "var(--chart-no-effect)",
  NA: "var(--chart-na)",
};

const OUTCOME_LABELS: Record<EffectRating, string> = {
  Rescue: "Rescue",
  "Partial Rescue": "Partial Rescue",
  "Differential Rescue (Dose-dependent)": "Differential",
  "No effect": "No effect",
  NA: "NT",
};

const NT_TOOLTIP = "Not Tested — this outcome axis was not measured in these studies.";

const COMPOUND_COLORS = [
  "var(--cat-1)",  // orange
  "var(--cat-2)",  // sky blue
  "var(--cat-3)",  // bluish green
  "var(--cat-5)",  // deep blue
];

const COMPOUND_HEX_LIGHT = ["#E69F00", "#56B4E9", "#009E73", "#0072B2"];
const COMPOUND_HEX_DARK = ["#FFB84D", "#7AC8F2", "#2DBC93", "#2D8FCB"];

// === Download helper ===

function useChartDownload(
  chartRef: React.RefObject<HTMLDivElement | null>,
  chartName: string,
  selectedIds: string[]
) {
  const handleDownload = useCallback(
    async (format: "png" | "jpeg" | "svg") => {
      if (!chartRef.current) return;

      const isDark = document.documentElement.classList.contains("dark");
      const options = {
        backgroundColor: isDark ? "#0B1220" : "#F8FAFC",
        pixelRatio: 2,
        cacheBust: true,
      };

      try {
        let dataUrl: string;
        if (format === "png") dataUrl = await toPng(chartRef.current, options);
        else if (format === "jpeg")
          dataUrl = await toJpeg(chartRef.current, options);
        else dataUrl = await toSvg(chartRef.current, options);

        const filename = `ds-explorer-${chartName}-${selectedIds.join("-")}.${format}`;
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();
        toast.success(`Image saved as ${filename}`);
      } catch {
        toast.error("Failed to export image");
      }
    },
    [chartRef, chartName, selectedIds]
  );

  return handleDownload;
}

// === Download button ===

function DownloadButton({
  onDownload,
}: {
  onDownload: (format: "png" | "jpeg" | "svg") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1 shrink-0"
        onClick={() => setOpen(!open)}
      >
        <Download className="h-3 w-3" />
        Download
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[140px] rounded-md border border-border bg-surface p-1 shadow-lg">
          {(["png", "jpeg", "svg"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => {
                onDownload(fmt);
                setOpen(false);
              }}
              className="flex w-full items-center rounded px-3 py-1.5 text-xs text-foreground hover:bg-surface-muted cursor-pointer"
            >
              Download {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// === Chart card wrapper ===

function ChartCard({
  heading,
  description,
  chartRef,
  children,
  onDownload,
}: {
  heading: string;
  description: string;
  chartRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  onDownload: (format: "png" | "jpeg" | "svg") => void;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">{heading}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <DownloadButton onDownload={onDownload} />
      </div>
      <div ref={chartRef} className="bg-surface p-2 rounded">
        {children}
      </div>
    </div>
  );
}

// === Helpers for data ===

function countsToPercentages(
  counts: Record<EffectRating, number>
): Record<EffectRating, number> {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    const result = {} as Record<EffectRating, number>;
    for (const k of OUTCOME_ORDER) result[k] = 0;
    return result;
  }
  const result = {} as Record<EffectRating, number>;
  for (const k of OUTCOME_ORDER) {
    result[k] = Math.round((counts[k] / total) * 1000) / 10; // 1 decimal
  }
  return result;
}

function buildBarChartData(
  items: CompareItemViz[],
  axis: "behavior" | "cellular" | "molecular"
) {
  return items.map((item) => {
    const pcts = countsToPercentages(item.outcomes[axis]);
    const row: Record<string, string | number> = {
      name: item.metadata.treatment_short,
      canonicalName: item.metadata.canonical_name,
      treatmentId: item.metadata.treatment_identifier,
    };
    for (const outcome of OUTCOME_ORDER) {
      row[outcome] = pcts[outcome];
    }
    return row;
  });
}

// === Grouped bar chart ===

function OutcomeBarChart({
  items,
  axis,
}: {
  items: CompareItemViz[];
  axis: "behavior" | "cellular" | "molecular";
}) {
  const data = buildBarChartData(items, axis);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          opacity={0.5}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 11,
          }}
          formatter={(value: unknown, name: unknown) => {
            const label = OUTCOME_LABELS[name as EffectRating] || String(name);
            if (name === "NA") {
              return [`${value}%`, `${label} (Not Tested)`];
            }
            return [`${value}%`, label];
          }}
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0) {
              const item = payload[0].payload;
              const shortName = item?.name || label;
              const canonical = item?.canonicalName;
              if (canonical && canonical !== shortName) {
                return `${shortName}\n${canonical}`;
              }
              return shortName;
            }
            return label;
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 10 }}
          formatter={(value: string) =>
            OUTCOME_LABELS[value as EffectRating] || value
          }
        />
        {OUTCOME_ORDER.map((outcome) => (
          <Bar
            key={outcome}
            dataKey={outcome}
            fill={OUTCOME_COLORS[outcome]}
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// === Radar chart ===

function ProfileRadarChart({ items }: { items: CompareItemViz[] }) {
  // Compute raw values for 5 dimensions per compound
  const rawData = items.map((item) => {
    const bTotal = Object.values(item.outcomes.behavior).reduce(
      (a, b) => a + b,
      0
    );
    const cTotal = Object.values(item.outcomes.cellular).reduce(
      (a, b) => a + b,
      0
    );
    const mTotal = Object.values(item.outcomes.molecular).reduce(
      (a, b) => a + b,
      0
    );

    return {
      id: item.metadata.treatment_identifier,
      shortName: item.metadata.treatment_short,
      canonicalName: item.metadata.canonical_name,
      behaviorRescuePct: bTotal > 0 ? (item.outcomes.behavior.Rescue / bTotal) * 100 : 0,
      cellularRescuePct: cTotal > 0 ? (item.outcomes.cellular.Rescue / cTotal) * 100 : 0,
      molecularRescuePct: mTotal > 0 ? (item.outcomes.molecular.Rescue / mTotal) * 100 : 0,
      studyCount: item.metadata.study_count,
      modelDiversity: item.metadata.distinct_models.length,
    };
  });

  // Find max for each dimension for normalization
  const maxBehavior = Math.max(...rawData.map((d) => d.behaviorRescuePct), 1);
  const maxCellular = Math.max(...rawData.map((d) => d.cellularRescuePct), 1);
  const maxMolecular = Math.max(
    ...rawData.map((d) => d.molecularRescuePct),
    1
  );
  const maxStudy = Math.max(...rawData.map((d) => d.studyCount), 1);
  const maxModel = Math.max(...rawData.map((d) => d.modelDiversity), 1);

  // Build radar data: one object per axis
  const axes = [
    { key: "behavior", label: "Behavior\nRescue %" },
    { key: "cellular", label: "Cellular\nRescue %" },
    { key: "molecular", label: "Molecular\nRescue %" },
    { key: "studies", label: "Study\ncount" },
    { key: "models", label: "Model\ndiversity" },
  ];

  const radarData = axes.map((axis) => {
    const row: Record<string, string | number> = { axis: axis.label };
    for (const d of rawData) {
      let normalized = 0;
      if (axis.key === "behavior")
        normalized = (d.behaviorRescuePct / maxBehavior) * 100;
      else if (axis.key === "cellular")
        normalized = (d.cellularRescuePct / maxCellular) * 100;
      else if (axis.key === "molecular")
        normalized = (d.molecularRescuePct / maxMolecular) * 100;
      else if (axis.key === "studies")
        normalized = (d.studyCount / maxStudy) * 100;
      else if (axis.key === "models")
        normalized = (d.modelDiversity / maxModel) * 100;
      row[d.id] = Math.round(normalized);
    }
    return row;
  });

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const hexColors = isDark ? COMPOUND_HEX_DARK : COMPOUND_HEX_LIGHT;

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: "var(--text-tertiary)" }}
            tickCount={5}
          />
          {rawData.map((d, i) => (
            <Radar
              key={d.id}
              name={d.shortName}
              dataKey={d.id}
              stroke={hexColors[i % hexColors.length]}
              fill={hexColors[i % hexColors.length]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
      {/* Custom legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {rawData.map((d, i) => {
          const showTooltip = d.shortName !== d.canonicalName;
          return (
            <span
              key={d.id}
              className="inline-flex items-center gap-1.5 text-xs text-foreground"
              title={showTooltip ? d.canonicalName : undefined}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: hexColors[i % hexColors.length] }}
              />
              {d.shortName}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// === Main export ===

export function ComparisonVisualizations({
  items,
  selectedIds,
}: ComparisonVisualizationsProps) {
  const behaviorRef = useRef<HTMLDivElement>(null);
  const cellularRef = useRef<HTMLDivElement>(null);
  const molecularRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);

  const downloadBehavior = useChartDownload(
    behaviorRef,
    "behavioral-outcomes",
    selectedIds
  );
  const downloadCellular = useChartDownload(
    cellularRef,
    "cellular-outcomes",
    selectedIds
  );
  const downloadMolecular = useChartDownload(
    molecularRef,
    "molecular-outcomes",
    selectedIds
  );
  const downloadRadar = useChartDownload(
    radarRef,
    "multi-dimensional-profile",
    selectedIds
  );

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Visual comparison</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Behavioral outcomes */}
        <ChartCard
          heading="Behavioral outcomes side-by-side"
          description="% of experimental outcome per efficacy rating"
          chartRef={behaviorRef}
          onDownload={downloadBehavior}
        >
          <OutcomeBarChart items={items} axis="behavior" />
        </ChartCard>

        {/* Chart 2: Cellular / molecular function outcomes */}
        <ChartCard
          heading="Cellular / molecular function outcomes"
          description="% of experimental outcome per efficacy rating"
          chartRef={cellularRef}
          onDownload={downloadCellular}
        >
          <OutcomeBarChart items={items} axis="cellular" />
        </ChartCard>

        {/* Chart 3: Molecular target outcomes */}
        <ChartCard
          heading="Molecular target outcomes"
          description="% of experimental outcome per efficacy rating"
          chartRef={molecularRef}
          onDownload={downloadMolecular}
        >
          <OutcomeBarChart items={items} axis="molecular" />
        </ChartCard>

        {/* Chart 4: Multi-dimensional profile (radar) */}
        {items.length >= 2 ? (
          <ChartCard
            heading="Multi-dimensional profile"
            description="Normalized strength across 5 dimensions (0–100)"
            chartRef={radarRef}
            onDownload={downloadRadar}
          >
            <ProfileRadarChart items={items} />
          </ChartCard>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-surface p-4 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Select 2+ compounds for radar comparison
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
