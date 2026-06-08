import { getAllTreatmentSummaries } from "@/src/lib/queries";
import { TreatmentsTable } from "./components/treatments-table";

export const metadata = {
  title: "Treatments | Down Syndrome Preclinical Therapeutics Explorer",
  description: "Browse 38 compounds tested in Down syndrome preclinical models",
};

export default function TreatmentsPage() {
  const treatments = getAllTreatmentSummaries();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Treatments</h1>
        <p className="text-muted-foreground mt-1">
          {treatments.length} compounds tested across Down syndrome preclinical models
        </p>
      </div>

      {/* Table */}
      <TreatmentsTable data={treatments} />
    </div>
  );
}
