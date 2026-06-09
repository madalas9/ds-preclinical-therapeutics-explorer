import type { StructuredHit, PaperHit } from "./retrieval";

export type AnswerFormat = "paragraph" | "paragraph_table" | "standard" | "report";
export type AnswerDepth = "brief" | "standard" | "detailed";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_MESSAGE_BASE = `You are a scientific research assistant for the Down Syndrome Preclinical Therapeutics Explorer, a curated database of 232 preclinical interventions across 38 compounds in 71 publications.

## Core Principles

1. **Respect the user's requested format EXACTLY**: If they ask for one paragraph, give exactly one paragraph. If they ask for a table, include a table.
2. **Completeness over exhaustiveness**: Finish answers cleanly rather than including everything.
3. **Never end mid-sentence, mid-citation, or mid-table**.

## Handling User Input
- Mentally correct obvious typos
- Never echo user typos
- Vague follow-ups refer to the prior topic

## Citation Rules
- If a database record has a DST ID, cite as: [DST16 · Costa 2008](DOI)
- If only a paper passage (no DST ID), cite as: [Costa 2008](DOI)
- NEVER write "DST??" or guess DST identifiers
- Every citation must come from retrieved evidence
- Keep citations compact and inline
- Never fabricate DOIs or data
- Use 'NT' for Not Tested, never 'NA'`;

const PARAGRAPH_INSTRUCTIONS = `

## CRITICAL: PARAGRAPH FORMAT

The user requested a paragraph answer. You MUST follow these rules exactly:

1. Write EXACTLY ONE PARAGRAPH — no exceptions
2. NO headings (no "## Direct Answer", no "## Bottom Line", no "**Direct Answer:**")
3. NO tables
4. NO bullet points
5. NO numbered lists
6. NO section labels
7. Use 2-5 citations max, inline
8. End with proper punctuation

IMPORTANT: Even if the question says "detailed," if it also asks for "one paragraph" or "one para," you MUST answer in ONE PARAGRAPH ONLY. "Detailed" means information-dense, NOT multi-section.

Deep Dive mode means better evidence selection and nuance, NOT a longer format. Still one paragraph.

Target visible output length:
- Brief paragraph: 80-130 words
- Standard paragraph: 120-180 words
- Detailed paragraph: 180-300 words

Write a flowing, information-dense paragraph. Do not create a mini-report. Do not use hidden reasoning or planning text. Produce only the final visible answer.`;

const PARAGRAPH_TABLE_INSTRUCTIONS = `

## FORMAT: PARAGRAPH + COMPACT TABLE

The user requested both a paragraph summary AND a table. Produce BOTH:

### Structure:
1. **One concise paragraph first** (150-250 words)
   - Synthesize the key comparison points
   - Include 2-4 inline citations
   - No heading above the paragraph

2. **Then one compact comparison table** (4-6 rows max)
   - Use synthesis rows, NOT one row per study
   - Compare key dimensions: mechanism, evidence strength, behavioral signal, timing, safety, overall profile
   - Keep cells brief (5-15 words each)
   - Cite in table cells where appropriate

### DO NOT:
- Create a full evidence report
- Use "Direct Answer", "Interpretation", "Limitations", "Bottom Line" section headings
- Make a giant source-by-source table
- Exceed 6 table rows

### Example table structure:
| Dimension | Treatment A | Treatment B | Interpretation |
|---|---|---|---|
| Mechanism | ... | ... | ... |
| Evidence profile | ... | ... | ... |
| Behavioral signal | ... | ... | ... |
| Safety caveats | ... | ... | ... |

Keep the answer complete but compact.`;

const STANDARD_INSTRUCTIONS = `

## Answer Style: STANDARD

Provide a focused, well-structured answer:

1. Start with a direct answer (2-3 sentences)
2. Include a brief table ONLY if explicitly requested
3. Add brief interpretation if useful
4. Mention key limitations in 1-2 sentences if relevant
5. Keep the total answer moderate in length
6. Use section headings sparingly`;

const REPORT_INSTRUCTIONS = `

## Answer Style: REPORT/TABLE

Provide comprehensive evidence synthesis:

### Structure:
1. **Direct Answer** (2-3 sentences with evidence strength)
2. **Evidence Table** (6-10 most relevant rows, never start a row you can't finish)
3. **Interpretation** (intervention-by-intervention analysis)
4. **Limitations** (species, sex, sample size, confounds)
5. **Bottom Line** (one concise paragraph)

### Table Guidelines:
- Max 6-10 rows, prioritize most relevant
- Group similar records when possible
- Summarize extras in prose
- Note "See sources panel for complete evidence set" if applicable

### Bounded Output:
- "As long as possible" or "maximum detail" means detailed but bounded, NOT unlimited
- Prioritize a complete answer over an exhaustive one
- Finish cleanly with Bottom Line`;

const DEPTH_BRIEF = `
Depth: BRIEF — Keep it short. Focus on the single most important finding. Minimal citations.`;

const DEPTH_DETAILED = `
Depth: DETAILED — Be information-dense. Include nuance, comparisons, and key caveats. But still respect the format constraint.`;

