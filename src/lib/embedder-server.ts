// Dual-strategy embedder:
// - Local development: Xenova/transformers (fast, offline)
// - Vercel production: HuggingFace Inference API (same model, HTTP)

const USE_HF_API =
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

// ============================================================
// HuggingFace Inference API implementation
// ============================================================

const HF_ENDPOINT =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

async function embedViaHuggingFace(text: string): Promise<number[]> {
  const hfToken = process.env.HF_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (hfToken) {
    headers["Authorization"] = `Bearer ${hfToken}`;
  }

  console.log("[embedder-server] calling HuggingFace API, hasToken:", !!hfToken);

  async function fetchEmbedding(): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      return await fetch(HF_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      // Retry once on DNS/network errors
      const errAny = err as { cause?: { code?: string }; message?: string };
      if (
        errAny?.cause?.code === "ENOTFOUND" ||
        errAny?.cause?.code === "ECONNRESET" ||
        errAny?.message?.includes("fetch failed")
      ) {
        console.log("[embedder-server] DNS/network error, retrying in 2s...");
        await new Promise((r) => setTimeout(r, 2000));
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), 20000);
        try {
          return await fetch(HF_ENDPOINT, {
            method: "POST",
            headers,
            body: JSON.stringify({
              inputs: text,
              options: { wait_for_model: true },
            }),
            signal: retryController.signal,
          });
        } finally {
          clearTimeout(retryTimeout);
        }
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  let response = await fetchEmbedding();

  // Handle cold start (503 with model loading message)
  if (response.status === 503) {
    const body = await response.json().catch(() => ({})) as { error?: string; estimated_time?: number };
    if (body.error && body.error.toLowerCase().includes("loading")) {
      const waitSecs = Math.min(body.estimated_time || 20, 35);
      console.log(`[embedder-server] HF model loading, waiting ${waitSecs}s...`);
      await new Promise((r) => setTimeout(r, waitSecs * 1000));
      response = await fetchEmbedding();
    }
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`HuggingFace API error ${response.status}: ${errText}`);
  }

  const result = await response.json();

  // API returns nested array for batch, flat array for single input
  const embedding: number[] = Array.isArray(result[0])
    ? (result[0] as number[])
    : (result as number[]);

  if (embedding.length !== 384) {
    throw new Error(`Expected 384-dim embedding, got ${embedding.length}`);
  }

  console.log("[embedder-server] HF embedding OK, dims:", embedding.length);
  return embedding;
}

// ============================================================
// Local Xenova implementation
// ============================================================

import type { FeatureExtractionPipeline } from "@xenova/transformers";

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    // Dynamic import to avoid loading native binaries on Vercel
    const { pipeline } = await import("@xenova/transformers");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      quantized: true,
    });
  }
  return extractor;
}

async function embedViaXenova(text: string): Promise<number[]> {
  const ext = await getExtractor();
  const output = await ext(text, { pooling: "mean", normalize: true });
  const data = output.data as Float32Array;
  return Array.from(data);
}

// ============================================================
// Public API
// ============================================================

export async function embedQuery(text: string): Promise<number[]> {
  if (USE_HF_API) {
    console.log("[embedder-server] using HuggingFace API for query embedding");
    return embedViaHuggingFace(text);
  } else {
    console.log("[embedder-server] using local Xenova for query embedding");
    return embedViaXenova(text);
  }
}
