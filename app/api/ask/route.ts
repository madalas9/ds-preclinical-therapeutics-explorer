export const runtime = "nodejs";
export const maxDuration = 120;

import { streamText } from "ai";
import { z } from "zod";
import { getFlyerProvider } from "@/src/lib/flyer-provider";
import { retrieve } from "@/src/lib/retrieval";
import { buildPrompt, type AnswerFormat, type AnswerDepth } from "@/src/lib/prompt-builder";
import { acquire, recordActualUsage } from "@/src/lib/throttle";

const VALID_MODELS = ["gpt-5.4", "gpt-5.5"] as const;

// Log environment on module load (once per cold start)
console.log("[/api/ask] env check:", {
  hasFlyerKey: !!process.env.FLYER_API_KEY,
  hasFlyerUrl: !!process.env.FLYER_BASE_URL,
  isVercel: process.env.VERCEL === "1",
  hasHfToken: !!process.env.HF_TOKEN,
  nodeEnv: process.env.NODE_ENV,
});

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(10000),
});

const RequestSchema = z.object({
  question: z.string().min(1).max(1000),
  model: z.enum(VALID_MODELS),
  deepDive: z.boolean(),
  messages: z.array(MessageSchema).max(12).optional(),
  isContinuation: z.boolean().optional(),
});

function detectAnswerFormat(question: string): AnswerFormat {
  const q = question.toLowerCase();

  // Paragraph patterns
  const paragraphPatterns = [
    /one\s+(short\s+)?para(graph)?\b/i,
    /\bone\s+para(graph)?\b/i,
    /\bin\s+one\s+para(graph)?\b/i,
    /\bsingle\s+para(graph)?\b/i,
    /\b1\s+para(graph)?\b/i,
    /\bdetailed\s+para(graph)?\b/i,
    /\bshort\s+para(graph)?\b/i,
    /\bin\s+[123]\s+sentences?\b/i,
    /\bone\s+sentence\b/i,
    /\btwo\s+sentences?\b/i,
    /\bthree\s+sentences?\b/i,
  ];

  // Table patterns
  const tablePatterns = [
    /\btabulate\b/i,
    /\btable\b/i,
    /\bcompare\s+in\s+table\b/i,
    /\btabulated\b/i,
  ];

  const hasParagraphIntent = paragraphPatterns.some((p) => p.test(q));
  const hasTableIntent = tablePatterns.some((p) => p.test(q));

  // Hybrid: both paragraph and table requested
  if (hasParagraphIntent && hasTableIntent) {
    return "paragraph_table";
  }

  if (hasParagraphIntent) {
    return "paragraph";
  }

  // Full report patterns (table without paragraph, or explicit report keywords)
  const reportPatterns = [
    /\bevidence\s+table\b/i,
    /\bfull\s+comparison\b/i,
    /\bcomprehensive\s+analysis\b/i,
    /\bfull\s+evidence\s+synthesis\b/i,
    /\bfull\s+report\b/i,
  ];

  if (hasTableIntent || reportPatterns.some((p) => p.test(q))) {
    return "report";
  }

  return "standard";
}

function detectAnswerDepth(question: string): AnswerDepth {
  const q = question.toLowerCase();

  // Brief patterns
  const briefPatterns = [
    /\bbrief\b/i,
    /\bbriefly\b/i,
    /\bshort\b/i,
    /\bquick\b/i,
    /\bconcise\b/i,
    /\btl;?dr\b/i,
    /\bsummarize\b/i,
    /\bhigh\s+level\b/i,
    /\bshort\s+answer\b/i,
  ];

  // Detailed patterns
  const detailedPatterns = [
    /\bdetailed\b/i,
    /\bdetail\b/i,
    /\bdescriptive\b/i,
    /\bin\s+depth\b/i,
    /\bexpand\b/i,
    /\bcontrast\b/i,
    /\bcomprehensive\b/i,
    /\blong\b/i,
    /\bas\s+long\s+as\s+possible\b/i,
    /\bmaximum\s+detail\b/i,
  ];

  // Check for brief first
  if (briefPatterns.some((p) => p.test(q))) {
    return "brief";
  }

  if (detailedPatterns.some((p) => p.test(q))) {
    return "detailed";
  }

  return "standard";
}

function calculateMaxTokens(
  format: AnswerFormat,
  _depth: AnswerDepth,
  _deepDive: boolean,
  isContinuation: boolean,
  _model: string
): number {
  // Aligned with PI's approach: use generous completion budget, control format via prompt
  // Deep Dive controls retrieval context, not output budget

  if (isContinuation) {
    return 3000;
  }

  switch (format) {
    case "paragraph":
      return 3000;
    case "paragraph_table":
      return 4000;
    case "report":
      return 6000;
    case "standard":
    default:
      return 4000;
  }
}

