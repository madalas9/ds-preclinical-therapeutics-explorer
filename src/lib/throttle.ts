const CAPACITY = 10000;
const REFILL_RATE = CAPACITY / 60; // tokens per second

interface BucketState {
  tokens: number;
  lastRefill: number;
}

const bucket: BucketState = {
  tokens: CAPACITY,
  lastRefill: Date.now(),
};

function refillBucket(): void {
  const now = Date.now();
  const elapsedSeconds = (now - bucket.lastRefill) / 1000;
  const refillAmount = elapsedSeconds * REFILL_RATE;
  bucket.tokens = Math.min(CAPACITY, bucket.tokens + refillAmount);
  bucket.lastRefill = now;
}

export async function acquire(estimatedTokens: number): Promise<void> {
  refillBucket();

  if (bucket.tokens >= estimatedTokens) {
    bucket.tokens -= estimatedTokens;
    return;
  }

  const deficit = estimatedTokens - bucket.tokens;
  const waitSeconds = deficit / REFILL_RATE;
  const waitMs = Math.ceil(waitSeconds * 1000);

  await new Promise((resolve) => setTimeout(resolve, waitMs));

  refillBucket();
  bucket.tokens -= estimatedTokens;
}

export function recordActualUsage(
  actualTokens: number,
  estimatedTokens: number
): void {
  const diff = actualTokens - estimatedTokens;
  if (diff > 0) {
    bucket.tokens -= diff;
  } else if (diff < 0) {
    bucket.tokens = Math.min(CAPACITY, bucket.tokens - diff);
  }
}

export function getBucketStatus(): { available: number; capacity: number } {
  refillBucket();
  return {
    available: Math.floor(bucket.tokens),
    capacity: CAPACITY,
  };
}
