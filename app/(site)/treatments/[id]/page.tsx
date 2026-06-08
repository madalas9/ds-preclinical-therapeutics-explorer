import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getByTreatmentId,
  getTreatmentMetadata,
  getTreatmentOutcomeBreakdowns,
} from "@/src/lib/queries";
import { HeaderStrip } from "./components/header-strip";
import { OutcomeThreeAxisCard } from "./components/outcome-three-axis-card";
import { ModelsSexSummary } from "./components/models-sex-summary";
import { ExperimentsTable } from "./components/experiments-table";
import { ReferencesList } from "./components/references-list";
import { EvidenceCaveats } from "./components/evidence-caveats";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const metadata = getTreatmentMetadata(id);

  if (!metadata) {
    return { title: "Treatment Not Found | Down Syndrome Preclinical Therapeutics Explorer" };
  }

  return {
    title: `${metadata.canonical_name} (${id}) | Down Syndrome Preclinical Therapeutics Explorer`,
    description: `${metadata.experiment_count} experiments across ${metadata.study_count} studies for ${metadata.canonical_name} in Down syndrome preclinical models`,
  };
}

export default async function TreatmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const experiments = getByTreatmentId(id);

  if (experiments.length === 0) {
    notFound();
  }

  const metadata = getTreatmentMetadata(id);
  if (!metadata) {
    notFound();
  }

  const outcomeBreakdowns = getTreatmentOutcomeBreakdowns(id);

  return (
    <div className="py-8 sm:py-10">
      {/* Narrow content container */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <Link
          href="/treatments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all treatments
        </Link>

        <div className="space-y-6">
          {/* Header Strip */}
          <HeaderStrip metadata={metadata} />

          {/* Outcome Breakdown - Three Axis Card */}
          <OutcomeThreeAxisCard
            breakdowns={outcomeBreakdowns}
            experimentCount={metadata.experiment_count}
          />

          {/* Models + Sex Summary */}
          <ModelsSexSummary metadata={metadata} />
        </div>
      </div>

      {/* Full-width experiments table */}
      <div className="mt-6 px-4 max-w-[1600px] mx-auto">
        <ExperimentsTable experiments={experiments} />
      </div>

      {/* Back to narrow container */}
      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {/* References List */}
        <ReferencesList references={metadata.distinct_references} />

        {/* Evidence Caveats */}
        <EvidenceCaveats metadata={metadata} />
      </div>
    </div>
  );
}
