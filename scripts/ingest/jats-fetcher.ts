const EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

export async function fetchJatsXml(pmcid: string): Promise<string | null> {
  const apiKey = process.env.NCBI_API_KEY;

  const params = new URLSearchParams({
    db: "pmc",
    id: pmcid,
    retmode: "xml",
  });
  if (apiKey) params.set("api_key", apiKey);

  const url = `${EFETCH_URL}?${params.toString()}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[jats-fetcher] HTTP ${response.status} for PMCID: ${pmcid}`);
        return null;
      }

      const xml = await response.text();

      if (xml.length < 500) {
        return null;
      }

      return xml;
    } catch (err) {
      if (attempt === 0) {
        console.warn(`[jats-fetcher] Network error for PMCID: ${pmcid}, retrying...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      console.warn(`[jats-fetcher] Failed after retry for PMCID: ${pmcid}`, err);
      return null;
    }
  }

  return null;
}
