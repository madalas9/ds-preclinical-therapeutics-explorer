/**
 * Data query functions
 * DS Therapeutics Explorer
 *
 * All functions return data ready for UI consumption — no further processing required.
 * Reads from in-memory JSON data loaded by db.ts.
 */

import { getAllRows } from "./db";
import type {
  Intervention,
  EffectRating,
  Species,
  SexCategory,
} from "./types";

/**
 * Returns all 232 intervention rows
 */
export function listAllInterventions(): Intervention[] {
  return getAllRows();
}

/**
 * Returns all rows for a single treatment identifier (e.g., "DST01")
 * Returns empty array if not found.
 */
export function getByTreatmentId(id: string): Intervention[] {
  return getAllRows().filter((r) => r.treatment_identifier === id);
}

/**
 * Returns distinct non-NA values for a column, sorted alphabetically.
 * Used for filter dropdowns.
 */
export function listUniqueValues(column: keyof Intervention): string[] {
  const seen = new Set<string>();
  for (const row of getAllRows()) {
    const val = row[column];
    if (typeof val === "string" && val !== "NA") {
      seen.add(val);
    }
  }
  return Array.from(seen).sort();
}

/**
 * Counts of rows grouped by behavior_effect_rating.
 * Returns a Record with all 5 EffectRating values as keys.
 */
export function countByBehaviorOutcome(): Record<EffectRating, number> {
  const result: Record<EffectRating, number> = {
    Rescue: 0,
    "Partial Rescue": 0,
    "No effect": 0,
    "Differential Rescue (Dose-dependent)": 0,
    NA: 0,
  };

  for (const row of getAllRows()) {
    const outcome = row.behavior_effect_rating;
    if (outcome in result) {
      result[outcome]++;
    }
  }

  return result;
}

/**
 * Top N treatments by study count (distinct DOIs).
 * Used for the "Top 10 most-studied compounds" chart.
 */
export function topNTreatmentsByStudyCount(n: number): Array<{
  treatment_identifier: string;
  canonical_name: string;
  treatment_short: string;
  study_count: number;
  dominant_outcome: EffectRating;
}> {
  const rows = getAllRows();

  // Group by treatment_identifier
  const byTreatment = new Map<
    string,
    {
      dois: Set<string>;
      names: Map<string, number>;
      shortName: string | null;
      outcomes: Map<EffectRating, number>;
    }
  >();

  for (const row of rows) {
    const tid = row.treatment_identifier;
    if (!byTreatment.has(tid)) {
      byTreatment.set(tid, {
        dois: new Set(),
        names: new Map(),
        shortName: null,
        outcomes: new Map(),
      });
    }
    const data = byTreatment.get(tid)!;
    data.dois.add(row.reference_with_link_to_publication);
    data.names.set(row.treatment, (data.names.get(row.treatment) || 0) + 1);
    if (row.treatment_short && !data.shortName) {
      data.shortName = row.treatment_short;
    }
    if (row.behavior_effect_rating !== "NA") {
      data.outcomes.set(
        row.behavior_effect_rating,
        (data.outcomes.get(row.behavior_effect_rating) || 0) + 1
      );
    }
  }

  // Build result array
  const results: Array<{
    treatment_identifier: string;
    canonical_name: string;
    treatment_short: string;
    study_count: number;
    dominant_outcome: EffectRating;
  }> = [];

  for (const [tid, data] of byTreatment) {
    // Find canonical name (most frequent)
    let canonicalName = "";
    let maxCount = 0;
    for (const [name, count] of data.names) {
      if (count > maxCount) {
        maxCount = count;
        canonicalName = name;
      }
    }

    // Find dominant outcome
    let dominantOutcome: EffectRating = "NA";
    let maxOutcomeCount = 0;
    for (const [outcome, count] of data.outcomes) {
      if (count > maxOutcomeCount) {
        maxOutcomeCount = count;
        dominantOutcome = outcome;
      }
    }

    results.push({
      treatment_identifier: tid,
      canonical_name: canonicalName,
      treatment_short: data.shortName || canonicalName,
      study_count: data.dois.size,
      dominant_outcome: dominantOutcome,
    });
  }

  // Sort by study count descending and take top N
  results.sort((a, b) => b.study_count - a.study_count);
  return results.slice(0, n);
}

