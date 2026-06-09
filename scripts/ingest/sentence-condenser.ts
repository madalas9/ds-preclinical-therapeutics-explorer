const RESULTS_SIGNALS: RegExp[] = [
  /p\s*[=<>≤≥]\s*0\.\d/i,
  /p\s*[=<>]\s*[0-9]/i,
  /\d+(\.\d+)?\s*%/,
  /fold[\s-]?change/i,
  /\d+\s*±\s*\d/,
  /significantly?/i,
  /coefficient/i,
  /correlation/i,
  /confidence interval/i,
  /\bci\b/i,
  /odds ratio/i,
  /effect size/i,
  /cohen/i,
  /r\s*=\s*[-0-9.]+/i,
  /reduc\w+/i,
  /increas\w+/i,
  /impair\w+/i,
  /decreas\w+/i,
  /defici\w+/i,
  /elevat\w+/i,
  /comparedw?/i,
  /versus\b/i,
  /greater\b/i,
  /lower\b/i,
  /higher\b/i,
  /differ\w+/i,
  /rescue\w*/i,
  /restor\w+/i,
  /normal\w+/i,
  /wild.?type/i,
];

const METHODS_SIGNALS: RegExp[] = [
  /\bn\s*=\s*\d/i,
  /per group/i,
  /\d+\s*(male|female|mice|rats|animals|subjects|patients)/i,
  /sample size/i,
  /cohort/i,
  /ts65dn|ts1cje|ts2cje|dp\(16\)|dp1tyb|dp1yey|tcmac21|tg2576|tg\(dyrk1a\)/i,
  /wild.?type|wt\b/i,
  /genotyp\w+/i,
  /littermate/i,
  /\d+\s*(month|week|day)s?[\s-]old/i,
  /age\w*/i,
  /inject\w+/i,
  /treat\w+/i,
  /administ\w+/i,
  /sacrific\w+/i,
  /stereotax\w*/i,
  /anesthes\w+/i,
  /perfus\w+/i,
  /randomiz\w+/i,
  /blind\w+/i,
  /counterbal\w+/i,
  /anova\b/i,
  /t.?test\b/i,
  /mann.?whitney/i,
  /tukey/i,
  /bonferroni/i,
  /statistical\w*/i,
  /prism\b/i,
  /spss\b/i,
];

interface ScoredSentence {
  text: string;
  index: number;
  score: number;
}

function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+(?=[A-Z])/g, "$1\n")
    .replace(/(\d+\.\d+\s+[A-Z][A-Z])/g, "\n$1")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
}

function scoreSentence(
  sentence: string,
  signals: RegExp[]
): number {
  let score = 0;

  for (const pattern of signals) {
    if (pattern.test(sentence)) {
      score += 1;
    }
  }

  if (/\d/.test(sentence)) {
    score += 0.5;
  }

  if (sentence.length > 60) {
    score += 0.3;
  }

  return score;
}

export function condenseSection(
  text: string,
  maxChars: number,
  sectionType: "methods" | "results" | "figures"
): string {
  if (!text || text.length <= maxChars) {
    return text || "";
  }

  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return text.slice(0, maxChars);
  }

  const signals = sectionType === "methods" ? METHODS_SIGNALS : RESULTS_SIGNALS;

  const scored: ScoredSentence[] = sentences.map((s, i) => ({
    text: s,
    index: i,
    score: scoreSentence(s, signals),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  const budget = Math.floor(maxChars * 0.95);
  const selected: ScoredSentence[] = [];
  let currentLength = 0;

  for (const sentence of scored) {
    const addLength = sentence.text.length + (selected.length > 0 ? 1 : 0);
    if (currentLength + addLength <= budget) {
      selected.push(sentence);
      currentLength += addLength;
    }
  }

  selected.sort((a, b) => a.index - b.index);

  return selected.map((s) => s.text).join(" ");
}
