"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble, type ChatMessage } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ModelSelector, type ModelId } from "./model-selector";
import { DeepDiveToggle } from "./deep-dive-toggle";
import { SuggestedPrompts } from "./suggested-prompts";
import type { StructuredSource, PaperSource } from "./sources-panel";

type AnswerFormat = "paragraph" | "paragraph_table" | "standard" | "report";

let messageIdCounter = 0;
function generateId(): string {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}-${Date.now()}`;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

function detectIncompleteAnswer(
  content: string,
  deepDive: boolean,
  answerFormat: AnswerFormat
): boolean {
  if (!content || content.length < 80) return false;

  const trimmed = content.trim();

  // Paragraph and paragraph_table formats: minimal incomplete detection
  if (answerFormat === "paragraph" || answerFormat === "paragraph_table") {
    // Only flag obvious truncation
    if (/\[DST\d+\s*$/.test(trimmed) || /\[DST\d+\s*·\s*\w*$/.test(trimmed)) {
      return true;
    }
    // Ends mid-word (no space before end, no punctuation)
    if (!/[.!?)\]"|\s]$/.test(trimmed) && trimmed.length > 50) {
      const lastWord = trimmed.split(/\s+/).pop() || "";
      if (lastWord.length > 0 && !/[.!?)\]"|]$/.test(lastWord)) {
        return true;
      }
    }
    // Incomplete year
    if (/\b20[0-2]$/.test(trimmed) || /\b19\d{1,2}$/.test(trimmed)) {
      return true;
    }
    // For paragraph_table: check for mid-table row truncation
    if (answerFormat === "paragraph_table") {
      const lastLine = trimmed.split("\n").pop() || "";
      if (lastLine.includes("|") && !lastLine.endsWith("|")) {
        const pipeCount = (lastLine.match(/\|/g) || []).length;
        if (pipeCount >= 1 && pipeCount < 4) {
          return true;
        }
      }
    }
    return false;
  }

  // Standard/report checks
  if (!/[.!?)\]"]$/.test(trimmed)) {
    if (!/\|$/.test(trimmed) && trimmed.length > 200) {
      return true;
    }
  }

  if (/\|\s*$/.test(trimmed) || /\|\s*[^|]*$/.test(trimmed.split("\n").pop() || "")) {
    const lastLine = trimmed.split("\n").pop() || "";
    if (lastLine.includes("|") && !lastLine.endsWith("|")) {
      const pipeCount = (lastLine.match(/\|/g) || []).length;
      if (pipeCount >= 1 && pipeCount < 5) {
        return true;
      }
    }
  }

  if (/\b20[0-2]\d?$/.test(trimmed) || /\b19\d{1,2}$/.test(trimmed)) {
    return true;
  }

  if (/\[DST\d+\s*$/.test(trimmed) || /\[DST\d+\s*·\s*\w*$/.test(trimmed)) {
    return true;
  }

  // Only check for Bottom Line in report format + deepDive mode
  if (answerFormat === "report" && deepDive) {
    const lowerContent = content.toLowerCase();
    const hasBottomLine =
      lowerContent.includes("bottom line") ||
      lowerContent.includes("in summary") ||
      lowerContent.includes("in conclusion") ||
      lowerContent.includes("overall,") ||
      lowerContent.includes("taken together");

    if (!hasBottomLine && content.length > 800) {
      const hasTable = content.includes("|");
      const hasInterpretation =
        lowerContent.includes("interpretation") || lowerContent.includes("these findings");
      if (hasTable && hasInterpretation) {
        return true;
      }
    }
  }

  return false;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelId>("gpt-5.4");
  const [deepDive, setDeepDive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (!userScrolledRef.current && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleScroll() {
      const el = containerRef.current;
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      userScrolledRef.current = !isAtBottom;
    }

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  function buildConversationHistory(): ConversationMessage[] {
    const history: ConversationMessage[] = [];
    const recentMessages = messages.slice(-10);

    for (const msg of recentMessages) {
      if (msg.content && msg.content.length > 0 && !msg.isStreaming && !msg.isError) {
        history.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return history;
  }

  async function sendMessage(content: string, isContinuation = false) {
    const userMessageId = generateId();
    const assistantMessageId = generateId();

    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content,
    };

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      isStreaming: true,
      model,
      deepDive,
    };

    const conversationHistory = buildConversationHistory();

    setMessages((prevMessages) => [...prevMessages, userMessage, assistantMessage]);
    setIsLoading(true);
    userScrolledRef.current = false;

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: content,
          model,
          deepDive,
          messages: conversationHistory,
          isContinuation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      const structuredHeader = response.headers.get("X-Sources-Structured");
      const paperHeader = response.headers.get("X-Sources-Paper");
      const answerFormatHeader = response.headers.get("X-Answer-Format");

      const answerFormat: AnswerFormat =
        answerFormatHeader === "paragraph" || answerFormatHeader === "paragraph_table" || answerFormatHeader === "report"
          ? answerFormatHeader
          : "standard";

      let structuredSources: StructuredSource[] = [];
      let paperSources: PaperSource[] = [];

      try {
        if (structuredHeader) {
          structuredSources = JSON.parse(structuredHeader);
        }
        if (paperHeader) {
          paperSources = JSON.parse(paperHeader);
        }
      } catch {
        // Headers might not be valid JSON
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: accumulated } : msg
          )
        );
      }

      // Handle empty response
      if (!accumulated.trim()) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "No response text was returned by the selected model.",
                  isStreaming: false,
                  isError: true,
                }
              : msg
          )
        );
        return;
      }

      const isIncomplete = detectIncompleteAnswer(accumulated, deepDive, answerFormat);

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: accumulated,
                isStreaming: false,
                isIncomplete,
                structuredSources,
                paperSources,
                answerFormat,
              }
            : msg
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: errorMessage,
                isStreaming: false,
                isError: true,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleContinue(messageId: string) {
    const continuePrompt =
      "Continue your previous answer from exactly where it stopped. Finish any incomplete table row first, then complete the remaining sections. Do not restart from the beginning. Keep the continuation concise and complete.";

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, isIncomplete: false } : msg
      )
    );

    sendMessage(continuePrompt, true);
  }

  function handleSuggestedPrompt(prompt: string) {
    sendMessage(prompt);
  }

  function handleClearChat() {
    setMessages([]);
    messageIdCounter = 0;
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0 py-4 sm:py-6">
      {/* Header controls */}
      <div className="relative pb-4 border-b border-border shrink-0">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <ModelSelector value={model} onChange={setModel} disabled={isLoading} />
          <DeepDiveToggle enabled={deepDive} onChange={setDeepDive} disabled={isLoading} />
        </div>
        {hasMessages && (
          <button
            type="button"
            onClick={handleClearChat}
            className="absolute right-0 top-0 text-xs text-text-tertiary hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-surface-muted"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        className={`flex-1 min-h-0 mt-4 ${hasMessages ? "overflow-y-auto" : "overflow-hidden"}`}
      >
        {!hasMessages ? (
          <div className="h-full flex flex-col justify-center items-center max-w-3xl mx-auto px-2 overflow-hidden">
            <div className="text-center mb-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
                Ask the database
              </h1>
              <p className="text-text-secondary text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                Get evidence-grounded answers about Down syndrome preclinical research. Every claim
                is cited with database records and paper passages.
              </p>
            </div>
            <SuggestedPrompts onSelect={handleSuggestedPrompt} />
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onContinue={msg.isIncomplete ? () => handleContinue(msg.id) : undefined}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background shrink-0 pt-4 pb-2">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
        <p className="text-xs text-center mt-2 text-text-secondary/60 max-w-4xl mx-auto px-4">
          AI-generated responses may contain errors — verify all claims against cited sources.
          <span className="mx-2 opacity-50">·</span>
          Powered by University of Dayton&apos;s Azure OpenAI access.
        </p>
      </div>
    </div>
  );
}
