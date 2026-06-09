import * as fs from "fs";
import * as path from "path";
import { embedQuery } from "./embedder-server";

export interface StructuredHit {
  treatment_identifier: string;
  canonical_name: string;
  species: string;
  model_name: string;
  sex: string;
  behavior_task: string;
  behavior_effect: string;
  cellular_effect: string;
  molecular_effect: string;
  reference: string;
  doi: string;
  relevance_score: number;
  year: string;
}

export interface PaperHit {
  doi: string;
  title: string;
  authors: string;
  year: string;
  abstract_excerpt: string;
  similarity_score: number;
}

export interface RetrievalResult {
  structuredHits: StructuredHit[];
  paperHits: PaperHit[];
}

interface InterventionRow {
  treatment_identifier?: string;
  treatment?: string;
  canonical_treatment?: string;
  species?: string;
  model_name?: string;
  sex?: string;
  behavior_task_of_interest?: string;
  behavioral_effect?: string;
  cellular_effect?: string;
  molecular_effect?: string;
  cellular_or_molecular_function_tested?: string;
  gene__transcript__protein_of_interest?: string;
  tissue_or_organ?: string;
  reference?: string;
  reference_with_link_to_publication?: string;
}

interface PaperEntry {
  doi: string;
  pmid: string;
  title: string;
  authors: string;
  year: string;
  chunks: Array<{
    section: string;
    text: string;
    embedding: number[];
  }>;
}

type PapersDB = Record<string, PaperEntry>;

const TREATMENT_ALIASES: Record<string, string[]> = {
  egcg: ["egcg", "green tea extract", "egcg-gte", "gte", "epigallocatechin"],
  memantine: ["memantine"],
  rapamycin: ["rapamycin", "sirolimus"],
  fluoxetine: ["fluoxetine", "prozac"],
  sag: ["sag", "sonic hedgehog agonist"],
  ptz: ["ptz", "pentylenetetrazol"],
  donepezil: ["donepezil", "aricept"],
};

interface ComparisonEntities {
  entityA: string;
  entityB: string;
}

