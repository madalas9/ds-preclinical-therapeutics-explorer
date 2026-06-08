"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Intervention, EffectRating } from "@/src/lib/types";
import { OutcomeBadge } from "../../treatments/components/outcome-badge";

// === Types ===

export interface EnrichedIntervention extends Intervention {
  treatment_class_hint: string;
}

export interface FilterOptions {
  treatment_identifiers: string[];
  treatmentMap: Record<string, string>;
  treatmentShortMap: Record<string, string>;
  modelShortMap: Record<string, string>;
  species: string[];
  model_names: string[];
  sex: string[];
  administration_routes: string[];
  behavior_outcomes: string[];
  cellular_outcomes: string[];
  molecular_outcomes: string[];
  treatment_classes: string[];
}

interface ExperimentsBrowserProps {
  data: EnrichedIntervention[];
  totalCount: number;
  filterOptions: FilterOptions;
}

// === Filter state type ===

interface FilterState {
  search: string;
  treatment: Set<string>;
  treatmentClass: Set<string>;
  species: Set<string>;
  model: Set<string>;
  sex: Set<string>;
  route: Set<string>;
  behaviorOutcome: Set<string>;
  cellularOutcome: Set<string>;
  molecularOutcome: Set<string>;
}

const EMPTY_FILTERS: FilterState = {
  search: "",
  treatment: new Set(),
  treatmentClass: new Set(),
  species: new Set(),
  model: new Set(),
  sex: new Set(),
  route: new Set(),
  behaviorOutcome: new Set(),
  cellularOutcome: new Set(),
  molecularOutcome: new Set(),
};

// === MultiSelectFilter Component ===

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  renderLabel,
}: {
  label: string;
  options: { value: string; count: number }[];
  selected: Set<string>;
  onChange: (values: Set<string>) => void;
  renderLabel?: (value: string) => string;
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

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground hover:bg-surface-muted cursor-pointer whitespace-nowrap"
      >
        {label}
        {selected.size > 0 && (
          <span className="rounded-full bg-accent-rescue px-1.5 text-[10px] text-white font-medium">
            {selected.size}
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[200px] max-h-[300px] overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg">
          {options
            .filter(({ value: opt, count }) => count > 0 || selected.has(opt))
            .map(({ value: opt, count }) => {
              const isZeroButSelected = count === 0 && selected.has(opt);
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-surface-muted ${isZeroButSelected ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(opt)}
                    onChange={() => toggle(opt)}
                    className="h-3.5 w-3.5 rounded border-border"
                  />
                  <span className={isZeroButSelected ? "text-muted-foreground" : "text-foreground"}>
                    {renderLabel ? renderLabel(opt) : opt}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                    {count}
                  </span>
                </label>
              );
            })}
        </div>
      )}
    </div>
  );
}

// === Chip component ===

