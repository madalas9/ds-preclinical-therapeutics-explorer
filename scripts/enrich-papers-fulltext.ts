import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import pLimit from "p-limit";
import { pmidsToPmcidsBatch } from "./ingest/pmid-to-pmcid";
import { fetchJatsXml } from "./ingest/jats-fetcher";
import {
  extractMethodsSection,
  extractResultsSection,
  extractFigureLegends,
} from "./ingest/section-extractor";
import { condenseSection } from "./ingest/sentence-condenser";
import { chunkText } from "./ingest/chunker";
import { embed } from "./ingest/embedder";

interface PaperChunk {
  section: "abstract" | "methods" | "results" | "figures";
  text: string;
  embedding: number[];
}

interface PaperEntry {
  doi: string;
  pmid: string;
  pmcid?: string;
  title: string;
  authors: string;
  year: string;
  journal: string;
  abstract: string;
  tldr: string | null;
  mesh: string[];
  keywords: string[];
  publication_types: string[];
  has_full_text: boolean;
  chunks: PaperChunk[];
}

type PapersDB = Record<string, PaperEntry>;

const DATA_DIR = path.join(__dirname, "..", "data");
const PAPERS_JSON = path.join(DATA_DIR, "papers.json");
const CACHE_DIR = path.join(DATA_DIR, "papers.cache");

