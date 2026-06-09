export const SUGGESTED_PROMPTS = [
  // Spatial learning / memory rescue
  "Which compounds show rescue of spatial learning in the Morris Water Maze in Ts65Dn mice?",
  "What interventions improve novel object recognition in Down syndrome mouse models?",
  "How does Y-maze performance compare across different treatments in trisomic mice?",
  "Which DYRK1A inhibitors rescue working memory deficits?",

  // Mechanism questions (paper RAG showcase)
  "What is the proposed mechanism by which SAG rescues cerebellar development in Ts65Dn?",
  "How does EGCG affect DYRK1A kinase activity and what downstream effects does this have?",
  "What is the evidence for Rapamycin's effects on mTOR signaling in Down syndrome models?",
  "How does Fluoxetine affect hippocampal neurogenesis in trisomic mice?",
  "What molecular pathways are implicated in Memantine's cognitive rescue effects?",

  // Compound comparisons
  "Compare the behavioral outcomes of EGCG versus Memantine in Ts65Dn mice.",
  "Which polyphenol compounds have been tested and how do their effects compare?",
  "What are all the DYRK1A inhibitors in the database and their relative efficacy?",
  "How do environmental enrichment effects compare to pharmacological interventions?",

  // Sex-bias questions
  "Which studies tested both male and female mice and did outcomes differ by sex?",
  "Are there any compounds tested exclusively in female Down syndrome models?",
  "What is the sex distribution of subjects across all experiments in the database?",

  // Species coverage
  "What compounds have been tested in Drosophila models of Down syndrome?",
  "Are there any interventions tested in zebrafish trisomy models?",
  "Which treatments have been tested across multiple species (mouse, fly, fish)?",

  // Specific outcomes
  "Which interventions affect APP overexpression or amyloid pathology?",
  "What treatments rescue long-term potentiation (LTP) deficits?",
  "Which compounds improve dendritic spine density or morphology?",
  "What is the evidence for autophagy modulation in Down syndrome treatments?",
  "How do different treatments affect cerebellar granule cell proliferation?",

  // Age windows
  "Which prenatal interventions have been tested in Down syndrome models?",
  "What is the evidence for critical developmental windows in treatment efficacy?",
  "Are there treatments effective when given to adult trisomic mice?",

  // Methodology
  "What dose ranges of EGCG have been tested and do effects vary with dose?",
  "What administration routes (oral, injection, etc.) are most common in the database?",

  // Coverage gaps
  "What brain regions are least studied in Down syndrome intervention research?",
  "Which treatment classes have the fewest experiments in the database?",
];

export function getRandomPrompts(count: number = 4): string[] {
  const shuffled = [...SUGGESTED_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
