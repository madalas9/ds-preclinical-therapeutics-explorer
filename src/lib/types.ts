/**
 * TypeScript types derived from schema.json
 * DS Therapeutics Explorer
 */

// === ENUM TYPES ===

export type Species = "Mouse" | "Rat" | "Fruit Fly" | "Zebrafish";

export type SexCategory =
  | "Males only"
  | "Females only"
  | "Males and Females"
  | "Males and Females, Not mentioned"
  | "Not mentioned";

export type EffectRating =
  | "Rescue"
  | "Partial Rescue"
  | "No effect"
  | "Differential Rescue (Dose-dependent)"
  | "NA";

export type AdministrationRoute =
  | "single subcutaneous injection"
  | "daily subcutaneous injection"
  | "subcutaneous injection"
  | "intraperitoneal injection"
  | "single intraperitoneal injection"
  | "intranasal"
  | "intracerebroventricular injection"
  | "oral"
  | "diet"
  | "water environment"
  | "bath"
  | "injection";

// === HELPER TYPES ===

/**
 * Fields that may contain "NA" as a sentinel for "not reported / not applicable"
 */
export type Maybe<T> = T | "NA";

// === MAIN INTERFACE ===

export interface Intervention {
  treatment_identifier: string;
  treatment: string;
  treatment_original?: string;
  treatment_short?: string;
  model_name: string;
  model_name_original?: string;
  model_short?: string;
  species: Species;
  administration_route: AdministrationRoute;
  dose: string;
  age_at_treatment: string;
  age_at_testing: string;
  sex_of_animals_and_sex_differences: SexCategory;
  tissue_or_organ: string;
  celltype: string;
  cellular_or_molecular_function_tested: string;
  cellular_or_molecular_effect_rating: EffectRating;
  gene__transcript__protein_of_interest: string;
  molecular_effect_rating: EffectRating;
  behavior_task_of_interest: string;
  behavior_effect_rating: EffectRating;
  reference: string;
  reference_with_link_to_publication: string;
  _row_index?: number;
}

// === CONSTANTS ===

/**
 * Display order for EffectRating values in charts and tables.
 * Rescue first (the "win"), then qualified wins, then caution, then neutral, then NA.
 */
export const OUTCOME_ORDER: readonly EffectRating[] = [
  "Rescue",
  "Partial Rescue",
  "Differential Rescue (Dose-dependent)",
  "No effect",
  "NA",
] as const;

/**
 * All species values in display order
 */
export const SPECIES_VALUES: readonly Species[] = [
  "Mouse",
  "Rat",
  "Fruit Fly",
  "Zebrafish",
] as const;

/**
 * All sex category values
 */
export const SEX_VALUES: readonly SexCategory[] = [
  "Males only",
  "Females only",
  "Males and Females",
  "Males and Females, Not mentioned",
  "Not mentioned",
] as const;
