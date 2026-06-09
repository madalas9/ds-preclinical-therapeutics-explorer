import { config } from "dotenv";
config({ path: ".env.local" });
import * as fs from "fs";
import * as path from "path";
import pLimit from "p-limit";
import { doiToPmid } from "./ingest/doi-to-pmid";
import { fetchPubMed, type PubMedRecord } from "./ingest/fetch-pubmed";
import { fetchTLDR } from "./ingest/fetch-semantic-scholar";
import { chunkText } from "./ingest/chunker";
import { embed } from "./ingest/embedder";

interface PaperChunk {
  section: "abstract";
  text: string;
  embedding: number[];
}

interface PaperEntry {
  doi: string;
  pmid: string;
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
const INTERVENTIONS_JSON = path.join(DATA_DIR, "interventions.cleaned.json");

function sanitizeDoi(doi: string): string {
  return doi.replace(/\//g, "__");
}

function loadExistingPapers(): PapersDB {
  if (fs.existsSync(PAPERS_JSON)) {
    const content = fs.readFileSync(PAPERS_JSON, "utf-8");
    return JSON.parse(content) as PapersDB;
  }
  return {};
}

function extractUniqueDois(): string[] {
  const content = fs.readFileSync(INTERVENTIONS_JSON, "utf-8");
  const data = JSON.parse(content) as Array<{ reference_with_link_to_publication?: string }>;

  const dois = new Set<string>();
  for (const row of data) {
    const ref = row.reference_with_link_to_publication;
    if (!ref || ref === "NA" || ref.trim() === "") continue;

    const doi = ref.replace(/^https?:\/\/doi\.org\//i, "").trim();
    if (doi) dois.add(doi);
  }

  return Array.from(dois).sort();
}

function savePaperCache(doi: string, entry: PaperEntry): void {
  const filename = `${sanitizeDoi(doi)}.json`;
  const filepath = path.join(CACHE_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(entry, null, 2));
}

function savePapersJson(papers: PapersDB): void {
  const sorted = Object.keys(papers)
    .sort()
    .reduce((acc, key) => {
      acc[key] = papers[key];
      return acc;
    }, {} as PapersDB);

  fs.writeFileSync(PAPERS_JSON, JSON.stringify(sorted, null, 2));
}

function createSparseEntry(doi: string, reason: string): PaperEntry {
  console.warn(`  ⚠ ${reason}`);
  return {
    doi,
    pmid: "",
    title: `(${reason})`,
    authors: "",
    year: "",
    journal: "",
    abstract: "",
    tldr: null,
    mesh: [],
    keywords: [],
    publication_types: [],
    has_full_text: false,
    chunks: [],
  };
}

async function processDoi(doi: string): Promise<PaperEntry> {
  const pmid = await doiToPmid(doi);
  if (!pmid) {
    return createSparseEntry(doi, "could not resolve to PMID");
  }

  const pubmed = await fetchPubMed(pmid);
  if (!pubmed) {
    return createSparseEntry(doi, `could not fetch PubMed data for PMID ${pmid}`);
  }

  const tldr = await fetchTLDR(doi);

  const fullText = [tldr, pubmed.abstract].filter(Boolean).join("\n\n");
  const textChunks = chunkText(fullText);

  const chunks: PaperChunk[] = [];
  for (const text of textChunks) {
    const embedding = await embed(text);
    chunks.push({
      section: "abstract",
      text,
      embedding,
    });
  }

  return {
    doi,
    pmid: pubmed.pmid,
    title: pubmed.title,
    authors: pubmed.authors,
    year: pubmed.year,
    journal: pubmed.journal,
    abstract: pubmed.abstract,
    tldr,
    mesh: pubmed.mesh,
    keywords: pubmed.keywords,
    publication_types: pubmed.publication_types,
    has_full_text: false,
    chunks,
  };
}

async function main() {
  if (!process.env.NCBI_API_KEY || process.env.NCBI_API_KEY === "placeholder_for_now") {
    console.error("ERROR: NCBI_API_KEY is not set or still has placeholder value.");
    console.error("Please edit .env.local with your real NCBI API key.");
    console.error("Get one free at: https://www.ncbi.nlm.nih.gov/account/settings/");
    process.exit(1);
  }

  if (!process.env.NCBI_EMAIL || process.env.NCBI_EMAIL === "placeholder@udayton.edu") {
    console.error("ERROR: NCBI_EMAIL is not set or still has placeholder value.");
    console.error("Please edit .env.local with your real email address.");
    process.exit(1);
  }

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  console.log("Loading embedding model...");
  await embed("warmup text for model initialization");
  console.log("Embedding model ready.\n");

  const existingPapers = loadExistingPapers();
  const allDois = extractUniqueDois();
  const newDois = allDois.filter((doi) => !existingPapers[doi]);

  console.log(`Total DOIs in interventions.cleaned.json: ${allDois.length}`);
  console.log(`DOIs already cached: ${allDois.length - newDois.length}`);
  console.log(`DOIs to process: ${newDois.length}\n`);

  if (newDois.length === 0) {
    console.log("Nothing to do — all DOIs already processed.");
    return;
  }

  const limit = pLimit(5);
  let processed = 0;
  let failed = 0;

  const papers = { ...existingPapers };

  const tasks = newDois.map((doi) =>
    limit(async () => {
      processed++;
      const prefix = `[${processed}/${newDois.length}]`;

      try {
        console.log(`${prefix} ${doi}`);
        const entry = await processDoi(doi);
        papers[doi] = entry;
        savePaperCache(doi, entry);

        if (entry.chunks.length === 0) {
          failed++;
          console.log(`${prefix} ${doi} → ✗ (sparse entry)`);
        } else {
          console.log(`${prefix} ${doi} → ✓ (${entry.chunks.length} chunks)`);
        }
      } catch (err) {
        failed++;
        console.error(`${prefix} ${doi} → ✗ ERROR:`, err);
        papers[doi] = createSparseEntry(doi, "unexpected error during processing");
        savePaperCache(doi, papers[doi]);
      }
    })
  );

  await Promise.all(tasks);

  savePapersJson(papers);

  const totalChunks = Object.values(papers).reduce((sum, p) => sum + p.chunks.length, 0);
  const fileSize = fs.statSync(PAPERS_JSON).size;
  const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

  console.log("\n=== SUMMARY ===");
  console.log(`Total DOIs in interventions.cleaned.json: ${allDois.length}`);
  console.log(`DOIs already cached: ${allDois.length - newDois.length}`);
  console.log(`DOIs newly fetched: ${newDois.length}`);
  console.log(`DOIs failed (sparse entries): ${failed}`);
  console.log(`Total embedded chunks across corpus: ${totalChunks}`);
  console.log(`Output file size: ${fileSizeMB} MB`);
  console.log(`\nOutput: ${PAPERS_JSON}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
