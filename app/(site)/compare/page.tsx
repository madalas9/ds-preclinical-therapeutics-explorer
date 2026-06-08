import {
  getTreatmentMetadata,
  getTreatmentOutcomeBreakdowns,
  getAllTreatmentSummaries,
} from "@/src/lib/queries";
import type {
  TreatmentMetadata,
  TreatmentOutcomeBreakdowns,
} from "@/src/lib/queries";
import { CompareGrid } from "./components/compare-grid";

export const metadata = {
  title: "Compare Treatments | Down Syndrome Preclinical Therapeutics Explorer",
  description:
    "Side-by-side evidence comparison of up to 4 Down syndrome preclinical treatments",
};

export interface CompareItem {
  metadata: TreatmentMetadata;
  outcomes: TreatmentOutcomeBreakdowns;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const idsRaw = typeof sp.ids === "string" ? sp.ids : "";

  // Parse, dedupe, cap at 4
  const requestedIds = [
    ...new Set(
      idsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ].slice(0, 4);

  // Validate each ID and fetch data
  const compareItems: CompareItem[] = [];
  const validIds: string[] = [];

  for (const id of requestedIds) {
    const meta = getTreatmentMetadata(id);
    if (!meta) continue; // skip invalid IDs
    const outcomes = getTreatmentOutcomeBreakdowns(id);
    compareItems.push({ metadata: meta, outcomes });
    validIds.push(id);
  }

  // Get all treatments for the picker
  const allTreatments = getAllTreatmentSummaries().map((t) => ({
    treatment_identifier: t.treatment_identifier,
    canonical_name: t.canonical_name,
    treatment_short: t.treatment_short,
  }));

  return (
    <div className="py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4">
        <CompareGrid
          items={compareItems}
          selectedIds={validIds}
          allTreatments={allTreatments}
        />
      </div>
    </div>
  );
}