/**
 * Counts grouped by species.
 * Used for the Species Coverage donut.
 */
export function countBySpecies(): Record<Species, number> {
  const result: Record<Species, number> = {
    Mouse: 0,
    Rat: 0,
    "Fruit Fly": 0,
    Zebrafish: 0,
  };

  for (const row of getAllRows()) {
    const species = row.species as Species;
    if (species in result) {
      result[species]++;
    }
  }

  return result;
}

/**
 * Counts grouped by sex_of_animals_and_sex_differences.
 * Used for the Sex Coverage donut.
 */
export function countBySex(): Record<SexCategory, number> {
  const result: Record<SexCategory, number> = {
    "Males only": 0,
    "Females only": 0,
    "Males and Females": 0,
    "Males and Females, Not mentioned": 0,
    "Not mentioned": 0,
  };

  for (const row of getAllRows()) {
    const sex = row.sex_of_animals_and_sex_differences as SexCategory;
    if (sex in result) {
      result[sex]++;
    }
  }

  return result;
}

/**
 * Corpus-level statistics for the hero stat cards.
 */
export function corpusStats(): {
  total_experiments: number;
  total_treatments: number;
  total_species: number;
  total_papers: number;
} {
  const rows = getAllRows();
  const treatments = new Set<string>();
  const species = new Set<string>();
  const papers = new Set<string>();

  for (const row of rows) {
    treatments.add(row.treatment_identifier);
    species.add(row.species);
    papers.add(row.reference_with_link_to_publication);
  }

  return {
    total_experiments: rows.length,
    total_treatments: treatments.size,
    total_species: species.size,
    total_papers: papers.size,
  };
}

/**
 * Infer treatment class from the canonical name using keyword matching.
 */
export function inferTreatmentClass(name: string): string {
  const lower = name.toLowerCase();

  if (
    lower.includes("egcg") ||
    lower.includes("epigallocatechin") ||
    lower.includes("green tea") ||
    lower.includes("polyphenon")
  ) {
    return "Polyphenol";
  }
  if (
    lower.includes("oleic") ||
    lower.includes("linolenic") ||
    lower.includes("fish oil") ||
    lower.includes("corn oil")
  ) {
    return "PUFA / Lipid";
  }
  if (lower.includes("choline")) {
    return "Nutrient";
  }
  if (
    lower.includes("curcumin") ||
    lower.includes("tocopherol") ||
    lower.includes("melatonin") ||
    lower.includes("luteolin") ||
    lower.includes("aristolactam")
  ) {
    return "Natural product";
  }
  if (
    lower.includes("peptide") ||
    lower.includes("p021") ||
    lower.includes("kyccsrk") ||
    lower.includes("glucagon")
  ) {
    return "Peptide";
  }
  if (
    lower.includes("rapamycin") ||
    lower.includes("fluoxetine") ||
    lower.includes("donepezil") ||
    lower.includes("memantine") ||
    lower.includes("neurotropin")
  ) {
    return "Approved drug";
  }
  if (lower.includes("environmental")) {
    return "Environmental";
  }

  return "Small molecule";
}

/**
 * Get all treatment summaries with aggregated data for the treatments table.
 * Sorted descending by study_count.
 */
