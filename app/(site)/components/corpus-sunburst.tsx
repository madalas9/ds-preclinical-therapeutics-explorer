"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { CorpusStructureRow } from "@/src/lib/queries";

interface CorpusSunburstProps {
  data: CorpusStructureRow[];
  totalExperiments: number;
}

const SPECIES_COLORS: Record<string, { light: string; dark: string }> = {
  Mouse: { light: "#E69F00", dark: "#FFB84D" },
  Rat: { light: "#56B4E9", dark: "#7AC8F2" },
  "Fruit Fly": { light: "#009E73", dark: "#2DBC93" },
  Zebrafish: { light: "#0072B2", dark: "#2D8FCB" },
};

const MODEL_COLORS_LIGHT = [
  "#4477AA", "#228833", "#CCBB44", "#66CCEE", "#EE6677",
  "#AA3377", "#BBBBBB", "#6699CC", "#997700", "#994455",
];
const MODEL_COLORS_DARK = [
  "#6699CC", "#44AA55", "#DDCC66", "#88DDFF", "#FF8899",
  "#CC5599", "#CCCCCC", "#88AADD", "#BB9922", "#BB6677",
];

const CLASS_COLORS: Record<string, { light: string; dark: string }> = {
  Polyphenol: { light: "#B07AA1", dark: "#CB99C0" },
  "PUFA / Lipid": { light: "#FF9DA7", dark: "#FFB5BC" },
  Nutrient: { light: "#9C755F", dark: "#BF9080" },
  "Natural product": { light: "#BAB0AC", dark: "#D4CCC8" },
  Peptide: { light: "#4E79A7", dark: "#6E97C0" },
  "Approved drug": { light: "#76B7B2", dark: "#95CFC9" },
  Environmental: { light: "#76B7B2", dark: "#95CFC9" },
  "Small molecule": { light: "#59A14F", dark: "#7CC272" },
};

const COMPOUND_COLORS_LIGHT = [
  "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948",
  "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC", "#D37295", "#8CD17D",
];
const COMPOUND_COLORS_DARK = [
  "#6E97C0", "#F5A54D", "#E87779", "#95CFC9", "#7CC272", "#F2D56E",
  "#CB99C0", "#FFB5BC", "#BF9080", "#D4CCC8", "#E08CAF", "#A6E09A",
];

function getCompoundColor(treatmentId: string, isDark: boolean): string {
  const match = treatmentId.match(/DST(\d+)/);
  const num = match ? parseInt(match[1], 10) : 1;
  const palette = isDark ? COMPOUND_COLORS_DARK : COMPOUND_COLORS_LIGHT;
  return palette[(num - 1) % 12];
}

interface SunburstNode {
  name: string;
  value?: number;
  pctOfCorpus?: number;
  treatmentId?: string;  // DST## identifier for tooltip
  canonicalName?: string;  // Full canonical name for tooltip (treatment or model)
  itemStyle?: { color: string };
  children?: SunburstNode[];
}

function truncateName(name: string, maxLen = 24): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 2) + "…";
}