function detectComparison(question: string): ComparisonEntities | null {
  const q = question.toLowerCase();

  const patterns = [
    /compare\s+(\w+(?:\s+\w+)?)\s+(?:and|vs\.?|versus)\s+(\w+(?:\s+\w+)?)/i,
    /(\w+)\s+(?:vs\.?|versus)\s+(\w+)/i,
    /contrast\s+(\w+(?:\s+\w+)?)\s+(?:and|with)\s+(\w+(?:\s+\w+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match) {
      let entityA = match[1].trim().replace(/[.,!?]$/, "");
      let entityB = match[2].trim().replace(/[.,!?]$/, "");
      // Remove trailing common words
      entityA = entityA.replace(/\s+(in|for|with|on|to)$/, "");
      entityB = entityB.replace(/\s+(in|for|with|on|to)$/, "");
      if (entityA && entityB && entityA !== entityB) {
        return { entityA, entityB };
      }
    }
  }

  return null;
}

function expandEntityKeywords(entity: string): string[] {
  const lower = entity.toLowerCase();
  for (const [canonical, aliases] of Object.entries(TREATMENT_ALIASES)) {
    if (aliases.some((a) => lower.includes(a) || a.includes(lower))) {
      return [canonical, ...aliases];
    }
  }
  return [lower];
}

const STOP_WORDS = new Set([
  "the", "a", "an", "in", "of", "for", "and", "or", "to", "is", "are",
  "was", "were", "with", "that", "this", "it", "be", "as", "at", "by", "from", "on", "not",
  "but", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "can", "about", "which", "what", "how", "when", "where", "who",
  "their", "they", "them", "these", "those", "its", "into", "than", "then", "there",
  "been", "being", "also", "more", "some", "such", "no", "if", "so", "we", "you",
]);

let interventionsCache: InterventionRow[] | null = null;
let papersCache: PapersDB | null = null;

function loadInterventions(): InterventionRow[] {
  if (!interventionsCache) {
    const filePath = path.join(process.cwd(), "data", "interventions.cleaned.json");
    const content = fs.readFileSync(filePath, "utf-8");
    interventionsCache = JSON.parse(content) as InterventionRow[];
  }
  return interventionsCache;
}

function loadPapers(): PapersDB {
  if (!papersCache) {
    const filePath = path.join(process.cwd(), "data", "papers.json");
    const content = fs.readFileSync(filePath, "utf-8");
    papersCache = JSON.parse(content) as PapersDB;
  }
  return papersCache;
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function countMatches(text: string, keywords: string[]): number {
  const lower = (text || "").toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

function extractYear(reference: string): string {
  const match = (reference || "").match(/(19|20)\d{2}/);
  return match ? match[0] : "0000";
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function searchStructured(
  keywords: string[],
  maxHits: number,
  pinnedDois: string[]
): StructuredHit[] {
  const rows = loadInterventions();
  const pinnedDoiSet = new Set(pinnedDois.map((d) => d.toLowerCase()));

  const scored = rows.map((row) => {
    const doi = (row.reference_with_link_to_publication || "").toLowerCase();
    const isPinned = pinnedDoiSet.has(doi) ||
      pinnedDois.some((p) => doi.includes(p.toLowerCase()));

    let score = 0;
    score += countMatches(row.treatment || "", keywords) * 3;
    score += countMatches(row.canonical_treatment || "", keywords) * 3;
    score += countMatches(row.model_name || "", keywords) * 2;
    score += countMatches(row.behavior_task_of_interest || "", keywords) * 2;
    score += countMatches(row.gene__transcript__protein_of_interest || "", keywords) * 2;
    score += countMatches(row.cellular_or_molecular_function_tested || "", keywords) * 1;
    score += countMatches(row.species || "", keywords) * 1;
    score += countMatches(row.tissue_or_organ || "", keywords) * 1;
    score += countMatches(row.reference || "", keywords) * 1;

    const year = extractYear(row.reference || "");

    return {
      row,
      score: isPinned ? Infinity : score,
      year,
      isPinned,
    };
  });

  return scored
    .filter((s) => s.score > 0 || s.isPinned)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.year.localeCompare(a.year);
    })
    .slice(0, maxHits)
    .map((s) => ({
      treatment_identifier: s.row.treatment_identifier || "",
      canonical_name: s.row.canonical_treatment || s.row.treatment || "",
      species: s.row.species || "",
      model_name: s.row.model_name || "",
      sex: s.row.sex || "",
      behavior_task: s.row.behavior_task_of_interest || "",
      behavior_effect: s.row.behavioral_effect || "",
      cellular_effect: s.row.cellular_effect || "",
      molecular_effect: s.row.molecular_effect || "",
      reference: s.row.reference || "",
      doi: s.row.reference_with_link_to_publication || "",
      relevance_score: s.isPinned ? 999 : s.score,
      year: s.year,
    }));
}

async function searchSemantic(
  questionEmbedding: number[],
  maxHits: number,
  pinnedDois: string[]
): Promise<PaperHit[]> {
  const papers = loadPapers();
  const pinnedDoiSet = new Set(pinnedDois.map((d) => d.toLowerCase()));

  const allChunks: Array<{
    doi: string;
    title: string;
    authors: string;
    year: string;
    text: string;
    similarity: number;
    isPinned: boolean;
  }> = [];

  for (const [doi, paper] of Object.entries(papers)) {
    const isPinned = pinnedDoiSet.has(doi.toLowerCase()) ||
      pinnedDois.some((p) => doi.toLowerCase().includes(p.toLowerCase()));

    for (const chunk of paper.chunks) {
      const similarity = cosineSimilarity(questionEmbedding, chunk.embedding);
      allChunks.push({
        doi,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        text: chunk.text,
        similarity: isPinned ? Infinity : similarity,
        isPinned,
      });
    }
  }

  const seen = new Set<string>();
  return allChunks
    .sort((a, b) => b.similarity - a.similarity)
    .filter((c) => {
      if (seen.has(c.doi)) return false;
      seen.add(c.doi);
      return true;
    })
    .slice(0, maxHits)
    .map((c) => ({
      doi: c.doi,
      title: c.title,
      authors: c.authors,
      year: c.year,
      abstract_excerpt: c.text.length > 500 ? c.text.slice(0, 497) + "..." : c.text,
      similarity_score: c.isPinned ? 1.0 : c.similarity,
    }));
}

function dedupeStructured(hits: StructuredHit[]): StructuredHit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = `${h.treatment_identifier}-${h.doi}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupePapers(hits: PaperHit[]): PaperHit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = h.doi.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function retrieve(
  question: string,
  options: {
    maxStructuredHits?: number;
    maxPaperHits?: number;
    pinnedDois?: string[];
  } = {}
): Promise<RetrievalResult> {
  const maxStructuredHits = options.maxStructuredHits ?? 8;
  const maxPaperHits = options.maxPaperHits ?? 5;
  const pinnedDois = options.pinnedDois ?? [];

  const comparison = detectComparison(question);

  // Balanced retrieval for comparison questions
  if (comparison) {
    const { entityA, entityB } = comparison;
    const kwA = expandEntityKeywords(entityA);
    const kwB = expandEntityKeywords(entityB);
    const combinedKw = extractKeywords(question);

    // Split limits: half for combined, quarter each for A and B
    const perEntityStructured = Math.max(2, Math.floor(maxStructuredHits / 4));
    const perEntityPaper = Math.max(1, Math.floor(maxPaperHits / 4));
    const combinedStructured = Math.max(2, Math.floor(maxStructuredHits / 2));
    const combinedPaper = Math.max(1, Math.floor(maxPaperHits / 2));

    const [questionEmbedding, embeddingA, embeddingB] = await Promise.all([
      embedQuery(question),
      embedQuery(entityA),
      embedQuery(entityB),
    ]);

    const structuredCombined = searchStructured(combinedKw, combinedStructured, pinnedDois);
    const structuredA = searchStructured(kwA, perEntityStructured, pinnedDois);
    const structuredB = searchStructured(kwB, perEntityStructured, pinnedDois);

    const [paperCombined, paperA, paperB] = await Promise.all([
      searchSemantic(questionEmbedding, combinedPaper, pinnedDois),
      searchSemantic(embeddingA, perEntityPaper, pinnedDois),
      searchSemantic(embeddingB, perEntityPaper, pinnedDois),
    ]);

    // Merge: interleave A and B first, then combined
    const mergedStructured: StructuredHit[] = [];
    const maxPer = Math.max(structuredA.length, structuredB.length);
    for (let i = 0; i < maxPer; i++) {
      if (structuredA[i]) mergedStructured.push(structuredA[i]);
      if (structuredB[i]) mergedStructured.push(structuredB[i]);
    }
    mergedStructured.push(...structuredCombined);

    const mergedPapers: PaperHit[] = [];
    const maxPaperPer = Math.max(paperA.length, paperB.length);
    for (let i = 0; i < maxPaperPer; i++) {
      if (paperA[i]) mergedPapers.push(paperA[i]);
      if (paperB[i]) mergedPapers.push(paperB[i]);
    }
    mergedPapers.push(...paperCombined);

    const structuredHits = dedupeStructured(mergedStructured).slice(0, maxStructuredHits);
    const paperHits = dedupePapers(mergedPapers).slice(0, maxPaperHits);

    console.log("[retrieval] balanced comparison", entityA, "vs", entityB,
      "structured:", structuredHits.length, "papers:", paperHits.length);

    return { structuredHits, paperHits };
  }

  // Standard retrieval
  const keywords = extractKeywords(question);

  const [structuredHits, questionEmbedding] = await Promise.all([
    Promise.resolve(searchStructured(keywords, maxStructuredHits, pinnedDois)),
    embedQuery(question),
  ]);

  const paperHits = await searchSemantic(questionEmbedding, maxPaperHits, pinnedDois);

  return { structuredHits, paperHits };
}