export function getAllTreatmentSummaries(): Array<{
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
}> {
  const rows = getAllRows();

  // Group by treatment_identifier
  const byTreatment = new Map<
    string,
    {
      dois: Set<string>;
      names: Map<string, number>;
      shortName: string | null;
      models: Set<string>;
      species: Set<string>;
      outcomeCounts: Record<EffectRating, number>;
    }
  >();

  for (const row of rows) {
    const tid = row.treatment_identifier;
    if (!byTreatment.has(tid)) {
      byTreatment.set(tid, {
        dois: new Set(),
        names: new Map(),
        shortName: null,
        models: new Set(),
        species: new Set(),
        outcomeCounts: {
          Rescue: 0,
          "Partial Rescue": 0,
          "No effect": 0,
          "Differential Rescue (Dose-dependent)": 0,
          NA: 0,
        },
      });
    }
    const data = byTreatment.get(tid)!;
    data.dois.add(row.reference_with_link_to_publication);
    data.names.set(row.treatment, (data.names.get(row.treatment) || 0) + 1);
    if (row.treatment_short && !data.shortName) {
      data.shortName = row.treatment_short;
    }
    if (row.model_name !== "NA") {
      data.models.add(row.model_name);
    }
    data.species.add(row.species);
    data.outcomeCounts[row.behavior_effect_rating]++;
  }

  // Build result array
  const results: Array<{
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
  }> = [];

  for (const [tid, data] of byTreatment) {
    // Find canonical name (most frequent)
    let canonicalName = "";
    let maxCount = 0;
    for (const [name, count] of data.names) {
      if (count > maxCount) {
        maxCount = count;
        canonicalName = name;
      }
    }

    // Find dominant outcome (excluding NA)
    let dominantOutcome: EffectRating = "NA";
    let maxOutcomeCount = 0;
    for (const [outcome, count] of Object.entries(data.outcomeCounts)) {
      if (outcome !== "NA" && count > maxOutcomeCount) {
        maxOutcomeCount = count;
        dominantOutcome = outcome as EffectRating;
      }
    }

    // Count experiments for this treatment
    const experimentCount = rows.filter(
      (r) => r.treatment_identifier === tid
    ).length;

    results.push({
      treatment_identifier: tid,
      canonical_name: canonicalName,
      treatment_short: data.shortName || canonicalName,
      treatment_class_hint: inferTreatmentClass(canonicalName),
      study_count: data.dois.size,
      experiment_count: experimentCount,
      models_tested: data.models.size,
      species_list: Array.from(data.species).join(","),
      dominant_outcome: dominantOutcome,
      outcome_counts: data.outcomeCounts,
    });
  }

  // Sort by study count descending, then by ID
  results.sort((a, b) => {
    if (b.study_count !== a.study_count) {
      return b.study_count - a.study_count;
    }
    return a.treatment_identifier.localeCompare(b.treatment_identifier);
  });

  return results;
}

