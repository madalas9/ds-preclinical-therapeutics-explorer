const IDCONV_API = "https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/";
const BATCH_SIZE = 200;

export async function pmidsToPmcidsBatch(
  pmids: string[]
): Promise<Map<string, string>> {
  const apiKey = process.env.NCBI_API_KEY;
  const result = new Map<string, string>();

  const batches: string[][] = [];
  for (let i = 0; i < pmids.length; i += BATCH_SIZE) {
    batches.push(pmids.slice(i, i + BATCH_SIZE));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const idsParam = batch.join(",");

    const params = new URLSearchParams({
      ids: idsParam,
      format: "json",
      tool: "ds-therapeutics-explorer",
    });
    if (apiKey) params.set("api_key", apiKey);

    const url = `${IDCONV_API}?${params.toString()}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`[pmid-to-pmcid] HTTP ${response.status} for batch ${batchIdx + 1}`);
          break;
        }

        const data = await response.json();
        const records = data?.records || [];

        for (const rec of records) {
          if (rec.pmid && rec.pmcid && !rec.errmsg) {
            const pmcid = String(rec.pmcid).replace(/^PMC/i, "");
            result.set(String(rec.pmid), pmcid);
          }
        }

        break;
      } catch (err) {
        if (attempt === 0) {
          console.warn(`[pmid-to-pmcid] Network error on batch ${batchIdx + 1}, retrying...`);
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        console.warn(`[pmid-to-pmcid] Failed after retry for batch ${batchIdx + 1}`, err);
      }
    }

    if (batchIdx < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 105));
    }
  }

  return result;
}
