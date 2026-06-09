const S2_API = "https://api.semanticscholar.org/graph/v1/paper";

export async function fetchTLDR(doi: string): Promise<string | null> {
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//i, "");
  const url = `${S2_API}/DOI:${encodeURIComponent(cleanDoi)}?fields=tldr`;

  const email = process.env.NCBI_EMAIL || "ds-therapeutics@udayton.edu";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": `DS-Therapeutics-Explorer/1.0 (${email})`,
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.tldr?.text ?? null;
  } catch {
    return null;
  }
}
