import {
  listAllInterventions,
  listUniqueValues,
  inferTreatmentClass,
} from "@/src/lib/queries";
import { OUTCOME_ORDER } from "@/src/lib/types";
import { ExperimentsBrowser } from "./components/experiments-browser";

export const metadata = {
  title: "Experiments | Down Syndrome Preclinical Therapeutics Explorer",
  description:
    "Browse all 232 individual experimental conditions across Down syndrome preclinical models",
};

export default function ExperimentsPage() {
  const allRows = listAllInterventions();

  // Enrich each row with treatment_class_hint
  const enrichedRows = allRows.map((row) => ({
    ...row,
    treatment_class_hint: inferTreatmentClass(row.treatment),
  }));

  // Build treatment maps: ID → canonical_name and ID → short_name
  const treatmentMap: Record<string, string> = {};
  const treatmentShortMap: Record<string, string> = {};
  for (const row of allRows) {
    if (!treatmentMap[row.treatment_identifier]) {
      treatmentMap[row.treatment_identifier] = row.treatment;
      treatmentShortMap[row.treatment_identifier] = row.treatment_short || row.treatment;
    }
  }

  // Build model maps: model_name → short name
  const modelShortMap: Record<string, string> = {};
  for (const row of allRows) {
    if (row.model_name && !modelShortMap[row.model_name]) {
      modelShortMap[row.model_name] = row.model_short || row.model_name;
    }
  }

  // Precompute filter option lists server-side
  const filterOptions = {
    treatment_identifiers: listUniqueValues("treatment_identifier"),
    treatmentMap,
    treatmentShortMap,
    modelShortMap,
    species: listUniqueValues("species"),
    model_names: listUniqueValues("model_name"),
    sex: listUniqueValues("sex_of_animals_and_sex_differences"),
    administration_routes: listUniqueValues("administration_route"),
    behavior_outcomes: [...OUTCOME_ORDER] as string[],
    cellular_outcomes: [...OUTCOME_ORDER] as string[],
    molecular_outcomes: [...OUTCOME_ORDER] as string[],
    treatment_classes: [
      "Polyphenol",
      "PUFA / Lipid",
      "Nutrient",
      "Natural product",
      "Peptide",
      "Approved drug",
      "Environmental",
      "Small molecule",
    ],
  };

  return (
    <div className="py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4">
        <ExperimentsBrowser
          data={enrichedRows}
          totalCount={allRows.length}
          filterOptions={filterOptions}
        />
      </div>
    </div>
  );
}
