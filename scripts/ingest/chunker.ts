interface ChunkOptions {
  targetTokens?: number;
  overlapTokens?: number;
}

export function chunkText(text: string, opts?: ChunkOptions): string[] {
  const targetTokens = opts?.targetTokens ?? 400;
  const overlapTokens = opts?.overlapTokens ?? 50;

  const targetChars = targetTokens * 4;
  const overlapChars = overlapTokens * 4;

  if (!text || text.trim().length === 0) {
    return [];
  }

  if (text.length <= targetChars) {
    return [text];
  }

  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/g).filter((s) => s.trim());

  if (sentences.length === 0) {
    return [text];
  }

  if (sentences.length === 1) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;
  let lastSentence: string | null = null;

  for (const sentence of sentences) {
    const sentenceLen = sentence.length;

    if (sentenceLen > targetChars) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
        currentChunk = [];
        currentLength = 0;
      }
      chunks.push(sentence);
      lastSentence = sentence;
      continue;
    }

    if (currentLength + sentenceLen > targetChars && currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));

      currentChunk = [];
      currentLength = 0;

      if (lastSentence && lastSentence.length <= overlapChars) {
        currentChunk.push(lastSentence);
        currentLength = lastSentence.length;
      }
    }

    currentChunk.push(sentence);
    currentLength += sentenceLen;
    lastSentence = sentence;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}
