"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, ChevronDown, Search, ArrowRight, AlertTriangle } from "lucide-react";
import type { EffectRating } from "@/src/lib/types";
import { OUTCOME_ORDER } from "@/src/lib/types";
import type { TreatmentMetadata, TreatmentOutcomeBreakdowns } from "@/src/lib/queries";
import { ComparisonVisualizations } from "./comparison-visualizations";

// === Types ===

export interface CompareItem {
  metadata: TreatmentMetadata;
  outcomes: TreatmentOutcomeBreakdowns;
}

interface CompareGridProps {
  items: CompareItem[];
  selectedIds: string[];
  allTreatments: { treatment_identifier: string; canonical_name: string; treatment_short: string }[];
}

// === Outcome bar colors ===

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

const NT_TOOLTIP = "Not Tested — this outcome axis was not measured.";

// === Compact outcome bar ===

function CompactOutcomeBar({
  label,
  counts,
}: {
  label: string;
  counts: Record<EffectRating, number>;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="space-y-1">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className="h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">No data</span>
        </div>
      </div>
    );
  }

  const segments = OUTCOME_ORDER.filter((o) => counts[o] > 0);

  return (
    <div className="space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="flex h-5 w-full items-center gap-px overflow-hidden rounded">
        {segments.map((outcome) => {
          const pct = (counts[outcome] / total) * 100;
          return (
            <div
              key={outcome}
              className={`h-full ${OUTCOME_COLORS[outcome]} relative flex items-center justify-center`}
              style={{ width: `${pct}%`, minWidth: pct > 0 ? 4 : 0 }}
              title={outcome === "NA"
                ? `${NT_TOOLTIP}\n${counts[outcome]} conditions (${Math.round(pct)}%)`
                : `${OUTCOME_LABELS[outcome]}: ${counts[outcome]} (${Math.round(pct)}%)`}
            >
              {pct >= 18 && (
                <span className="text-[9px] font-medium text-white drop-shadow-sm">
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        {segments.map((outcome) => (
          <span
            key={outcome}
            className="text-[10px] text-muted-foreground"
            title={outcome === "NA" ? NT_TOOLTIP : undefined}
          >
            <span
              className={`inline-block h-2 w-2 rounded-sm ${OUTCOME_COLORS[outcome]} mr-0.5 align-middle`}
            />
            {OUTCOME_LABELS[outcome]}: {counts[outcome]}
          </span>
        ))}
      </div>
    </div>
  );
}

// === Treatment picker combobox ===

function TreatmentPicker({
  allTreatments,
  excludeIds,
  onSelect,
}: {
  allTreatments: { treatment_identifier: string; canonical_name: string; treatment_short: string }[];
  excludeIds: string[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = useMemo(() => {
    const excludeSet = new Set(excludeIds);
    const searchLower = search.toLowerCase();
    return allTreatments
      .filter((t) => !excludeSet.has(t.treatment_identifier))
      .filter(
        (t) =>
          !searchLower ||
          t.treatment_identifier.toLowerCase().includes(searchLower) ||
          t.canonical_name.toLowerCase().includes(searchLower) ||
          t.treatment_short.toLowerCase().includes(searchLower)
      );
  }, [allTreatments, excludeIds, search]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[44px] w-full items-center gap-1.5 rounded-md border-2 border-dashed border-border bg-surface px-3 text-sm text-muted-foreground hover:border-interactive hover:text-foreground cursor-pointer transition-colors touch-manipulation"
      >
        <span className="text-lg leading-none">+</span>
        <span>Add treatment</span>
        <ChevronDown className="h-3.5 w-3.5 ml-auto" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full min-w-[280px] rounded-md border border-border bg-surface shadow-lg">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or DST ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-7 pr-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-interactive"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No treatments found
              </div>
            ) : (
              filtered.map((t) => {
                const showBoth = t.treatment_short !== t.canonical_name;
                return (
                  <button
                    key={t.treatment_identifier}
                    type="button"
                    onClick={() => {
                      onSelect(t.treatment_identifier);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-xs text-foreground hover:bg-surface-muted cursor-pointer text-left"
                  >
                    <span className="font-mono text-muted-foreground shrink-0">
                      {t.treatment_identifier}
                    </span>
                    <span className="min-w-0">
                      {showBoth ? (
                        <>
                          <span className="font-medium">{t.treatment_short}</span>
                          <span className="text-muted-foreground"> · {t.canonical_name}</span>
                        </>
                      ) : (
                        <span>{t.canonical_name}</span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// === Compare card ===

function CompareCard({
  item,
  onRemove,
  isLast,
}: {
  item: CompareItem;
  onRemove: () => void;
  isLast: boolean;
}) {
  const { metadata: meta, outcomes } = item;

  // Caveats
  const caveats: string[] = [];
  if (meta.study_count <= 2) caveats.push("Thin evidence (≤2 studies)");
  if (meta.distinct_species.length === 1)
    caveats.push(`Single species: ${meta.distinct_species[0]}`);
  if (meta.treatment_original_variants.length > 0)
    caveats.push("Variants exist");

  // Sex composition
  const sexEntries = Object.entries(meta.sex_breakdown).filter(
    ([k]) => k !== "NA"
  );
  const totalSexed = sexEntries.reduce((a, [, v]) => a + v, 0);
  const malesOnly = meta.sex_breakdown["Males only"] || 0;
  const maleBiased = totalSexed > 0 && malesOnly / totalSexed > 0.7;

  return (
    <div
      className={`p-4 space-y-5 ${!isLast ? "border-r border-border max-md:border-r-0 max-md:border-b max-md:pb-6" : ""}`}
    >
      {/* Section 1: Identity */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {meta.treatment_identifier}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 hover:bg-surface-muted cursor-pointer text-muted-foreground hover:text-foreground shrink-0"
            title="Remove from comparison"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <h3 className="text-lg font-semibold text-foreground leading-tight">
          {meta.canonical_name}
        </h3>
        <Link
          href={`/treatments/${meta.treatment_identifier}`}
          className="inline-flex items-center gap-1 text-xs text-interactive hover:text-interactive-hover"
        >
          View detail
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Section 2: Key stats */}
      <div className="space-y-1.5">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Evidence summary
        </h4>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Experiments</dt>
          <dd className="text-foreground font-medium">{meta.experiment_count}</dd>

          <dt className="text-muted-foreground">Studies</dt>
          <dd className="text-foreground font-medium">{meta.study_count}</dd>

          <dt className="text-muted-foreground">Models</dt>
          <dd className="text-foreground">
            {meta.distinct_models.slice(0, 2).map((m) => m.name).join(", ")}
            {meta.distinct_models.length > 2 && (
              <span className="text-muted-foreground">
                {" "}
                +{meta.distinct_models.length - 2} more
              </span>
            )}
          </dd>

          <dt className="text-muted-foreground">Species</dt>
          <dd className="text-foreground">{meta.distinct_species.join(", ")}</dd>

          {meta.dominant_administration_route && (
            <>
              <dt className="text-muted-foreground">Route</dt>
              <dd className="text-foreground">
                {meta.dominant_administration_route}
              </dd>
            </>
          )}

          {meta.dose_examples.length > 0 && (
            <>
              <dt className="text-muted-foreground">Sample doses</dt>
              <dd className="text-foreground text-[11px]">
                {meta.dose_examples.slice(0, 2).join("; ")}
              </dd>
            </>
          )}
        </dl>
      </div>

      {/* Section 3: Three-axis outcomes */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Outcome profile
        </h4>
        <CompactOutcomeBar label="Behavior" counts={outcomes.behavior} />
        <CompactOutcomeBar label="Cellular" counts={outcomes.cellular} />
        <CompactOutcomeBar label="Molecular" counts={outcomes.molecular} />
      </div>

      {/* Section 4: Sex composition */}
      {sexEntries.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Sex composition
          </h4>
          <p className="text-xs text-muted-foreground">
            {sexEntries.map(([k, v]) => `${k}: ${v}`).join(" · ")}
          </p>
          {maleBiased && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Male-biased
            </span>
          )}
        </div>
      )}

      {/* Section 5: Evidence caveats */}
      {caveats.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Caveats
          </h4>
          <ul className="space-y-0.5">
            {caveats.map((c) => (
              <li key={c} className="text-[11px] text-muted-foreground">
                • {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// === Main CompareGrid ===

export function CompareGrid({
  items,
  selectedIds,
  allTreatments,
}: CompareGridProps) {
  const router = useRouter();

  const addId = (id: string) => {
    const newIds = [...new Set([...selectedIds, id])].slice(0, 4);
    router.replace(`/compare?ids=${newIds.join(",")}`);
  };

  const removeId = (id: string) => {
    const newIds = selectedIds.filter((x) => x !== id);
    if (newIds.length === 0) {
      router.replace("/compare");
    } else {
      router.replace(`/compare?ids=${newIds.join(",")}`);
    }
  };

  const clearAll = () => {
    router.replace("/compare");
  };

  const count = items.length;
  const emptySlots = Math.max(0, 4 - count);

  // Compute grid class based on count
  const gridClass =
    count <= 1
      ? "grid grid-cols-1 max-w-xl"
      : count === 2
        ? "grid grid-cols-1 md:grid-cols-2"
        : count === 3
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  // Empty state
  if (count === 0) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-bold text-foreground">
            Compare treatments
          </h1>
          <p className="text-muted-foreground mt-1">
            0 of 4 maximum selected · Side-by-side evidence comparison
          </p>
        </div>

        {/* Centered empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Select up to 4 treatments to compare
          </h2>
          <p className="text-muted-foreground max-w-md">
            Side-by-side evidence trail for any 2–4 compounds from the Down
            syndrome preclinical corpus.
          </p>
          <div className="w-full max-w-xs">
            <TreatmentPicker
              allTreatments={allTreatments}
              excludeIds={selectedIds}
              onSelect={addId}
            />
          </div>
          <Link
            href="/compare?ids=DST29,DST16,DST38"
            className="text-sm text-interactive hover:text-interactive-hover hover:underline mt-2"
          >
            Try a sample comparison →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-foreground">
          Compare treatments
        </h1>
        <p className="text-muted-foreground mt-1">
          {count} of 4 maximum selected · Side-by-side evidence comparison
        </p>
      </div>

      {/* Picker bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filled slots */}
        {items.map((item) => {
          const treatmentData = allTreatments.find(
            (t) => t.treatment_identifier === item.metadata.treatment_identifier
          );
          const shortName = treatmentData?.treatment_short || item.metadata.canonical_name;
          const showTooltip = shortName !== item.metadata.canonical_name;
          return (
            <div
              key={item.metadata.treatment_identifier}
              className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs"
              title={showTooltip ? item.metadata.canonical_name : undefined}
            >
              <span className="font-mono text-muted-foreground">
                {item.metadata.treatment_identifier}
              </span>
              <span className="text-foreground font-medium truncate max-w-[180px]">
                {shortName}
              </span>
              <button
                type="button"
                onClick={() => removeId(item.metadata.treatment_identifier)}
                className="rounded p-0.5 hover:bg-surface-muted cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className="w-[220px]">
            <TreatmentPicker
              allTreatments={allTreatments}
              excludeIds={selectedIds}
              onSelect={addId}
            />
          </div>
        ))}

        {/* Clear all */}
        {count > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer ml-auto"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Single-card hint */}
      {count === 1 && (
        <p className="text-sm text-muted-foreground">
          Add another treatment to start comparing side-by-side.
        </p>
      )}

      {/* Comparison grid */}
      <div
        className={`${gridClass} rounded-md border border-border bg-surface`}
      >
        {items.map((item, i) => (
          <CompareCard
            key={item.metadata.treatment_identifier}
            item={item}
            onRemove={() => removeId(item.metadata.treatment_identifier)}
            isLast={i === items.length - 1}
          />
        ))}
      </div>

      {/* Visual comparison charts */}
      <ComparisonVisualizations items={items} selectedIds={selectedIds} />
    </div>
  );
}
