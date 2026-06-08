import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  corpusStats,
  countByBehaviorOutcome,
  topNTreatmentsByStudyCount,
  countBySpecies,
  getCorpusStructureHierarchy,
} from "@/src/lib/queries";
import { CorpusSunburst } from "./components/corpus-sunburst";
import { OutcomeDistributionChart } from "./components/outcome-distribution-chart";
import { TopTreatmentsChart } from "./components/top-treatments-chart";
import { SpeciesCoverageChart } from "./components/species-coverage-chart";
import { SupportersBlock } from "./components/supporters-block";

export default function HomePage() {
  const stats = corpusStats();
  const structureData = getCorpusStructureHierarchy();
  const outcomeData = countByBehaviorOutcome();
  const topTreatments = topNTreatmentsByStudyCount(10);
  const speciesData = countBySpecies();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
      {/* HERO SECTION */}
      <section className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-accent-rescue-bg text-accent-rescue border border-accent-rescue/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6 clay-shadow-sm">
          Curated DS preclinical evidence base
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
          <span className="text-foreground">Down Syndrome Preclinical Therapeutics </span>
          <span className="text-accent-rescue">Explorer</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Explore 38 compounds tested across 232 experiments in Down syndrome
          animal models. Every claim links to its source publication.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/treatments"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent-rescue px-6 text-base font-medium text-white transition-colors hover:bg-accent-rescue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring clay-shadow-sm"
          >
            Browse Treatments
          </Link>
          <Link
            href="/ask"
            className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-border bg-surface px-6 text-base font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring clay-shadow-sm"
          >
            Ask a Question
          </Link>
        </div>
      </section>

      {/* STAT ROW */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
        <div className="clay-card text-center">
          <div className="text-4xl lg:text-5xl font-bold text-foreground">
            {stats.total_species}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">
            Species
          </div>
        </div>
        <div className="clay-card text-center">
          <div className="text-4xl lg:text-5xl font-bold text-foreground">
            {stats.total_treatments}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">
            Treatments
          </div>
        </div>
        <div className="clay-card text-center sm:col-span-2 lg:col-span-1">
          <div className="text-4xl lg:text-5xl font-bold text-foreground">
            {stats.total_papers}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">
            Studies
          </div>
        </div>
      </section>

      {/* CHARTS GRID — 2 columns on desktop */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
        {/* LEFT COLUMN — Species Coverage (tall card) */}
        <div className="clay-card lg:h-[684px] flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Animal models covered
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Experiments by species
              </p>
            </div>
            <Link
              href="/experiments"
              className="text-sm text-interactive hover:text-interactive-hover flex items-center gap-1 shrink-0"
            >
              Explore <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <SpeciesCoverageChart
              data={speciesData}
              totalExperiments={stats.total_experiments}
              large
            />
          </div>
        </div>

        {/* RIGHT COLUMN — Two stacked cards */}
        <div className="grid grid-rows-[auto_auto] lg:grid-rows-[2fr_1fr] gap-6">
          {/* TOP-RIGHT — Most-studied compounds (taller) */}
          <div className="clay-card lg:h-[440px] flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Most-studied compounds
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Top 10 by distinct publication count
                </p>
              </div>
              <Link
                href="/treatments"
                className="text-sm text-interactive hover:text-interactive-hover flex items-center gap-1 shrink-0"
              >
                Explore <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex-1 min-h-0">
              <TopTreatmentsChart data={topTreatments} tall />
            </div>
          </div>

          {/* BOTTOM-RIGHT — Outcome Distribution (shorter) */}
          <div className="clay-card lg:h-[220px] flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Outcomes across {stats.total_experiments} experiments
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Distribution of behavioral effect ratings
                </p>
              </div>
              <Link
                href="/experiments"
                className="text-sm text-interactive hover:text-interactive-hover flex items-center gap-1 shrink-0"
              >
                Explore <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex-1 flex items-center">
              <OutcomeDistributionChart data={outcomeData} />
            </div>
          </div>
        </div>
      </section>

      {/* SUNBURST CHART — Full-width */}
      <section>
        <div className="clay-card min-h-[1080px] p-8 lg:p-10 rounded-3xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Interactive Sun Burst Plot
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Species → Model → Class → Compound
            </p>
          </div>
          <CorpusSunburst
            data={structureData}
            totalExperiments={stats.total_experiments}
          />
        </div>
      </section>

      {/* SUPPORTERS BLOCK — Landing page only */}
      <SupportersBlock />
    </div>
  );
}
