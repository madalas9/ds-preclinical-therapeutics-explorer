"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import type { Intervention, EffectRating } from "@/src/lib/types";
import { OutcomeBadge } from "../../components/outcome-badge";

interface ExperimentsTableProps {
  experiments: Intervention[];
}

function extractCitation(reference: string): string {
  if (!reference || reference === "NA") return reference;
  const match = reference.match(/^([^,]+,?\s*\d{4})/);
  return match ? match[1] : reference.slice(0, 30);
}

export function ExperimentsTable({ experiments }: ExperimentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "reference", desc: false },
  ]);

  const columns = useMemo<ColumnDef<Intervention>[]>(
    () => [
      // 1. Reference
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
      // 2. Species
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
      // 3. Model
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
      // 4. Sex
      {
        id: "sex",
        accessorKey: "sex_of_animals_and_sex_differences",
        header: "Sex",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-normal break-words leading-snug min-w-[100px] block">
            {row.original.sex_of_animals_and_sex_differences}
          </span>
        ),
        size: 100,
      },
      // 5. Dose
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
      // 6. Route
      {
        id: "route",
        accessorKey: "administration_route",
        header: "Route",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground whitespace-normal break-words leading-snug min-w-[140px] block">
            {row.original.administration_route}
          </span>
        ),
        size: 140,
      },
      // 7. Age at treatment
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
      // 8. Age at testing
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
      // 9. Tissue / Organ
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
      // 10. Cell type
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
      // 11. Cellular / molecular function tested
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
      // 12. Cellular outcome
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
      // 13. Gene / Transcript / Protein of interest
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
      // 14. Molecular outcome
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
      // 15. Behaviour task
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
      // 16. Behavioural outcome
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
      // 17. DOI
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
    data: experiments,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">
          Experiments ({experiments.length})
        </h2>
        <p className="text-sm text-muted-foreground">
          Individual experimental conditions from the source literature
        </p>
      </div>
      <div className="overflow-x-auto">
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
                className="border-b border-border last:border-b-0 hover:bg-surface-muted transition-colors"
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
    </div>
  );
}