function sanitizeDoi(doi: string): string {
  return doi.replace(/\//g, "__");
}

function loadPapers(): PapersDB {
  const content = fs.readFileSync(PAPERS_JSON, "utf-8");
  return JSON.parse(content) as PapersDB;
}

function savePapers(papers: PapersDB): void {
  const sorted = Object.keys(papers)
    .sort()
    .reduce((acc, key) => {
      acc[key] = papers[key];
      return acc;
    }, {} as PapersDB);

  fs.writeFileSync(PAPERS_JSON, JSON.stringify(sorted, null, 2));
}

function savePaperCache(doi: string, entry: PaperEntry): void {
  const filename = `${sanitizeDoi(doi)}.json`;
  const filepath = path.join(CACHE_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(entry, null, 2));
}

function isAlreadyEnriched(entry: PaperEntry): boolean {
  return entry.chunks.some((c) => c.section !== "abstract");
}

async function embedChunks(
  texts: string[],
  section: "methods" | "results" | "figures"
): Promise<PaperChunk[]> {
  const chunks: PaperChunk[] = [];
  for (const text of texts) {
    const embedding = await embed(text);
    chunks.push({ section, text, embedding });
  }
  return chunks;
}

async function main() {
  if (!process.env.NCBI_API_KEY) {
    console.error("ERROR: NCBI_API_KEY is not set.");
    console.error("Please edit .env.local with your NCBI API key.");
    process.exit(1);
  }

  console.log("Loading embedding model...");
  await embed("warmup text for model initialization");
  console.log("Embedding model ready.\n");

  const papers = loadPapers();
  const allDois = Object.keys(papers);

  const withPmid = allDois.filter((doi) => papers[doi].pmid);
  const alreadyEnriched = withPmid.filter((doi) => isAlreadyEnriched(papers[doi]));
  const toProcess = withPmid.filter((doi) => !isAlreadyEnriched(papers[doi]));

  console.log(`Total papers in papers.json: ${allDois.length}`);
  console.log(`Papers with PMID: ${withPmid.length}`);
  console.log(`Already enriched (skipped): ${alreadyEnriched.length}`);
  console.log(`Papers to enrich: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log("Nothing to do — all papers already enriched or no PMIDs.");
    return;
  }

  console.log("Phase A: Converting PMIDs to PMCIDs...");
  const pmidList = toProcess.map((doi) => papers[doi].pmid);
  const pmidTopmcid = await pmidsToPmcidsBatch(pmidList);
  console.log(`PMC full text available: ${pmidTopmcid.size} / ${toProcess.length} papers\n`);

  const doiToPmcid = new Map<string, string>();
  for (const doi of toProcess) {
    const pmid = papers[doi].pmid;
    const pmcid = pmidTopmcid.get(pmid);
    if (pmcid) {
      doiToPmcid.set(doi, pmcid);
    }
  }

  const doisWithPmc = Array.from(doiToPmcid.keys());
  console.log(`Phase B: Fetching and processing ${doisWithPmc.length} PMC articles...\n`);

  const limit = pLimit(5);
  let processed = 0;
  let enriched = 0;
  let noPmcOa = 0;

  const stats = {
    methodsChars: 0,
    resultsChars: 0,
    figuresChars: 0,
    methodsChunks: 0,
    resultsChunks: 0,
    figuresChunks: 0,
  };

  const tasks = doisWithPmc.map((doi) =>
    limit(async () => {
      processed++;
      const pmcid = doiToPmcid.get(doi)!;
      const prefix = `[${processed}/${doisWithPmc.length}]`;

      try {
        console.log(`${prefix} ${doi} → PMC${pmcid}`);

        const xml = await fetchJatsXml(pmcid);
        if (!xml) {
          console.log(`${prefix}   ⚠ No PMC OA available`);
          noPmcOa++;
          return;
        }

        const rawMethods = extractMethodsSection(xml);
        const rawResults = extractResultsSection(xml);
        const rawFigures = extractFigureLegends(xml);

        const condensedMethods = condenseSection(rawMethods, 3500, "methods");
        const condensedResults = condenseSection(rawResults, 5500, "results");
        const condensedFigures = condenseSection(rawFigures, 3000, "figures");

        const newChunks: PaperChunk[] = [];

        if (condensedMethods.length > 50) {
          const methodTexts = chunkText(condensedMethods, { targetTokens: 400, overlapTokens: 50 });
          const methodChunks = await embedChunks(methodTexts, "methods");
          newChunks.push(...methodChunks);
          stats.methodsChars += condensedMethods.length;
          stats.methodsChunks += methodChunks.length;
        }

        if (condensedResults.length > 50) {
          const resultTexts = chunkText(condensedResults, { targetTokens: 400, overlapTokens: 50 });
          const resultChunks = await embedChunks(resultTexts, "results");
          newChunks.push(...resultChunks);
          stats.resultsChars += condensedResults.length;
          stats.resultsChunks += resultChunks.length;
        }

        if (condensedFigures.length > 50) {
          const figureTexts = chunkText(condensedFigures, { targetTokens: 400, overlapTokens: 50 });
          const figureChunks = await embedChunks(figureTexts, "figures");
          newChunks.push(...figureChunks);
          stats.figuresChars += condensedFigures.length;
          stats.figuresChunks += figureChunks.length;
        }

        if (newChunks.length > 0) {
          papers[doi].chunks.push(...newChunks);
          papers[doi].has_full_text = true;
          papers[doi].pmcid = pmcid;
          savePaperCache(doi, papers[doi]);
          enriched++;
          console.log(`${prefix}   ✓ Added ${newChunks.length} chunks (M:${stats.methodsChunks > 0 ? "+" : ""}${newChunks.filter(c => c.section === "methods").length} R:${newChunks.filter(c => c.section === "results").length} F:${newChunks.filter(c => c.section === "figures").length})`);
        } else {
          console.log(`${prefix}   ⚠ No extractable sections`);
        }

        if (processed % 10 === 0) {
          savePapers(papers);
          console.log(`[Checkpoint] Saved papers.json`);
        }

        await new Promise((r) => setTimeout(r, 105));
      } catch (err) {
        console.error(`${prefix}   ✗ ERROR:`, err);
      }
    })
  );

  await Promise.all(tasks);

  savePapers(papers);

  const totalChunks = {
    abstract: 0,
    methods: 0,
    results: 0,
    figures: 0,
  };
  let fullTextCount = 0;
  let abstractOnlyCount = 0;

  for (const entry of Object.values(papers)) {
    if (entry.has_full_text) fullTextCount++;
    else abstractOnlyCount++;

    for (const chunk of entry.chunks) {
      const section = chunk.section as keyof typeof totalChunks;
      totalChunks[section] = (totalChunks[section] || 0) + 1;
    }
  }

  const fileSize = fs.statSync(PAPERS_JSON).size;
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

  console.log("\n=== SUMMARY ===");
  console.log(`Total papers in papers.json: ${allDois.length}`);
  console.log(`Newly enriched this run: ${enriched}`);
  console.log(`Already enriched (skipped): ${alreadyEnriched.length}`);
  console.log(`No PMC OA available: ${noPmcOa}`);
  console.log(`\nTotal chunks by section:`);
  console.log(`  abstract: ${totalChunks.abstract}`);
  console.log(`  methods: ${totalChunks.methods}`);
  console.log(`  results: ${totalChunks.results}`);
  console.log(`  figures: ${totalChunks.figures}`);
  console.log(`\nFull-text papers: ${fullTextCount}`);
  console.log(`Abstract-only papers: ${abstractOnlyCount}`);
  console.log(`Output file size: ${fileSizeMB} MB`);
  console.log(`\nOutput: ${PAPERS_JSON}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