function FilterChip({
  label,
  value,
  shortValue,
  onRemove,
}: {
  label: string;
  value: string;
  shortValue?: string;
  onRemove: () => void;
}) {
  const displayValue = shortValue || value;
  const showTitle = shortValue && shortValue !== value;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-muted px-2 py-0.5 text-xs text-foreground"
      title={showTitle ? value : undefined}
    >
      <span className="text-muted-foreground">{label}:</span> {displayValue}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded hover:bg-border p-0.5 cursor-pointer"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// === Helper: extract citation ===

function extractCitation(reference: string): string {
  if (!reference || reference === "NA") return reference;
  const match = reference.match(/^([^,]+,?\s*\d{4})/);
  return match ? match[1] : reference.slice(0, 30);
}

// === Helper: export CSV ===

function exportCSV(rows: EnrichedIntervention[]) {
  const headers = [
    "treatment_identifier",
    "treatment",
    "treatment_class",
    "reference",
    "species",
    "model_name",
    "sex",
    "dose",
    "administration_route",
    "age_at_treatment",
    "age_at_testing",
    "tissue_or_organ",
    "celltype",
    "cellular_or_molecular_function_tested",
    "cellular_or_molecular_effect_rating",
    "gene__transcript__protein_of_interest",
    "molecular_effect_rating",
    "behavior_task_of_interest",
    "behavior_effect_rating",
    "reference_with_link_to_publication",
  ];

  const csvRows = [headers.join(",")];
  for (const row of rows) {
    const values = [
      row.treatment_identifier,
      row.treatment,
      row.treatment_class_hint,
      row.reference,
      row.species,
      row.model_name,
      row.sex_of_animals_and_sex_differences,
      row.dose,
      row.administration_route,
      row.age_at_treatment,
      row.age_at_testing,
      row.tissue_or_organ,
      row.celltype,
      row.cellular_or_molecular_function_tested,
      row.cellular_or_molecular_effect_rating,
      row.gene__transcript__protein_of_interest,
      row.molecular_effect_rating,
      row.behavior_task_of_interest,
      row.behavior_effect_rating,
      row.reference_with_link_to_publication,
    ];
    csvRows.push(
      values
        .map((v) => {
          const str = String(v ?? "");
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    );
  }

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "experiments.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// === Mobile filter sheet ===

function MobileFilterSheet({
  open,
  onClose,
  filters,
  setFilters,
  filterOptions,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filterOptions: FilterOptions;
}) {
  if (!open) return null;

  const updateSet = (
    key: keyof Omit<FilterState, "search">,
    values: Set<string>
  ) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-[min(85vw,360px)] bg-surface border-l border-border overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Filters</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-muted cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search all text fields..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Mobile filter sections */}
          <MobileFilterSection
            label="Treatment"
            options={filterOptions.treatment_identifiers}
            selected={filters.treatment}
            onChange={(v) => updateSet("treatment", v)}
            renderLabel={(id) => {
              const short = filterOptions.treatmentShortMap[id] || id;
              const canonical = filterOptions.treatmentMap[id] || id;
              return short !== canonical ? `${short} · ${canonical}` : short;
            }}
          />
          <MobileFilterSection
            label="Treatment class"
            options={filterOptions.treatment_classes}
            selected={filters.treatmentClass}
            onChange={(v) => updateSet("treatmentClass", v)}
          />
          <MobileFilterSection
            label="Species"
            options={filterOptions.species}
            selected={filters.species}
            onChange={(v) => updateSet("species", v)}
          />
          <MobileFilterSection
            label="Model"
            options={filterOptions.model_names}
            selected={filters.model}
            onChange={(v) => updateSet("model", v)}
            renderLabel={(modelName) => {
              const short = filterOptions.modelShortMap[modelName] || modelName;
              return short !== modelName ? `${short} · ${modelName}` : modelName;
            }}
          />
          <MobileFilterSection
            label="Sex"
            options={filterOptions.sex}
            selected={filters.sex}
            onChange={(v) => updateSet("sex", v)}
          />
          <MobileFilterSection
            label="Administration route"
            options={filterOptions.administration_routes}
            selected={filters.route}
            onChange={(v) => updateSet("route", v)}
          />
          <MobileFilterSection
            label="Behavior outcome"
            options={filterOptions.behavior_outcomes}
            selected={filters.behaviorOutcome}
            onChange={(v) => updateSet("behaviorOutcome", v)}
          />
          <MobileFilterSection
            label="Cellular outcome"
            options={filterOptions.cellular_outcomes}
            selected={filters.cellularOutcome}
            onChange={(v) => updateSet("cellularOutcome", v)}
          />
          <MobileFilterSection
            label="Molecular outcome"
            options={filterOptions.molecular_outcomes}
            selected={filters.molecularOutcome}
            onChange={(v) => updateSet("molecularOutcome", v)}
          />
        </div>
      </div>
    </>
  );
}

function MobileFilterSection({
  label,
  options,
  selected,
  onChange,
  renderLabel,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (values: Set<string>) => void;
  renderLabel?: (value: string) => string;
}) {
  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  };

  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
        {label}
        {selected.size > 0 && (
          <span className="ml-1.5 rounded-full bg-accent-rescue px-1.5 text-[10px] text-white font-medium normal-case">
            {selected.size}
          </span>
        )}
      </label>
      <div className="max-h-[160px] overflow-y-auto rounded-md border border-border p-1">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-surface-muted"
          >
            <input
              type="checkbox"
              checked={selected.has(opt)}
              onChange={() => toggle(opt)}
              className="h-3.5 w-3.5 rounded border-border"
            />
            <span className="text-foreground">
              {renderLabel ? renderLabel(opt) : opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// === Sticky horizontal scrollbar hook ===

function useStickyScrollbar(
  tableScrollRef: React.RefObject<HTMLDivElement | null>
) {
  const floatingRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  // IntersectionObserver on sentinel: show bar when sentinel is below viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Hide when table is completely off-screen
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    if (!tableEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsVisible(false);
        }
      },
      { threshold: 0 }
    );

    observer.observe(tableEl);
    return () => observer.disconnect();
  }, [tableScrollRef]);

  // Sync inner width and position of floating bar to match table
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    const innerEl = innerRef.current;
    const floatingEl = floatingRef.current;
    if (!tableEl || !innerEl || !floatingEl) return;

    const syncWidthAndPosition = () => {
      const rect = tableEl.getBoundingClientRect();
      innerEl.style.width = `${tableEl.scrollWidth}px`;
      floatingEl.style.left = `${rect.left}px`;
      floatingEl.style.width = `${rect.width}px`;
    };

    syncWidthAndPosition();

    const ro = new ResizeObserver(syncWidthAndPosition);
    ro.observe(tableEl);

    window.addEventListener("scroll", syncWidthAndPosition, { passive: true });
    window.addEventListener("resize", syncWidthAndPosition, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", syncWidthAndPosition);
      window.removeEventListener("resize", syncWidthAndPosition);
    };
  }, [tableScrollRef, floatingRef, innerRef]);

  // Bidirectional scroll sync
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    const floatingEl = floatingRef.current;
    if (!tableEl || !floatingEl) return;

    const onTableScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      floatingEl.scrollLeft = tableEl.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    const onFloatingScroll = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      tableEl.scrollLeft = floatingEl.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    };

    tableEl.addEventListener("scroll", onTableScroll, { passive: true });
    floatingEl.addEventListener("scroll", onFloatingScroll, { passive: true });

    return () => {
      tableEl.removeEventListener("scroll", onTableScroll);
      floatingEl.removeEventListener("scroll", onFloatingScroll);
    };
  }, [tableScrollRef]);

  return { floatingRef, sentinelRef, innerRef, isVisible };
}

