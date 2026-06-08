/**
 * Test script for database queries
 * Run with: npx tsx scripts/test-db.ts
 */

import {
  listAllInterventions,
  getByTreatmentId,
  listUniqueValues,
  countByBehaviorOutcome,
  topNTreatmentsByStudyCount,
  countBySpecies,
  countBySex,
  corpusStats,
} from "../src/lib/queries";

function main() {
  console.log("=== DS Therapeutics Explorer - Database Test ===\n");

  try {
    // Total interventions
    const allInterventions = listAllInterventions();
    console.log(`Total interventions: ${allInterventions.length}`);

    // Total unique DSTs
    const uniqueDSTs = listUniqueValues("treatment_identifier");
    console.log(`Total unique DSTs: ${uniqueDSTs.length}`);

    // Total unique species
    const uniqueSpecies = listUniqueValues("species");
    console.log(`Total unique species: ${uniqueSpecies.length}`);

    // Total unique DOIs (papers)
    const stats = corpusStats();
    console.log(`Total unique DOIs: ${stats.total_papers}`);

    // Behavior outcome counts
    console.log("\nBehavior outcome counts:");
    const outcomeCounts = countByBehaviorOutcome();
    for (const [outcome, count] of Object.entries(outcomeCounts)) {
      console.log(`  ${outcome}: ${count}`);
    }

    // Top 5 most-studied treatments
    console.log("\nTop 5 most-studied treatments:");
    const top5 = topNTreatmentsByStudyCount(5);
    for (const t of top5) {
      console.log(
        `  ${t.treatment_identifier}: ${t.canonical_name} (${t.study_count} studies, dominant: ${t.dominant_outcome})`
      );
    }

    // Species counts
    console.log("\nSpecies counts:");
    const speciesCounts = countBySpecies();
    for (const [species, count] of Object.entries(speciesCounts)) {
      console.log(`  ${species}: ${count}`);
    }

    // Sex counts
    console.log("\nSex counts:");
    const sexCounts = countBySex();
    for (const [sex, count] of Object.entries(sexCounts)) {
      console.log(`  ${sex}: ${count}`);
    }

    // Corpus stats
    console.log("\ncorpusStats():");
    console.log(`  total_experiments: ${stats.total_experiments}`);
    console.log(`  total_treatments: ${stats.total_treatments}`);
    console.log(`  total_species: ${stats.total_species}`);
    console.log(`  total_papers: ${stats.total_papers}`);

    // Test getByTreatmentId
    console.log("\nTest getByTreatmentId('DST01'):");
    const dst01 = getByTreatmentId("DST01");
    console.log(`  Found ${dst01.length} rows for DST01`);

    console.log("\n=== All tests passed ===");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