function buildSunburstData(
  data: CorpusStructureRow[],
  isDark: boolean,
  modelColorMap: Map<string, number>
): { nodes: SunburstNode[]; totalValue: number } {
  const totalValue = data.reduce((sum, row) => sum + row.count, 0);

  // Map structure: species -> { modelShort, modelCanonical } -> class -> { treatmentId -> compound data }
  const speciesMap = new Map<
    string,
    Map<string, { canonical: string; classes: Map<string, Map<string, { count: number; shortName: string; canonical: string }>> }>
  >();

  for (const row of data) {
    if (!speciesMap.has(row.species)) {
      speciesMap.set(row.species, new Map());
    }
    const modelMap = speciesMap.get(row.species)!;

    // Key by short model name, store canonical for tooltip
    if (!modelMap.has(row.model)) {
      modelMap.set(row.model, { canonical: row.model_name_canonical, classes: new Map() });
    }
    const modelEntry = modelMap.get(row.model)!;

    if (!modelEntry.classes.has(row.treatment_class)) {
      modelEntry.classes.set(row.treatment_class, new Map());
    }
    const compoundMap = modelEntry.classes.get(row.treatment_class)!;

    const existing = compoundMap.get(row.treatment_identifier);
    if (existing) {
      existing.count += row.count;
    } else {
      compoundMap.set(row.treatment_identifier, {
        count: row.count,
        shortName: row.treatment_short,
        canonical: row.canonical_treatment,
      });
    }
  }

  const result: SunburstNode[] = [];
  const modelPalette = isDark ? MODEL_COLORS_DARK : MODEL_COLORS_LIGHT;

  for (const [species, modelMap] of speciesMap) {
    const speciesColor = SPECIES_COLORS[species]?.[isDark ? "dark" : "light"] || "#999999";
    const speciesNode: SunburstNode = {
      name: species,
      itemStyle: { color: speciesColor },
      children: [],
    };

    for (const [modelShort, { canonical: modelCanonical, classes: classMap }] of modelMap) {
      const modelIndex = modelColorMap.get(modelShort) ?? 0;
      const modelColor = modelPalette[modelIndex % 10];
      const modelNode: SunburstNode = {
        name: modelShort,
        canonicalName: modelCanonical !== modelShort ? modelCanonical : undefined,
        itemStyle: { color: modelColor },
        children: [],
      };

      for (const [treatmentClass, compoundMap] of classMap) {
        const classColor = CLASS_COLORS[treatmentClass]?.[isDark ? "dark" : "light"] || "#BAB0AC";
        const classNode: SunburstNode = {
          name: treatmentClass,
          itemStyle: { color: classColor },
          children: [],
        };

        for (const [compoundId, { count, shortName, canonical }] of compoundMap) {
          const compoundColor = getCompoundColor(compoundId, isDark);
          classNode.children!.push({
            name: shortName,
            treatmentId: compoundId,
            canonicalName: canonical !== shortName ? canonical : undefined,
            value: count,
            pctOfCorpus: (count / totalValue) * 100,
            itemStyle: { color: compoundColor },
          });
        }

        // Compute pctOfCorpus for the class node
        const classTotal = (classNode.children || []).reduce(
          (sum, child) => sum + (child.value || 0), 0
        );
        classNode.pctOfCorpus = (classTotal / totalValue) * 100;

        modelNode.children!.push(classNode);
      }

      // Compute pctOfCorpus for the model node
      const modelTotal = (modelNode.children || []).reduce(
        (sum, child) => {
          // Sum values from grandchildren (compounds) since class nodes don't have value
          const classChildren = child.children || [];
          return sum + classChildren.reduce((s, c) => s + (c.value || 0), 0);
        }, 0
      );
      modelNode.pctOfCorpus = (modelTotal / totalValue) * 100;

      speciesNode.children!.push(modelNode);
    }

    result.push(speciesNode);
  }

  return { nodes: result, totalValue };
}

