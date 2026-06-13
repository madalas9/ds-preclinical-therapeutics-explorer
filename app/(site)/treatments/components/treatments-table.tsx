"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { EffectRating } from "@/src/lib/types";
import { OUTCOME_ORDER } from "@/src/lib/types";

export interface TreatmentSummary {
  treatment_identifier: string;
  canonical_name: string;
  treatment_short: string;
  treatment_class_hint: string;
  study_count: number;
  experiment_count: number;
  models_tested: number;
  species_list: string;
  dominant_outcome: EffectRating;
  outcome_counts: Record<EffectRating, number>;
}

interface TreatmentsTableProps {
  data: TreatmentSummary[];
}

const ALL_CLASSES = [
  "Polyphenol",
  "PUFA / Lipid",
  "Nutrient",
  "Natural product",
  "Peptide",
  "Approved drug",
  "Environmental",
  "Small molecule",
];

const ALL_SPECIES = ["Mouse", "Rat", "Fruit Fly", "Zebrafish"];

function MultiSelectFilter({
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
  const [open, setOpen] = useState(false);

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
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-muted cursor-pointer"
      >
        {label}
        {selected.size > 0 && (
          <span className="rounded-full bg-accent-rescue px-1.5 text-xs text-white">
            {selected.size}
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-md border border-border bg-surface p-1 shadow-lg">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-muted"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt)}
                  onChange={() => toggle(opt)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-foreground">{renderLabel ? renderLabel(opt) : opt}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TreatmentsTable({ data }: TreatmentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "treatment_identifier", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [classFilter, setClassFilter] = useState<Set<string>>(new Set());
  const [speciesFilter, setSpeciesFilter] = useState<Set<string>>(new Set());
  const [outcomeFilter, setOutcomeFilter] = useState<Set<string>>(new Set());

  const hasFilters =
    globalFilter ||
    classFilter.size > 0 ||
    speciesFilter.size > 0 ||
    outcomeFilter.size > 0;

  const clearFilters = () => {
    setGlobalFilter("");
    setClassFilter(new Set());
    setSpeciesFilter(new Set());
    setOutcomeFilter(new Set());
  };

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (globalFilter) {
        const search = globalFilter.toLowerCase();
        const matchesCanonical = row.canonical_name.toLowerCase().includes(search);
        const matchesShort = row.treatment_short.toLowerCase().includes(search);
        const matchesId = row.treatment_identifier.toLowerCase().includes(search);
        if (!matchesCanonical && !matchesShort && !matchesId) {
          return false;
        }
      }
      if (classFilter.size > 0 && !classFilter.has(row.treatment_class_hint)) {
        return false;
      }
      if (speciesFilter.size > 0) {
        const rowSpecies = row.species_list.split(",").map((s) => s.trim());
        if (!rowSpecies.some((s) => speciesFilter.has(s))) {
          return false;
        }
      }
      if (outcomeFilter.size > 0 && !outcomeFilter.has(row.dominant_outcome)) {
        return false;
      }
      return true;
    });
  }, [data, globalFilter, classFilter, speciesFilter, outcomeFilter]);

  const columns = useMemo<ColumnDef<TreatmentSummary>[]>(
    () => [
      {
        id: "treatment_identifier",
        accessorKey: "treatment_identifier",
        header: "DST ID",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-foreground">
            {row.original.treatment_identifier}
          </span>
        ),
        size: 90,
        meta: { sticky: true },
      },
      {
        id: "canonical_name",
        accessorKey: "canonical_name",
        header: "Treatment",
        cell: ({ row }) => (
          <Link
            href={`/treatments/${row.original.treatment_identifier}`}
            className="text-interactive hover:text-interactive-hover hover:underline"
          >
            {row.original.canonical_name}
          </Link>
        ),
        size: 220,
      },
      {
        id: "treatment_class_hint",
        accessorKey: "treatment_class_hint",
        header: "Class",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.treatment_class_hint}
          </span>
        ),
        size: 130,
        meta: { hideBelow: 768 },
      },
      {
        id: "study_count",
        accessorKey: "study_count",
        header: "Studies",
        cell: ({ row }) => (
          <span
            className={`font-mono text-sm text-right block ${
              row.original.study_count >= 10 ? "font-bold" : ""
            }`}
          >
            {row.original.study_count}
          </span>
        ),
        size: 80,
      },
      {
        id: "experiment_count",
        accessorKey: "experiment_count",
        header: "Experiments",
        cell: ({ row }) => (
          <span className="font-mono text-sm text-right block">
            {row.original.experiment_count}
          </span>
        ),
        size: 100,
        meta: { hideBelow: 1024 },
      },
      {
        id: "models_tested",
        accessorKey: "models_tested",
        header: "Models",
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-sm">{row.original.models_tested}</span>
            {row.original.species_list && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({row.original.species_list})
              </span>
            )}
          </div>
        ),
        size: 140,
        meta: { hideBelow: 768 },
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
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search treatments..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <MultiSelectFilter
          label="Class"
          options={ALL_CLASSES}
          selected={classFilter}
          onChange={setClassFilter}
        />
        <MultiSelectFilter
          label="Species"
          options={ALL_SPECIES}
          selected={speciesFilter}
          onChange={setSpeciesFilter}
        />
        <MultiSelectFilter
          label="Behavior outcome"
          options={[...OUTCOME_ORDER]}
          selected={outcomeFilter}
          onChange={setOutcomeFilter}
          renderLabel={(val) => (val === "NA" ? "NT" : val)}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-9 items-center gap-1 rounded-md px-3 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredData.length} of {data.length} treatments
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as {
                    sticky?: boolean;
                    hideBelow?: number;
                  } | undefined;
                  const hideClass = meta?.hideBelow
                    ? meta.hideBelow === 768
                      ? "hidden md:table-cell"
                      : "hidden lg:table-cell"
                    : "";
                  const stickyClass = meta?.sticky
                    ? "sticky left-0 z-20 bg-surface"
                    : "";

                  return (
                    <th
                      key={header.id}
                      className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${hideClass} ${stickyClass}`}
                      style={{ width: header.getSize() }}
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getIsSorted() === "asc" && (
                            <ChevronUp className="h-3 w-3" />
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-muted-foreground"
                >
                  No treatments match these filters
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-muted cursor-pointer transition-colors"
                  onClick={() => {
                    window.location.href = `/treatments/${row.original.treatment_identifier}`;
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as {
                      sticky?: boolean;
                      hideBelow?: number;
                    } | undefined;
                    const hideClass = meta?.hideBelow
                      ? meta.hideBelow === 768
                        ? "hidden md:table-cell"
                        : "hidden lg:table-cell"
                      : "";
                    const stickyClass = meta?.sticky
                      ? "sticky left-0 z-10 bg-surface"
                      : "";

                    return (
                      <td
                        key={cell.id}
                        className={`py-3 px-4 ${hideClass} ${stickyClass}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