function parseYearFromCitation(citation: string): number | null {
  const match = citation.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

export interface TreatmentMetadata {
  treatment_identifier: string;
  canonical_name: string;
  treatment_short: string;
  treatment_original_variants: string[];
  experiment_count: number;
  study_count: number;
  distinct_models: { name: string; count: number }[];
  distinct_species: string[];
  distinct_references: {
    citation: string;
    doi: string;
    year_hint: number | null;
  }[];
  sex_breakdown: Record<string, number>;
  dominant_administration_route: string | null;
  dose_examples: string[];
}

export function getTreatmentMetadata(id: string): TreatmentMetadata | null {
  const rows = getAllRows().filter((r) => r.treatment_identifier === id);
  if (rows.length === 0) return null;

  // Find canonical name (most frequent)
  const nameCounts = new Map<string, number>();
  let shortName: string | null = null;
  for (const row of rows) {
    nameCounts.set(row.treatment, (nameCounts.get(row.treatment) || 0) + 1);
    if (row.treatment_short && !shortName) {
      shortName = row.treatment_short;
    }
  }
  let canonicalName = "";
  let maxCount = 0;
  for (const [name, count] of nameCounts) {
    if (count > maxCount) {
      maxCount = count;
      canonicalName = name;
    }
  }

  // Original variants
  const variants = new Set<string>();
  for (const row of rows) {
    if (
      row.treatment_original &&
      row.treatment_original !== "NA" &&
      row.treatment_original !== canonicalName
    ) {
      variants.add(row.treatment_original);
    }
  }

  // Distinct DOIs
  const dois = new Set<string>();
  for (const row of rows) {
    dois.add(row.reference_with_link_to_publication);
  }

  // Model counts
  const modelCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.model_name !== "NA") {
      modelCounts.set(
        row.model_name,
        (modelCounts.get(row.model_name) || 0) + 1
      );
    }
  }
  const distinctModels = Array.from(modelCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Distinct species
  const speciesSet = new Set<string>();
  for (const row of rows) {
    speciesSet.add(row.species);
  }
  const distinctSpecies = Array.from(speciesSet).sort();

  // Distinct references
  const refMap = new Map<string, { citation: string; doi: string }>();
  for (const row of rows) {
    if (!refMap.has(row.reference_with_link_to_publication)) {
      refMap.set(row.reference_with_link_to_publication, {
        citation: row.reference,
        doi: row.reference_with_link_to_publication,
      });
    }
  }
  const distinctReferences = Array.from(refMap.values()).map((r) => ({
    citation: r.citation,
    doi: r.doi,
    year_hint: parseYearFromCitation(r.citation),
  }));

  // Sex breakdown
  const sexBreakdown: Record<string, number> = {};
  for (const row of rows) {
    const sex = row.sex_of_animals_and_sex_differences;
    sexBreakdown[sex] = (sexBreakdown[sex] || 0) + 1;
  }

  // Dominant administration route
  const routeCounts = new Map<string, number>();
  for (const row of rows) {
    if ((row.administration_route as string) !== "NA") {
      routeCounts.set(
        row.administration_route,
        (routeCounts.get(row.administration_route) || 0) + 1
      );
    }
  }
  let dominantRoute: string | null = null;
  let maxRouteCount = 0;
  for (const [route, count] of routeCounts) {
    if (count > maxRouteCount) {
      maxRouteCount = count;
      dominantRoute = route;
    }
  }

  // Dose examples
  const doseSet = new Set<string>();
  for (const row of rows) {
    if (row.dose !== "NA" && doseSet.size < 5) {
      doseSet.add(row.dose);
    }
  }

  return {
    treatment_identifier: id,
    canonical_name: canonicalName,
    treatment_short: shortName || canonicalName,
    treatment_original_variants: Array.from(variants),
    experiment_count: rows.length,
    study_count: dois.size,
    distinct_models: distinctModels,
    distinct_species: distinctSpecies,
    distinct_references: distinctReferences,
    sex_breakdown: sexBreakdown,
    dominant_administration_route: dominantRoute,
    dose_examples: Array.from(doseSet),
  };
}

export interface TreatmentOutcomeBreakdowns {
  behavior: Record<EffectRating, number>;
  cellular: Record<EffectRating, number>;
  molecular: Record<EffectRating, number>;
}

function emptyOutcomeCounts(): Record<EffectRating, number> {
  return {
    Rescue: 0,
    "Partial Rescue": 0,
    "No effect": 0,
    "Differential Rescue (Dose-dependent)": 0,
    NA: 0,
  };
}

export function getTreatmentOutcomeBreakdowns(
  id: string
): TreatmentOutcomeBreakdowns {
  const rows = getAllRows().filter((r) => r.treatment_identifier === id);

  const behavior = emptyOutcomeCounts();
  const cellular = emptyOutcomeCounts();
  const molecular = emptyOutcomeCounts();

  for (const row of rows) {
    behavior[row.behavior_effect_rating]++;
    cellular[row.cellular_or_molecular_effect_rating]++;
    molecular[row.molecular_effect_rating]++;
  }

  return { behavior, cellular, molecular };
}

export interface CorpusHierarchyRow {
  species: string;
  treatment_class: string;
  behavior_outcome: EffectRating;
  count: number;
}

export function getCorpusHierarchy(): CorpusHierarchyRow[] {
  const rows = getAllRows();
  const aggregation = new Map<string, number>();

  for (const row of rows) {
    const treatmentClass = inferTreatmentClass(row.treatment);
    const key = `${row.species}|${treatmentClass}|${row.behavior_effect_rating}`;
    aggregation.set(key, (aggregation.get(key) || 0) + 1);
  }

  const result: CorpusHierarchyRow[] = [];
  for (const [key, count] of aggregation) {
    const [species, treatment_class, behavior_outcome] = key.split("|");
    result.push({
      species,
      treatment_class,
      behavior_outcome: behavior_outcome as EffectRating,
      count,
    });
  }

  return result;
}

