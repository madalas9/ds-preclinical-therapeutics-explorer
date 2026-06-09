const EUROPE_PMC_API = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

export async function doiToPmid(doi: string): Promise<string | null> {
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//i, "");
  const url = `${EUROPE_PMC_API}?query=DOI:${encodeURIComponent(cleanDoi)}&resulttype=core&format=json`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[doi-to-pmid] HTTP ${response.status} for DOI: ${cleanDoi}`);
        return null;
      }

      const data = await response.json();
      const results = data?.resultList?.result;

      if (!results || results.length === 0) {
        console.warn(`[doi-to-pmid] No PMID found for DOI: ${cleanDoi}`);
        return null;
      }

      const pmid = results[0]?.pmid;
      if (!pmid) {
        console.warn(`[doi-to-pmid] Result missing PMID for DOI: ${cleanDoi}`);
        return null;
      }

      return String(pmid);
    } catch (err) {
      if (attempt === 0) {
        console.warn(`[doi-to-pmid] Network error for DOI: ${cleanDoi}, retrying...`);
        continue;
      }
      console.warn(`[doi-to-pmid] Failed after retry for DOI: ${cleanDoi}`, err);
      return null;
    }
  }

  return null;
}
