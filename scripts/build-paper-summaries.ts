import * as fs from "fs";
import * as path from "path";

interface InterventionRow {
  treatment_identifier: string;
  treatment: string;
  treatment_short?: string;
  reference: string;
  reference_with_link_to_publication: string;
  species: string;
  model_name: string;
  model_short?: string;
  sex_of_animals_and_sex_differences: string;
  dose: string;
  administration_route: string;
  age_at_treatment: string;
  age_at_testing: string;
  behavior_task_of_interest: string;
  behavior_effect_rating: string;
  cellular_or_molecular_function_tested: string;
  cellular_or_molecular_effect_rating: string;
  gene__transcript__protein_of_interest: string;
  molecular_effect_rating: string;
  tissue_or_organ: string;
  celltype: string;
  _row_index: number;
}

interface BehavioralOutcome {
  task: string;
  rating: string;
}

interface CellularOutcome {
  function: string;
  rating: string;
}

interface MolecularOutcome {
  target: string;
  rating: string;
}

interface PaperSummary {
  group_id: string;
  treatment_identifier: string;
  treatment: string;
  treatment_short: string;
  reference: string;
  doi: string;
  species: string;
  model_name: string;
  model_short: string;
  sex: string;
  doses: string[];
  routes: string[];
  ages_at_treatment: string[];
  ages_at_testing: string[];
  behavioral_outcomes: BehavioralOutcome[];
  cellular_outcomes: CellularOutcome[];
  molecular_outcomes: MolecularOutcome[];
  tissues: string[];
  celltypes: string[];
  n_experimental_rows: number;
  source_row_indices: number[];
}

function isValidValue(v: string | undefined | null): boolean {
  if (!v) return false;
  const lower = v.toLowerCase().trim();
  return lower !== "na" && lower !== "none" && lower !== "" && lower !== "n/a";
}

function dedupe<T>(arr: T[], keyFn?: (item: T) => string): T[] {
  if (!keyFn) {
    return [...new Set(arr)];
  }
  const seen = new Set<string>();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildPaperSummaries(): void {
  const inputPath = path.join(process.cwd(), "data", "interventions.cleaned.json");
  const outputPath = path.join(process.cwd(), "data", "paper-summaries.json");

  const rows: InterventionRow[] = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  console.log(`Loaded ${rows.length} intervention rows`);

  const groups = new Map<string, InterventionRow[]>();

  for (const row of rows) {
    const key = `${row.treatment_identifier}|${row.reference}|${row.model_name}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }

  console.log(`Grouped into ${groups.size} paper-level summaries`);

  const summaries: PaperSummary[] = [];

  for (const [groupId, groupRows] of groups) {
    const first = groupRows[0];

    const doses: string[] = [];
    const routes: string[] = [];
    const agesAtTreatment: string[] = [];
    const agesAtTesting: string[] = [];
    const behavioralOutcomes: BehavioralOutcome[] = [];
    const cellularOutcomes: CellularOutcome[] = [];
    const molecularOutcomes: MolecularOutcome[] = [];
    const tissues: string[] = [];
    const celltypes: string[] = [];
    const sourceRowIndices: number[] = [];

    for (const row of groupRows) {
      sourceRowIndices.push(row._row_index);

      if (isValidValue(row.dose)) doses.push(row.dose);
      if (isValidValue(row.administration_route)) routes.push(row.administration_route);
      if (isValidValue(row.age_at_treatment)) agesAtTreatment.push(row.age_at_treatment);
      if (isValidValue(row.age_at_testing)) agesAtTesting.push(row.age_at_testing);

      if (isValidValue(row.behavior_task_of_interest) && isValidValue(row.behavior_effect_rating)) {
        behavioralOutcomes.push({
          task: row.behavior_task_of_interest,
          rating: row.behavior_effect_rating,
        });
      }

      if (isValidValue(row.cellular_or_molecular_function_tested) && isValidValue(row.cellular_or_molecular_effect_rating)) {
        cellularOutcomes.push({
          function: row.cellular_or_molecular_function_tested,
          rating: row.cellular_or_molecular_effect_rating,
        });
      }

      if (isValidValue(row.gene__transcript__protein_of_interest) && isValidValue(row.molecular_effect_rating)) {
        molecularOutcomes.push({
          target: row.gene__transcript__protein_of_interest,
          rating: row.molecular_effect_rating,
        });
      }

      if (isValidValue(row.tissue_or_organ)) {
        row.tissue_or_organ.split(",").map((t) => t.trim()).filter(isValidValue).forEach((t) => tissues.push(t));
      }
      if (isValidValue(row.celltype)) {
        row.celltype.split(",").map((c) => c.trim()).filter(isValidValue).forEach((c) => celltypes.push(c));
      }
    }

    const summary: PaperSummary = {
      group_id: groupId,
      treatment_identifier: first.treatment_identifier,
      treatment: first.treatment,
      treatment_short: first.treatment_short || first.treatment,
      reference: first.reference,
      doi: first.reference_with_link_to_publication,
      species: first.species,
      model_name: first.model_name,
      model_short: first.model_short || first.model_name,
      sex: first.sex_of_animals_and_sex_differences,
      doses: dedupe(doses),
      routes: dedupe(routes),
      ages_at_treatment: dedupe(agesAtTreatment),
      ages_at_testing: dedupe(agesAtTesting),
      behavioral_outcomes: dedupe(behavioralOutcomes, (o) => `${o.task}|${o.rating}`),
      cellular_outcomes: dedupe(cellularOutcomes, (o) => `${o.function}|${o.rating}`),
      molecular_outcomes: dedupe(molecularOutcomes, (o) => `${o.target}|${o.rating}`),
      tissues: dedupe(tissues),
      celltypes: dedupe(celltypes),
      n_experimental_rows: groupRows.length,
      source_row_indices: sourceRowIndices.sort((a, b) => a - b),
    };

    summaries.push(summary);
  }

  summaries.sort((a, b) => {
    const idA = parseInt(a.treatment_identifier.replace("DST", ""), 10);
    const idB = parseInt(b.treatment_identifier.replace("DST", ""), 10);
    if (idA !== idB) return idA - idB;
    return a.reference.localeCompare(b.reference);
  });

  fs.writeFileSync(outputPath, JSON.stringify(summaries, null, 2));
  console.log(`Wrote ${summaries.length} paper summaries to ${outputPath}`);
}

buildPaperSummaries();