// === Main Component ===

export function ExperimentsBrowser({
  data,
  totalCount,
  filterOptions,
}: ExperimentsBrowserProps) {
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "treatment_identifier", desc: false },
  ]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const { floatingRef, sentinelRef, innerRef, isVisible } =
    useStickyScrollbar(tableScrollRef);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 200);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch !== "" ||
      filters.treatment.size > 0 ||
      filters.treatmentClass.size > 0 ||
      filters.species.size > 0 ||
      filters.model.size > 0 ||
      filters.sex.size > 0 ||
      filters.route.size > 0 ||
      filters.behaviorOutcome.size > 0 ||
      filters.cellularOutcome.size > 0 ||
      filters.molecularOutcome.size > 0
    );
  }, [filters, debouncedSearch]);

  const clearAllFilters = useCallback(() => {
    setFilters({
      search: "",
      treatment: new Set(),
      treatmentClass: new Set(),
      species: new Set(),
      model: new Set(),
      sex: new Set(),
      route: new Set(),
      behaviorOutcome: new Set(),
      cellularOutcome: new Set(),
      molecularOutcome: new Set(),
    });
    setDebouncedSearch("");
  }, []);

  // Client-side filtering
  const filteredData = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    return data.filter((row) => {
      // Text search across multiple fields
      if (searchLower) {
        const searchFields = [
          row.treatment,
          row.reference,
          row.model_name,
          row.gene__transcript__protein_of_interest,
          row.cellular_or_molecular_function_tested,
          row.behavior_task_of_interest,
          row.tissue_or_organ,
          row.celltype,
          row.treatment_identifier,
        ];
        const matches = searchFields.some(
          (f) => f && f.toLowerCase().includes(searchLower)
        );
        if (!matches) return false;
      }

      if (
        filters.treatment.size > 0 &&
        !filters.treatment.has(row.treatment_identifier)
      )
        return false;
      if (
        filters.treatmentClass.size > 0 &&
        !filters.treatmentClass.has(row.treatment_class_hint)
      )
        return false;
      if (filters.species.size > 0 && !filters.species.has(row.species))
        return false;
      if (filters.model.size > 0 && !filters.model.has(row.model_name))
        return false;
      if (
        filters.sex.size > 0 &&
        !filters.sex.has(row.sex_of_animals_and_sex_differences)
      )
        return false;
      if (
        filters.route.size > 0 &&
        !filters.route.has(row.administration_route)
      )
        return false;
      if (
        filters.behaviorOutcome.size > 0 &&
        !filters.behaviorOutcome.has(row.behavior_effect_rating)
      )
        return false;
      if (
        filters.cellularOutcome.size > 0 &&
        !filters.cellularOutcome.has(
          row.cellular_or_molecular_effect_rating
        )
      )
        return false;
      if (
        filters.molecularOutcome.size > 0 &&
        !filters.molecularOutcome.has(row.molecular_effect_rating)
      )
        return false;

      return true;
    });
  }, [data, debouncedSearch, filters]);

  // Build active filter chips
  const activeChips = useMemo(() => {
    const chips: { label: string; value: string; shortValue?: string; key: string; filterKey: keyof Omit<FilterState, "search">; filterValue: string }[] = [];
    for (const id of filters.treatment) {
      const canonical = filterOptions.treatmentMap[id] || id;
      const short = filterOptions.treatmentShortMap[id] || canonical;
      chips.push({
        label: "Treatment",
        value: canonical,
        shortValue: short,
        key: `treatment-${id}`,
        filterKey: "treatment",
        filterValue: id,
      });
    }
    for (const v of filters.treatmentClass) {
      chips.push({ label: "Class", value: v, key: `class-${v}`, filterKey: "treatmentClass", filterValue: v });
    }
    for (const v of filters.species) {
      chips.push({ label: "Species", value: v, key: `species-${v}`, filterKey: "species", filterValue: v });
    }
    for (const v of filters.model) {
      const short = filterOptions.modelShortMap[v] || v;
      chips.push({
        label: "Model",
        value: v,
        shortValue: short !== v ? short : undefined,
        key: `model-${v}`,
        filterKey: "model",
        filterValue: v,
      });
    }
    for (const v of filters.sex) {
      chips.push({ label: "Sex", value: v, key: `sex-${v}`, filterKey: "sex", filterValue: v });
    }
    for (const v of filters.route) {
      chips.push({ label: "Route", value: v, key: `route-${v}`, filterKey: "route", filterValue: v });
    }
    for (const v of filters.behaviorOutcome) {
      chips.push({ label: "Behavior", value: v, key: `beh-${v}`, filterKey: "behaviorOutcome", filterValue: v });
    }
    for (const v of filters.cellularOutcome) {
      chips.push({ label: "Cellular", value: v, key: `cell-${v}`, filterKey: "cellularOutcome", filterValue: v });
    }
    for (const v of filters.molecularOutcome) {
      chips.push({ label: "Molecular", value: v, key: `mol-${v}`, filterKey: "molecularOutcome", filterValue: v });
    }
    return chips;
  }, [filters, filterOptions.treatmentMap, filterOptions.treatmentShortMap, filterOptions.modelShortMap]);

  const removeChip = useCallback(
    (filterKey: keyof Omit<FilterState, "search">, filterValue: string) => {
      setFilters((prev) => {
        const next = new Set(prev[filterKey]);
        next.delete(filterValue);
        return { ...prev, [filterKey]: next };
      });
    },
    []
  );

  const updateFilterSet = useCallback(
    (key: keyof Omit<FilterState, "search">, values: Set<string>) => {
      setFilters((prev) => ({ ...prev, [key]: values }));
    },
    []
  );

  // === Cascading filter options ===
  // For each filter F, compute options from rows matching all OTHER filters (not F itself).
  // This prevents dead-end selections.

  // Helper: filter rows applying all filters EXCEPT the excluded one, plus search
  const filterRowsExcluding = useCallback(
    (excludeKey: keyof Omit<FilterState, "search">) => {
      const searchLower = debouncedSearch.toLowerCase();
      return data.filter((row) => {
        if (searchLower) {
          const searchFields = [
            row.treatment, row.reference, row.model_name,
            row.gene__transcript__protein_of_interest,
            row.cellular_or_molecular_function_tested,
            row.behavior_task_of_interest, row.tissue_or_organ,
            row.celltype, row.treatment_identifier,
          ];
          if (!searchFields.some((f) => f && f.toLowerCase().includes(searchLower))) return false;
        }
        if (excludeKey !== "treatment" && filters.treatment.size > 0 && !filters.treatment.has(row.treatment_identifier)) return false;
        if (excludeKey !== "treatmentClass" && filters.treatmentClass.size > 0 && !filters.treatmentClass.has(row.treatment_class_hint)) return false;
        if (excludeKey !== "species" && filters.species.size > 0 && !filters.species.has(row.species)) return false;
        if (excludeKey !== "model" && filters.model.size > 0 && !filters.model.has(row.model_name)) return false;
        if (excludeKey !== "sex" && filters.sex.size > 0 && !filters.sex.has(row.sex_of_animals_and_sex_differences)) return false;
        if (excludeKey !== "route" && filters.route.size > 0 && !filters.route.has(row.administration_route)) return false;
        if (excludeKey !== "behaviorOutcome" && filters.behaviorOutcome.size > 0 && !filters.behaviorOutcome.has(row.behavior_effect_rating)) return false;
        if (excludeKey !== "cellularOutcome" && filters.cellularOutcome.size > 0 && !filters.cellularOutcome.has(row.cellular_or_molecular_effect_rating)) return false;
        if (excludeKey !== "molecularOutcome" && filters.molecularOutcome.size > 0 && !filters.molecularOutcome.has(row.molecular_effect_rating)) return false;
        return true;
      });
    },
    [data, debouncedSearch, filters]
  );

  // Corpus-wide unique values (derived from actual data, not static keyword lists)
  const corpusValues = useMemo(() => ({
    treatment: [...new Set(data.map((r) => r.treatment_identifier))].sort(),
    treatmentClass: [...new Set(data.map((r) => r.treatment_class_hint))].sort(),
    species: [...new Set(data.map((r) => r.species))].sort(),
    model: [...new Set(data.map((r) => r.model_name))].sort(),
    sex: [...new Set(data.map((r) => r.sex_of_animals_and_sex_differences))].sort(),
    route: [...new Set(data.map((r) => r.administration_route))].sort(),
    behaviorOutcome: [...new Set(data.map((r) => r.behavior_effect_rating))].sort(),
    cellularOutcome: [...new Set(data.map((r) => r.cellular_or_molecular_effect_rating))].sort(),
    molecularOutcome: [...new Set(data.map((r) => r.molecular_effect_rating))].sort(),
  }), [data]);

  // Helper: build {value, count}[] from a corpus list and a subset of matching rows
  function buildOptionsWithCounts(
    corpusUniqueValues: string[],
    matchingRows: EnrichedIntervention[],
    accessor: (row: EnrichedIntervention) => string
  ): { value: string; count: number }[] {
    const countMap = new Map<string, number>();
    for (const row of matchingRows) {
      const v = accessor(row);
      countMap.set(v, (countMap.get(v) || 0) + 1);
    }
    return corpusUniqueValues.map((v) => ({ value: v, count: countMap.get(v) || 0 }));
  }

  const treatmentOptions = useMemo(() => {
    const rows = filterRowsExcluding("treatment");
    return buildOptionsWithCounts(corpusValues.treatment, rows, (r) => r.treatment_identifier);
  }, [filterRowsExcluding, corpusValues.treatment]);

  const treatmentClassOptions = useMemo(() => {
    const rows = filterRowsExcluding("treatmentClass");
    return buildOptionsWithCounts(corpusValues.treatmentClass, rows, (r) => r.treatment_class_hint);
  }, [filterRowsExcluding, corpusValues.treatmentClass]);

  const speciesOptions = useMemo(() => {
    const rows = filterRowsExcluding("species");
    return buildOptionsWithCounts(corpusValues.species, rows, (r) => r.species);
  }, [filterRowsExcluding, corpusValues.species]);

  const modelOptions = useMemo(() => {
    const rows = filterRowsExcluding("model");
    return buildOptionsWithCounts(corpusValues.model, rows, (r) => r.model_name);
  }, [filterRowsExcluding, corpusValues.model]);

  const sexOptions = useMemo(() => {
    const rows = filterRowsExcluding("sex");
    return buildOptionsWithCounts(corpusValues.sex, rows, (r) => r.sex_of_animals_and_sex_differences);
  }, [filterRowsExcluding, corpusValues.sex]);

  const routeOptions = useMemo(() => {
    const rows = filterRowsExcluding("route");
    return buildOptionsWithCounts(corpusValues.route, rows, (r) => r.administration_route);
  }, [filterRowsExcluding, corpusValues.route]);

  const behaviorOutcomeOptions = useMemo(() => {
    const rows = filterRowsExcluding("behaviorOutcome");
    return buildOptionsWithCounts(corpusValues.behaviorOutcome, rows, (r) => r.behavior_effect_rating);
  }, [filterRowsExcluding, corpusValues.behaviorOutcome]);

  const cellularOutcomeOptions = useMemo(() => {
    const rows = filterRowsExcluding("cellularOutcome");
    return buildOptionsWithCounts(corpusValues.cellularOutcome, rows, (r) => r.cellular_or_molecular_effect_rating);
  }, [filterRowsExcluding, corpusValues.cellularOutcome]);

  const molecularOutcomeOptions = useMemo(() => {
    const rows = filterRowsExcluding("molecularOutcome");
    return buildOptionsWithCounts(corpusValues.molecularOutcome, rows, (r) => r.molecular_effect_rating);
  }, [filterRowsExcluding, corpusValues.molecularOutcome]);

  // Column definitions — 19 columns
  const columns = useMemo<ColumnDef<EnrichedIntervention>[]>(
    () => [
      // 1. DST ID
      {
        id: "treatment_identifier",
        accessorKey: "treatment_identifier",
        header: "DST ID",
        cell: ({ row }) => (
          <Link
            href={`/treatments/${row.original.treatment_identifier}`}
            className="font-mono text-xs font-medium text-interactive hover:text-interactive-hover hover:underline whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.treatment_identifier}
          </Link>
        ),
        size: 80,
        enableSorting: false,
      },
      // 2. Treatment
      {
        id: "treatment",
        accessorKey: "treatment",
        header: "Treatment",
        cell: ({ row }) => (
          <Link
            href={`/treatments/${row.original.treatment_identifier}`}
            className="text-xs text-interactive hover:text-interactive-hover hover:underline whitespace-normal break-words leading-snug min-w-[180px] block"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.treatment}
          </Link>
        ),
        size: 180,
      },
      // 3. Reference
      {
        id: "reference",
        accessorKey: "reference",
        header: "Reference",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-foreground whitespace-normal break-words leading-snug min-w-[120px] block">
            {extractCitation(row.original.reference)}
          </span>
        ),
        size: 120,
      },
      // 4. Species
      {
        id: "species",
        accessorKey: "species",
        header: "Species",
        cell: ({ row }) => (
          <span className="text-xs text-foreground whitespace-normal break-words leading-snug min-w-[80px] block">
            {row.original.species}
          </span>
        ),
        size: 80,
      },
      // 5. Model
      {
        id: "model_name",
        accessorKey: "model_name",
        header: "Model",
        cell: ({ row }) => (
          <span className="text-xs text-foreground whitespace-normal break-words leading-snug min-w-[100px] block">
            {row.original.model_name === "NA" ? "—" : row.original.model_name}
          </span>
        ),
        size: 100,
      },
      // 6. Sex
      {
        id: "sex",
        accessorKey: "sex_of_animals_and_sex_differences",
        header: "Sex",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-normal break-words leading-snug min-w-[100px] block">
            {(row.original.sex_of_animals_and_sex_differences as string) === "NA"
              ? "—"
              : row.original.sex_of_animals_and_sex_differences}
          </span>
        ),
        size: 100,
      },
      // 7. Dose
      {
        id: "dose",
        accessorKey: "dose",
        header: "Dose",
        cell: ({ row }) => {
          const dose = row.original.dose;
          return (
            <span className="text-xs text-muted-foreground whitespace-normal break-words leading-snug min-w-[90px] block">
              {dose === "NA" ? "—" : dose}
            </span>
          );
        },
        size: 90,
      },
      // 8. Route
      {
        id: "route",
        accessorKey: "administration_route",
        header: "Route",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-normal break-words leading-snug min-w-[140px] block">
            {(row.original.administration_route as string) === "NA"
              ? "—"
              : row.original.administration_route}
          </span>
        ),
        size: 140,
      },
      // 9. Age at treatment
      {
        id: "age_at_treatment",
        accessorKey: "age_at_treatment",
        header: () => (
          <span>
            Age at
            <br />
            treatment
          </span>
        ),
        cell: ({ row }) => {
          const age = row.original.age_at_treatment;
          return (
            <span className="text-xs text-muted-foreground whitespace-normal break-words leading-snug min-w-[110px] block">
              {age === "NA" ? "—" : age}
            </span>
          );
        },
        size: 110,
      },
      // 10. Age at testing
      {
        id: "age_at_testing",
        accessorKey: "age_at_testing",
        header: () => (
          <span>
            Age at
            <br />
            testing
          </span>
        ),
        cell: ({ row }) => {
          const age = row.original.age_at_testing;
          return (
            <span className="text-xs text-muted-foreground whitespace-normal break-words leading-snug min-w-[120px] block">
              {age === "NA" ? "—" : age}
            </span>
          );
        },
        size: 120,
      },
      // 11. Tissue / Organ
      {
        id: "tissue_organ",
        accessorKey: "tissue_or_organ",
        header: () => (
          <span>
            Tissue /
            <br />
            Organ
          </span>
        ),
        cell: ({ row }) => {
          const tissue = row.original.tissue_or_organ;
          return (
            <span
              className={`text-xs whitespace-normal break-words leading-snug min-w-[180px] block ${tissue === "NA" ? "text-muted-foreground/50" : "text-muted-foreground"}`}
            >
              {tissue === "NA" ? "—" : tissue}
            </span>
          );
        },
        size: 180,
      },
      // 12. Cell type
      {
        id: "celltype",
        accessorKey: "celltype",
        header: () => (
          <span>
            Cell
            <br />
            type
          </span>
        ),
        cell: ({ row }) => {
          const celltype = row.original.celltype;
          return (
            <span
              className={`text-xs whitespace-normal break-words leading-snug min-w-[180px] block ${celltype === "NA" ? "text-muted-foreground/50" : "text-muted-foreground"}`}
            >
              {celltype === "NA" ? "—" : celltype}
            </span>
          );
        },
        size: 180,
      },
      // 13. Cellular / molecular function tested
      {
        id: "function_tested",
        accessorKey: "cellular_or_molecular_function_tested",
        header: () => (
          <span>
            Cellular / molecular
            <br />
            function tested
          </span>
        ),
        cell: ({ row }) => {
          const fn = row.original.cellular_or_molecular_function_tested;
          return (
            <span
              className={`text-xs whitespace-normal break-words leading-snug min-w-[220px] block ${fn === "NA" ? "text-muted-foreground/50" : "text-muted-foreground"}`}
            >
              {fn === "NA" ? "—" : fn}
            </span>
          );
        },
        size: 220,
      },
      // 14. Cellular outcome
      {
        id: "cellular_outcome",
        accessorKey: "cellular_or_molecular_effect_rating",
        header: () => (
          <span>
            Cellular
            <br />
            outcome
          </span>
        ),
        cell: ({ row }) => (
          <OutcomeBadge
            outcome={
              row.original.cellular_or_molecular_effect_rating as EffectRating
            }
          />
        ),
        size: 110,
        enableSorting: false,
      },
      // 15. Gene / Transcript / Protein of interest
      {
        id: "gene_protein",
        accessorKey: "gene__transcript__protein_of_interest",
        header: () => (
          <span>
            Gene / Transcript /
            <br />
            Protein of interest
          </span>
        ),
        cell: ({ row }) => {
          const gene = row.original.gene__transcript__protein_of_interest;
          return (
            <span
              className={`font-mono text-xs whitespace-normal break-all leading-snug min-w-[200px] block ${gene === "NA" ? "text-muted-foreground/50" : "text-foreground"}`}
            >
              {gene === "NA" ? "—" : gene}
            </span>
          );
        },
        size: 200,
      },
      // 16. Molecular outcome
      {
        id: "molecular_outcome",
        accessorKey: "molecular_effect_rating",
        header: () => (
          <span>
            Molecular
            <br />
            outcome
          </span>
        ),
        cell: ({ row }) => (
          <OutcomeBadge
            outcome={row.original.molecular_effect_rating as EffectRating}
          />
        ),
        size: 110,
        enableSorting: false,
      },
      // 17. Behaviour task
      {
        id: "behavior_task",
        accessorKey: "behavior_task_of_interest",
        header: () => (
          <span>
            Behaviour
            <br />
            task
          </span>
        ),
        cell: ({ row }) => {
          const task = row.original.behavior_task_of_interest;
          return (
            <span
              className={`text-xs whitespace-normal break-words leading-snug min-w-[180px] block ${task === "NA" ? "text-muted-foreground/50" : "text-muted-foreground"}`}
            >
              {task === "NA" ? "—" : task}
            </span>
          );
        },
        size: 180,
      },
      // 18. Behavioural outcome
      {
        id: "behavior_outcome",
        accessorKey: "behavior_effect_rating",
        header: () => (
          <span>
            Behavioural
            <br />
            outcome
          </span>
        ),
        cell: ({ row }) => (
          <OutcomeBadge
            outcome={row.original.behavior_effect_rating as EffectRating}
          />
        ),
        size: 110,
        enableSorting: false,
      },
      // 19. DOI
      {
        id: "doi",
        header: "DOI",
        cell: ({ row }) => {
          const doi = row.original.reference_with_link_to_publication;
          if (!doi || doi === "NA")
            return <span className="text-muted-foreground/50">—</span>;
          return (
            <a
              href={doi}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-interactive hover:text-interactive-hover whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              open
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        },
        size: 70,
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 },
    },
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-foreground">Experiments</h1>
        <p className="text-muted-foreground mt-1">
          <span className="font-medium text-foreground">
            {filteredData.length}
          </span>{" "}
          of {totalCount} individual experimental conditions
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Every row is one treatment × model × dose × age × readout combination
          from the source literature.
        </p>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:block space-y-3 sticky top-14 z-20 bg-background py-3 -mx-4 px-4 border-b border-border">
        {/* Row 1: Search + Clear */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search across all text fields..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-8 h-8 text-xs"
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex h-8 items-center gap-1 rounded-md px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          )}
        </div>

        {/* Row 2: Categorical filters */}
        <div className="flex flex-wrap items-center gap-2">
          <MultiSelectFilter
            label="Treatment"
            options={treatmentOptions}
            selected={filters.treatment}
            onChange={(v) => updateFilterSet("treatment", v)}
            renderLabel={(id) => {
              const short = filterOptions.treatmentShortMap[id] || id;
              const canonical = filterOptions.treatmentMap[id] || id;
              return short !== canonical ? `${short} · ${canonical}` : short;
            }}
          />
          <MultiSelectFilter
            label="Class"
            options={treatmentClassOptions}
            selected={filters.treatmentClass}
            onChange={(v) => updateFilterSet("treatmentClass", v)}
          />
          <MultiSelectFilter
            label="Species"
            options={speciesOptions}
            selected={filters.species}
            onChange={(v) => updateFilterSet("species", v)}
          />
          <MultiSelectFilter
            label="Model"
            options={modelOptions}
            selected={filters.model}
            onChange={(v) => updateFilterSet("model", v)}
            renderLabel={(modelName) => {
              const short = filterOptions.modelShortMap[modelName] || modelName;
              return short !== modelName ? `${short} · ${modelName}` : modelName;
            }}
          />
          <MultiSelectFilter
            label="Sex"
            options={sexOptions}
            selected={filters.sex}
            onChange={(v) => updateFilterSet("sex", v)}
          />
          <MultiSelectFilter
            label="Route"
            options={routeOptions}
            selected={filters.route}
            onChange={(v) => updateFilterSet("route", v)}
          />
        </div>

        {/* Row 3: Outcome filters */}
        <div className="flex flex-wrap items-center gap-2">
          <MultiSelectFilter
            label="Behavior outcome"
            options={behaviorOutcomeOptions}
            selected={filters.behaviorOutcome}
            onChange={(v) => updateFilterSet("behaviorOutcome", v)}
          />
          <MultiSelectFilter
            label="Cellular outcome"
            options={cellularOutcomeOptions}
            selected={filters.cellularOutcome}
            onChange={(v) => updateFilterSet("cellularOutcome", v)}
          />
          <MultiSelectFilter
            label="Molecular outcome"
            options={molecularOutcomeOptions}
            selected={filters.molecularOutcome}
            onChange={(v) => updateFilterSet("molecularOutcome", v)}
          />
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="pl-8 h-8 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs text-foreground hover:bg-surface-muted cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="rounded-full bg-accent-rescue px-1.5 text-[10px] text-white font-medium">
              {activeChips.length}
            </span>
          )}
        </button>
      </div>

      <MobileFilterSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
      />

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              value={chip.value}
              shortValue={chip.shortValue}
              onRemove={() => removeChip(chip.filterKey, chip.filterValue)}
            />
          ))}
        </div>
      )}

      {/* Results Count + Export */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {filteredData.length}
          </span>
          /{totalCount} experiments
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCSV(filteredData)}
          className="h-7 text-xs gap-1"
        >
          <Download className="h-3 w-3" />
          Export CSV
        </Button>
      </div>

      {/* The Table — full-width breakout */}
      {filteredData.length === 0 ? (
        <div className="rounded-md border border-border bg-surface py-16 text-center">
          <p className="text-muted-foreground mb-3">
            No experiments match these filters.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex h-8 items-center rounded-md border border-border px-4 text-sm text-foreground hover:bg-surface-muted cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-md border border-border bg-surface -mx-4 sm:mx-0">
            <div ref={tableScrollRef} className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-surface border-b border-border">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground align-top"
                          style={{ width: header.getSize() }}
                        >
                          {header.column.getCanSort() ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="flex items-start gap-1 cursor-pointer hover:text-foreground"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getIsSorted() === "asc" && (
                                <ChevronUp className="h-3 w-3 mt-0.5" />
                              )}
                              {header.column.getIsSorted() === "desc" && (
                                <ChevronDown className="h-3 w-3 mt-0.5" />
                              )}
                            </button>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-b-0 hover:bg-surface-muted cursor-pointer transition-colors"
                      onClick={() => {
                        window.location.href = `/treatments/${row.original.treatment_identifier}`;
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="py-3 px-3 align-top"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Sentinel at table bottom — used by IntersectionObserver */}
            <div ref={sentinelRef} className="h-0 w-full" />
          </div>

          {/* Floating horizontal scrollbar — always rendered, visibility via CSS */}
          <div
            ref={floatingRef}
            className={`sticky-scrollbar fixed bottom-0 z-50 overflow-x-scroll overflow-y-hidden bg-surface/90 border-t border-border backdrop-blur-sm transition-opacity ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ height: 14 }}
          >
            <div ref={innerRef} style={{ height: 14, width: 0 }} />
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="min-h-[44px] min-w-[44px] touch-manipulation"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="min-h-[44px] min-w-[44px] touch-manipulation"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
