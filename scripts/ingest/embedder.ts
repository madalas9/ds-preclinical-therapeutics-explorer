// === GPU UPGRADE PATH ===
// Currently CPU-only (sufficient for ~70 papers, abstract-only).
// For future full-text ingest (200+ papers, methods + results):
//   1. npm install onnxruntime-node-gpu
//   2. Set env: ORT_PROVIDERS="CUDAExecutionProvider,CPUExecutionProvider"
//   3. Pipeline below picks up GPU automatically
//   4. Verify: console.log(require('onnxruntime-node').env.getAvailableProviders())
// Expected speedup: 4-10x on embedding generation.

import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      quantized: true,
    });
  }
  return extractor;
}

export async function embed(text: string): Promise<number[]> {
  const ext = await getExtractor();
  const output = await ext(text, { pooling: "mean", normalize: true });
  const data = output.data as Float32Array;
  return Array.from(data);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embed(text));
  }
  return results;
}