const CONTINUATION_INSTRUCTIONS = `

## CONTINUATION MODE

Continue a previous answer that was cut off:
1. Start exactly where the previous answer stopped
2. Complete any unfinished table row first
3. Finish remaining sections
4. Do NOT restart or repeat earlier content
5. Keep this continuation concise`;

function formatStructuredHit(hit: StructuredHit): string {
  const lines = [
    `**${hit.treatment_identifier} — ${hit.canonical_name}**`,
    `Model: ${hit.species} / ${hit.model_name} | Sex: ${hit.sex}`,
  ];

  if (hit.behavior_task && hit.behavior_task !== "NA" && hit.behavior_task !== "NT") {
    lines.push(`Behavior: ${hit.behavior_task} → ${hit.behavior_effect || "NT"}`);
  }
  if (hit.cellular_effect && hit.cellular_effect !== "NA" && hit.cellular_effect !== "NT") {
    lines.push(`Cellular: ${hit.cellular_effect}`);
  }
  if (hit.molecular_effect && hit.molecular_effect !== "NA" && hit.molecular_effect !== "NT") {
    lines.push(`Molecular: ${hit.molecular_effect}`);
  }

  lines.push(`Ref: ${hit.reference} | DOI: ${hit.doi}`);

  return lines.join("\n");
}

function formatPaperHit(hit: PaperHit): string {
  const excerpt =
    hit.abstract_excerpt.length > 300
      ? hit.abstract_excerpt.slice(0, 300) + "..."
      : hit.abstract_excerpt;

  return `**${hit.title}** (${hit.year})
DOI: ${hit.doi}
> ${excerpt}`;
}

function formatConversationHistory(messages: ConversationMessage[]): string {
  if (!messages || messages.length === 0) return "";

  const recent = messages.slice(-6);
  const formatted = recent.map((m) => {
    const role = m.role === "user" ? "User" : "Assistant";
    const content = m.content.length > 600 ? m.content.slice(0, 600) + "..." : m.content;
    return `**${role}:** ${content}`;
  });

  return `## Prior Conversation

${formatted.join("\n\n")}

---

`;
}

export function buildPrompt(opts: {
  question: string;
  structuredHits: StructuredHit[];
  paperHits: PaperHit[];
  deepDive: boolean;
  conversationHistory?: ConversationMessage[];
  maxOutputTokens?: number;
  isContinuation?: boolean;
  answerFormat?: AnswerFormat;
  answerDepth?: AnswerDepth;
}): {
  systemMessage: string;
  userMessage: string;
  estimatedTokens: number;
} {
  const {
    question,
    structuredHits,
    paperHits,
    deepDive,
    conversationHistory,
    maxOutputTokens = 1200,
    isContinuation = false,
    answerFormat = "standard",
    answerDepth = "standard",
  } = opts;

  // Build format instructions
  let formatInstructions: string;
  switch (answerFormat) {
    case "paragraph":
      formatInstructions = PARAGRAPH_INSTRUCTIONS;
      break;
    case "paragraph_table":
      formatInstructions = PARAGRAPH_TABLE_INSTRUCTIONS;
      break;
    case "report":
      formatInstructions = REPORT_INSTRUCTIONS;
      break;
    default:
      formatInstructions = STANDARD_INSTRUCTIONS;
  }

  // Build depth instructions
  let depthInstructions = "";
  if (answerDepth === "brief") {
    depthInstructions = DEPTH_BRIEF;
  } else if (answerDepth === "detailed") {
    depthInstructions = DEPTH_DETAILED;
  }

  let systemMsg = SYSTEM_MESSAGE_BASE + formatInstructions + depthInstructions;
  if (isContinuation) {
    systemMsg += CONTINUATION_INSTRUCTIONS;
  }

  const historySection =
    conversationHistory && conversationHistory.length > 0
      ? formatConversationHistory(conversationHistory)
      : "";

  const structuredSection =
    structuredHits.length > 0
      ? `### Database Records (${structuredHits.length} entries)\n\n${structuredHits.map(formatStructuredHit).join("\n\n---\n\n")}`
      : "### Database Records: None matched.";

  const paperSection =
    paperHits.length > 0
      ? `### Paper Passages (${paperHits.length} entries)\n\n${paperHits.map(formatPaperHit).join("\n\n---\n\n")}`
      : "### Paper Passages: None matched.";

  const modeNote = deepDive
    ? "(Deep Dive mode: more context available, but still respect format)"
    : "";

  let formatReminder = "";
  if (answerFormat === "paragraph") {
    formatReminder = "REMINDER: Write exactly ONE PARAGRAPH. No headings, no tables, no sections.";
  } else if (answerFormat === "paragraph_table") {
    formatReminder = "REMINDER: Write ONE paragraph followed by ONE compact comparison table (4-6 rows). No full report sections.";
  }

  const userMessage = `${historySection}## Question

${question}

${modeNote}

## Retrieved Evidence

${structuredSection}

${paperSection}

## Your Response

${isContinuation ? "Continue exactly where the previous answer stopped." : formatReminder}`;

  const estimatedTokens = Math.ceil(
    systemMsg.length / 4 + userMessage.length / 4 + maxOutputTokens
  );

  return {
    systemMessage: systemMsg,
    userMessage,
    estimatedTokens,
  };
}