export function CorpusSunburst({ data, totalExperiments }: CorpusSunburstProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const modelColorMap = new Map<string, number>();
  const uniqueModels = [...new Set(data.map((d) => d.model))].sort();
  uniqueModels.forEach((model, index) => {
    modelColorMap.set(model, index);
  });

  // Dispose chart on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  // ResizeObserver effect: re-layout when container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        chartInstance.current?.resize();
      }, 100);
    });
    observer.observe(container);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, []);

  // Main chart rendering effect
  useEffect(() => {
    if (!chartRef.current) return;

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#F1F5F9" : "#0F172A";
    const textSecondary = isDark ? "#94A3B8" : "#475569";
    const bgColor = isDark ? "#0B1220" : "#F8FAFC";

    // Dispose old instance to prevent stale state on re-mount
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }
    chartInstance.current = echarts.init(chartRef.current);

    const { nodes: sunburstData } = buildSunburstData(data, isDark, modelColorMap);

    const makeLabelFormatter = (minPct: number) => {
      return (params: unknown) => {
        const p = params as { name: string; data?: { pctOfCorpus?: number } };
        const pct = p.data?.pctOfCorpus ?? 0;
        if (pct < minPct) return "";
        return p.name;
      };
    };

    const levels = [
      {},
      {
        r0: "0%",
        r: "20%",
        itemStyle: { borderWidth: 2, borderColor: bgColor },
        label: {
          rotate: "radial" as const,
          fontSize: 16,
          fontFamily: "Atkinson Hyperlegible, sans-serif",
          fontWeight: 600,
          color: textColor,
        },
      },
      {
        r0: "20%",
        r: "45%",
        itemStyle: { borderWidth: 1.5, borderColor: bgColor },
        label: {
          rotate: "radial" as const,
          fontSize: 12,
          fontFamily: "Atkinson Hyperlegible, sans-serif",
          color: textColor,
          minAngle: 5,
          formatter: makeLabelFormatter(2.0),
        },
        labelLayout: { hideOverlap: true },
      },
      {
        r0: "45%",
        r: "68%",
        itemStyle: { borderWidth: 1, borderColor: bgColor },
        label: {
          rotate: "radial" as const,
          fontSize: 11,
          fontFamily: "Atkinson Hyperlegible, sans-serif",
          color: textColor,
          minAngle: 4,
          formatter: makeLabelFormatter(1.5),
        },
        labelLayout: { hideOverlap: true },
      },
      {
        r0: "68%",
        r: "92%",
        itemStyle: { borderWidth: 1, borderColor: bgColor },
        label: {
          rotate: "radial" as const,
          fontSize: 11,
          fontFamily: "Atkinson Hyperlegible, sans-serif",
          color: textColor,
          minAngle: 3,
          formatter: (params: unknown) => {
            const p = params as { name: string; data?: { pctOfCorpus?: number } };
            const pct = p.data?.pctOfCorpus ?? 0;
            if (pct < 2.5) return "";
            return truncateName(p.name, 24);
          },
        },
        labelLayout: { hideOverlap: true },
      },
    ];

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      animationDuration: 0,
      animationDurationUpdate: 800,
      animationEasingUpdate: "cubicInOut",
      tooltip: {
        trigger: "item",
        padding: 12,
        textStyle: {
          fontSize: 14,
          fontFamily: "Atkinson Hyperlegible, sans-serif",
          color: textColor,
        },
        backgroundColor: isDark ? "#111827" : "#FFFFFF",
        borderColor: isDark ? "#334155" : "#E2E8F0",
        formatter: (params: unknown) => {
          const p = params as {
            name: string;
            value: number;
            data?: { treatmentId?: string; canonicalName?: string };
            treePathInfo: Array<{ name: string; data?: { canonicalName?: string } }>;
          };
          const ancestors = p.treePathInfo || [];
          const path = ancestors.slice(1).map((a) => a.name).join(" → ");
          const idSuffix = p.data?.treatmentId ? ` [${p.data.treatmentId}]` : "";

          // Build extra lines for full names when they differ from short names
          const extraLines: string[] = [];

          // Check compound (leaf node) canonical name
          if (p.data?.canonicalName) {
            extraLines.push(`Full name: ${p.data.canonicalName}`);
          }

          // Check model (level 2, index 2 in treePathInfo) canonical name
          const modelNode = ancestors[2];
          if (modelNode?.data?.canonicalName) {
            extraLines.push(`Full model: ${modelNode.data.canonicalName}`);
          }

          const extraHtml = extraLines.length > 0
            ? `<br/><span style="color: #94A3B8; font-size: 12px;">${extraLines.join("<br/>")}</span>`
            : "";

          return `<div style="font-family: Atkinson Hyperlegible, sans-serif;"><strong>${path}${idSuffix}</strong>${extraHtml}<br/>${p.value} experiments</div>`;
        },
      },
      series: [
        {
          type: "sunburst",
          data: sunburstData,
          radius: ["0%", "92%"],
          sort: undefined,
          nodeClick: "rootToNode",
          emphasis: {
            focus: "ancestor",
          },
          levels,
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "center",
          style: {
            text: `${totalExperiments}`,
            fontSize: 56,
            fontWeight: "bold",
            fontFamily: "Atkinson Hyperlegible, sans-serif",
            fill: textColor,
            align: "center",
          },
        },
        {
          type: "text",
          left: "center",
          top: "53%",
          style: {
            text: "experiments",
            fontSize: 16,
            fontFamily: "Atkinson Hyperlegible, sans-serif",
            fill: textSecondary,
            align: "center",
          },
        },
      ],
    };

    chartInstance.current.setOption(option, { notMerge: true, lazyUpdate: false });

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);

    const themeObserver = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains("dark");
      const newTextColor = nowDark ? "#F1F5F9" : "#0F172A";
      const newTextSecondary = nowDark ? "#94A3B8" : "#475569";
      const newBgColor = nowDark ? "#0B1220" : "#F8FAFC";
      const { nodes: newData } = buildSunburstData(data, nowDark, modelColorMap);

      // Rebuild levels with new theme colors so formatters use fresh textColor
      const newLevels = [
        {},
        {
          r0: "0%",
          r: "20%",
          itemStyle: { borderWidth: 2, borderColor: newBgColor },
          label: {
            rotate: "radial" as const,
            fontSize: 16,
            fontFamily: "Atkinson Hyperlegible, sans-serif",
            fontWeight: 600,
            color: newTextColor,
          },
        },
        {
          r0: "20%",
          r: "45%",
          itemStyle: { borderWidth: 1.5, borderColor: newBgColor },
          label: {
            rotate: "radial" as const,
            fontSize: 12,
            fontFamily: "Atkinson Hyperlegible, sans-serif",
            color: newTextColor,
            minAngle: 5,
            formatter: makeLabelFormatter(2.0),
          },
          labelLayout: { hideOverlap: true },
        },
        {
          r0: "45%",
          r: "68%",
          itemStyle: { borderWidth: 1, borderColor: newBgColor },
          label: {
            rotate: "radial" as const,
            fontSize: 11,
            fontFamily: "Atkinson Hyperlegible, sans-serif",
            color: newTextColor,
            minAngle: 4,
            formatter: makeLabelFormatter(1.5),
          },
          labelLayout: { hideOverlap: true },
        },
        {
          r0: "68%",
          r: "92%",
          itemStyle: { borderWidth: 1, borderColor: newBgColor },
          label: {
            rotate: "radial" as const,
            fontSize: 11,
            fontFamily: "Atkinson Hyperlegible, sans-serif",
            color: newTextColor,
            minAngle: 3,
            formatter: (params: unknown) => {
              const p = params as { name: string; data?: { pctOfCorpus?: number } };
              const pct = p.data?.pctOfCorpus ?? 0;
              if (pct < 2.5) return "";
              return truncateName(p.name, 24);
            },
          },
          labelLayout: { hideOverlap: true },
        },
      ];

      chartInstance.current?.setOption({
        tooltip: {
          backgroundColor: nowDark ? "#111827" : "#FFFFFF",
          borderColor: nowDark ? "#334155" : "#E2E8F0",
          textStyle: { color: newTextColor },
        },
        series: [{ data: newData, levels: newLevels }],
        graphic: [
          { style: { fill: newTextColor } },
          { style: { fill: newTextSecondary } },
        ],
      });
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      themeObserver.disconnect();
    };
  }, [data, totalExperiments, modelColorMap]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: 900, minWidth: 280 }}
    >
      <div
        ref={chartRef}
        className="absolute inset-0"
        style={{ minHeight: 600 }}
      />
    </div>
  );
}