export type OutcomeTypeKey = "behavioral" | "cellular" | "molecular";

export interface CorpusHierarchy4LevelRow {
  species: string;
  treatment_identifier: string;
  canonical_treatment: string;
  outcome_type:
    | "Behavioral"
    | "Cellular/Molecular Function"
    | "Gene/Transcript/Protein";
  outcome_rating: EffectRating;
  count: number;
}

export function getCorpusHierarchy4Level(
  outcomeTypes?: OutcomeTypeKey[]
): CorpusHierarchy4LevelRow[] {
  const types = outcomeTypes || ["behavioral", "cellular", "molecular"];
  const rows = getAllRows();
  const aggregation = new Map<string, number>();

  for (const row of rows) {
    if (types.includes("behavioral")) {
      const key = `${row.species}|${row.treatment_identifier}|${row.treatment}|Behavioral|${row.behavior_effect_rating}`;
      aggregation.set(key, (aggregation.get(key) || 0) + 1);
    }
    if (types.includes("cellular")) {
      const key = `${row.species}|${row.treatment_identifier}|${row.treatment}|Cellular/Molecular Function|${row.cellular_or_molecular_effect_rating}`;
      aggregation.set(key, (aggregation.get(key) || 0) + 1);
    }
    if (types.includes("molecular")) {
      const key = `${row.species}|${row.treatment_identifier}|${row.treatment}|Gene/Transcript/Protein|${row.molecular_effect_rating}`;
      aggregation.set(key, (aggregation.get(key) || 0) + 1);
    }
  }

  const result: CorpusHierarchy4LevelRow[] = [];
  for (const [key, count] of aggregation) {
    const [
      species,
      treatment_identifier,
      treatment,
      outcome_type,
      outcome_rating,
    ] = key.split("|");
    result.push({
      species,
      treatment_identifier,
      canonical_treatment: treatment,
      outcome_type: outcome_type as CorpusHierarchy4LevelRow["outcome_type"],
      outcome_rating: outcome_rating as EffectRating,
      count,
    });
  }

  return result;
}

export interface CorpusStructureRow {
  species: string;
  model: string;
  model_name_canonical: string;
  treatment_class: string;
  treatment_identifier: string;
  treatment_short: string;
  canonical_treatment: string;
  count: number;
}

export function getCorpusStructureHierarchy(): CorpusStructureRow[] {
  const rows = getAllRows();
  const aggregation = new Map<
    string,
    {
      count: number;
      modelShort: string;
      modelCanonical: string;
      treatmentShort: string;
      treatmentCanonical: string;
    }
  >();

  for (const row of rows) {
    if (
      (row.species as string) === "NA" ||
      row.model_name === "NA" ||
      row.treatment_identifier === "NA"
    ) {
      continue;
    }

    const key = `${row.species}|${row.model_name}|${row.treatment_identifier}`;
    if (!aggregation.has(key)) {
      aggregation.set(key, {
        count: 0,
        modelShort: row.model_short || row.model_name,
        modelCanonical: row.model_name,
        treatmentShort: row.treatment_short || row.treatment,
        treatmentCanonical: row.treatment,
      });
    }
    const data = aggregation.get(key)!;
    data.count++;
  }

  const result: CorpusStructureRow[] = [];
  for (const [key, data] of aggregation) {
    const [species, modelName, treatmentId] = key.split("|");
    result.push({
      species,
      model: data.modelShort,
      model_name_canonical: data.modelCanonical,
      treatment_class: inferTreatmentClass(data.treatmentCanonical),
      treatment_identifier: treatmentId,
      treatment_short: data.treatmentShort,
      canonical_treatment: data.treatmentCanonical,
      count: data.count,
    });
  }

  // Sort by species, model, treatment_identifier
  result.sort((a, b) => {
    if (a.species !== b.species) return a.species.localeCompare(b.species);
    if (a.model !== b.model) return a.model.localeCompare(b.model);
    return a.treatment_identifier.localeCompare(b.treatment_identifier);
  });

  return result;
}
