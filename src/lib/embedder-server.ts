// Dual-strategy embedder:
// - Local development: Xenova/transformers (fast, offline)
// - Vercel production: HuggingFace Inference API (same model, HTTP)

const USE_HF_API =
  process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

// ============================================================
// HuggingFace Inference API implementation
// ============================================================

async function embedViaHuggingFace(text: string): Promise<number[]> {
  const hfToken = process.env.HF_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (hfToken) {
    headers["Authorization"] = `Bearer ${hfToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HuggingFace API error ${response.status}: ${errBody}`);
    }

    const result = await response.json();

    // API returns nested array for batch, flat array for single input
    // Handle both cases
    const embedding: number[] = Array.isArray(result[0])
      ? (result[0] as number[])
      : (result as number[]);

    if (embedding.length !== 384) {
      throw new Error(`Expected 384-dim embedding, got ${embedding.length}`);
    }

    return embedding;
  } finally {
    clearTimeout(timeout);
  }
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