function isVagueFollowUp(question: string): boolean {
  const q = question.toLowerCase().trim();
  const vaguePatterns = [
    /^(give|provide|show|add)\s+(me\s+)?(a\s+)?(more\s+)?detail/i,
    /^(more\s+)?detail/i,
    /^tabulate/i,
    /^(cite|add\s+citation|more\s+citation)/i,
    /^compare\s+(that|those|them|it|these)/i,
    /^explain\s+(that|those|them|it|the|this|more|further)/i,
    /^what\s+about/i,
    /^(and|also)\s+(what|how|why)/i,
    /^more\s+(on|about|detail|info)/i,
    /^expand/i,
    /^elaborate/i,
    /^clarify/i,
    /your\s+(response|answer|reply)/i,
    /the\s+(first|second|third|last)\s+(one|point|item)/i,
    /^can\s+you\s+(explain|detail|expand|elaborate)/i,
    /^continue/i,
    /^now\s+summarize/i,
    /same\s+question/i,
    /previously\s+asked/i,
    /previous\s+question/i,
    /same\s+comparison/i,
    /expand\s+and\s+contrast/i,
    /as\s+long\s+as\s+possible/i,
  ];
  return vaguePatterns.some((p) => p.test(q));
}

function buildRetrievalQuery(
  question: string,
  messages?: Array<{ role: string; content: string }>
): string {
  if (!messages || messages.length === 0) {
    return question;
  }

  if (!isVagueFollowUp(question)) {
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    if (lastUserMsg) {
      return `${lastUserMsg.content} ${question}`.slice(0, 2000);
    }
    return question;
  }

  const recentUserQuestions: string[] = [];
  const recentAssistantSnippets: string[] = [];

  const lastFewMessages = messages.slice(-8);
  for (const msg of lastFewMessages) {
    if (msg.role === "user" && msg.content.length > 5) {
      recentUserQuestions.push(msg.content);
    } else if (msg.role === "assistant" && msg.content.length > 50) {
      const snippet = msg.content.slice(0, 400);
      recentAssistantSnippets.push(snippet);
    }
  }

  const contextParts = [
    ...recentUserQuestions.slice(-2),
    ...recentAssistantSnippets.slice(-1),
    question,
  ];

  return contextParts.join(" ").slice(0, 2000);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid request",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { question, model, deepDive, messages, isContinuation } = parsed.data;

    const answerFormat = detectAnswerFormat(question);
    const answerDepth = detectAnswerDepth(question);
    const retrievalQuery = buildRetrievalQuery(question, messages);

    // Retrieval limits based on format
    let limits: { maxStructuredHits: number; maxPaperHits: number };
    if (answerFormat === "paragraph") {
      limits = deepDive
        ? { maxStructuredHits: 8, maxPaperHits: 6 }
        : { maxStructuredHits: 6, maxPaperHits: 4 };
    } else if (answerFormat === "paragraph_table") {
      limits = deepDive
        ? { maxStructuredHits: 10, maxPaperHits: 6 }
        : { maxStructuredHits: 8, maxPaperHits: 5 };
    } else if (answerFormat === "report") {
      limits = deepDive
        ? { maxStructuredHits: 18, maxPaperHits: 10 }
        : { maxStructuredHits: 12, maxPaperHits: 8 };
    } else {
      limits = deepDive
        ? { maxStructuredHits: 12, maxPaperHits: 8 }
        : { maxStructuredHits: 8, maxPaperHits: 5 };
    }

    const { structuredHits, paperHits } = await retrieve(retrievalQuery, limits);

    if (structuredHits.length === 0 && paperHits.length === 0) {
      return Response.json(
        {
          message:
            "No matching evidence found in the database. Try rephrasing your question or using different keywords related to Down syndrome preclinical interventions.",
          structuredHits: [],
          paperHits: [],
        },
        { status: 200 }
      );
    }

    const maxTokens = calculateMaxTokens(answerFormat, answerDepth, deepDive, isContinuation || false, model);

    const { systemMessage, userMessage, estimatedTokens } = buildPrompt({
      question,
      structuredHits,
      paperHits,
      deepDive,
      conversationHistory: messages,
      maxOutputTokens: maxTokens,
      isContinuation: isContinuation || false,
      answerFormat,
      answerDepth,
    });

    await acquire(estimatedTokens);

    const provider = getFlyerProvider();

    const sourceHeaders = {
      "X-Sources-Structured": JSON.stringify(
        structuredHits.map((h) => ({
          id: h.treatment_identifier,
          name: h.canonical_name,
          doi: h.doi,
        }))
      ),
      "X-Sources-Paper": JSON.stringify(
        paperHits.map((h) => ({
          title: h.title,
          year: h.year,
          doi: h.doi,
        }))
      ),
      "X-Max-Tokens": String(maxTokens),
      "X-Answer-Format": answerFormat,
      "X-Answer-Depth": answerDepth,
    };

    console.log("[/api/ask]", model, answerFormat, answerDepth, deepDive ? "deep" : "std", maxTokens);

    // Use streamText for all models (GPT-5.4 and GPT-5.5)
    const result = streamText({
      model: provider.chat(model),
      system: systemMessage,
      prompt: userMessage,
      maxOutputTokens: maxTokens,
      onFinish: ({ usage, finishReason, text }) => {
        console.log("[/api/ask] stream finished:", {
          model: model,
          finishReason: finishReason,
          textLength: text?.length ?? 0,
          tokens: usage?.totalTokens,
        });
        recordActualUsage(usage?.totalTokens ?? estimatedTokens, estimatedTokens);
      },
    });

    return result.toTextStreamResponse({
      headers: {
        ...sourceHeaders,
        "X-Stream-Mode": "stream",
      },
    });
  } catch (error) {
    console.error("[/api/ask] Error:", error);
    return Response.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
