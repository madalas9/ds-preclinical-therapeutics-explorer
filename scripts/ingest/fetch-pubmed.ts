import { XMLParser } from "fast-xml-parser";

export interface PubMedRecord {
  pmid: string;
  title: string;
  authors: string;
  year: string;
  journal: string;
  abstract: string;
  mesh: string[];
  keywords: string[];
  publication_types: string[];
}

const EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
});

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node && typeof node === "object" && "#text" in node) {
    return String((node as { "#text": unknown })["#text"]);
  }
  return "";
}

function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export async function fetchPubMed(pmid: string): Promise<PubMedRecord | null> {
  const apiKey = process.env.NCBI_API_KEY;
  const email = process.env.NCBI_EMAIL;

  const params = new URLSearchParams({
    db: "pubmed",
    id: pmid,
    rettype: "xml",
  });
  if (apiKey) params.set("api_key", apiKey);
  if (email) params.set("email", email);

  const url = `${EFETCH_URL}?${params.toString()}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.status === 429) {
        console.warn(`[fetch-pubmed] Rate limited for PMID: ${pmid}, waiting 30s...`);
        await new Promise((r) => setTimeout(r, 30000));
        continue;
      }

      if (!response.ok) {
        console.warn(`[fetch-pubmed] HTTP ${response.status} for PMID: ${pmid}`);
        return null;
      }

      const xml = await response.text();
      const parsed = parser.parse(xml);

      const article = parsed?.PubmedArticleSet?.PubmedArticle?.MedlineCitation?.Article;
      if (!article) {
        console.warn(`[fetch-pubmed] No article data for PMID: ${pmid}`);
        return null;
      }

      const title = extractText(article.ArticleTitle) || "(no title)";

      const authorList = toArray(article.AuthorList?.Author);
      const authors = authorList
        .map((a: { LastName?: string; Initials?: string }) => {
          const last = a.LastName || "";
          const initials = a.Initials || "";
          return `${last} ${initials}`.trim();
        })
        .filter(Boolean)
        .join(", ");

      let year = "";
      const pubDate = article.Journal?.JournalIssue?.PubDate;
      if (pubDate?.Year) {
        year = String(pubDate.Year);
      } else if (pubDate?.MedlineDate) {
        const match = String(pubDate.MedlineDate).match(/(19|20)\d{2}/);
        if (match) year = match[0];
      }

      const journal = extractText(article.Journal?.Title) || "";

      const abstractTexts = toArray(article.Abstract?.AbstractText);
      const abstract = abstractTexts
        .map((node) => {
          if (typeof node === "string") return node;
          if (typeof node === "object" && node !== null) {
            const obj = node as { "@_Label"?: string; "#text"?: unknown };
            const label = obj["@_Label"];
            const text = extractText(obj);
            return label ? `${label}: ${text}` : text;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n\n");

      const medlineCitation = parsed?.PubmedArticleSet?.PubmedArticle?.MedlineCitation;
      const meshHeadings = toArray(medlineCitation?.MeshHeadingList?.MeshHeading);
      const mesh = meshHeadings
        .map((h: { DescriptorName?: unknown }) => extractText(h.DescriptorName))
        .filter(Boolean);

      const keywordList = toArray(medlineCitation?.KeywordList?.Keyword);
      const keywords = keywordList.map((k) => extractText(k)).filter(Boolean);

      const pubTypes = toArray(article.PublicationTypeList?.PublicationType);
      const publication_types = pubTypes.map((p) => extractText(p)).filter(Boolean);

      return {
        pmid,
        title,
        authors,
        year,
        journal,
        abstract,
        mesh,
        keywords,
        publication_types,
      };
    } catch (err) {
      if (attempt === 0) {
        console.warn(`[fetch-pubmed] Network error for PMID: ${pmid}, retrying...`);
        continue;
      }
      console.warn(`[fetch-pubmed] Failed after retry for PMID: ${pmid}`, err);
      return null;
    }
  }

  return null;
}
