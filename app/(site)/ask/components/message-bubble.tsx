"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SourcesPanel, type StructuredSource, type PaperSource } from "./sources-panel";
import {
  User,
  Bot,
  AlertCircle,
  ExternalLink,
  Loader2,
  Search,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import type { ReactNode } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
  isIncomplete?: boolean;
  structuredSources?: StructuredSource[];
  paperSources?: PaperSource[];
  model?: string;
  deepDive?: boolean;
  answerFormat?: "paragraph" | "paragraph_table" | "standard" | "report";
}

interface MessageBubbleProps {
  message: ChatMessage;
  onContinue?: () => void;
}

function isCitationLink(text: string): boolean {
  return /^DST\d+/.test(text) || /^\w+\s+\d{4}$/.test(text.trim());
}

function CitationBadge({ href, children }: { href: string; children: ReactNode }) {
  const text = String(children).trim();

  const hasDot = text.includes("·");
  let id = "";
  let author = "";

  if (hasDot) {
    const parts = text.split("·").map((s) => s.trim());
    id = parts[0] || "";
    author = parts[1] || "";
  } else {
    id = text;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="citation-chip"
      title={`View source: ${text}`}
    >
      {id && <span className="citation-id">{id}</span>}
      {author && (
        <>
          <span className="citation-sep">·</span>
          <span className="citation-author">{author}</span>
        </>
      )}
      <ExternalLink className="citation-icon" />
    </a>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-4 text-text-secondary py-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent-rescue-bg flex items-center justify-center">
          <Search className="w-5 h-5 text-accent-rescue animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Searching evidence...</p>
          <p className="text-xs text-text-tertiary">
            Querying database records and paper passages
          </p>
        </div>
      </div>
      <Loader2 className="w-5 h-5 animate-spin text-accent-rescue ml-auto" />
    </div>
  );
}

function IncompleteWarning({ onContinue }: { onContinue?: () => void }) {
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This answer may have been cut off before completion.
          </p>
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
            >
              Continue answer
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({ message, onContinue }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end max-w-3xl ml-auto">
        <div className="max-w-[85%]">
          <div className="rounded-2xl rounded-br-sm px-4 py-3 bg-interactive text-white shadow-sm">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-interactive/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-interactive" />
        </div>
      </div>
    );
  }

  const isLoading = message.isStreaming && message.content.length === 0;
  const sourceCount =
    (message.structuredSources?.length || 0) + (message.paperSources?.length || 0);

  return (
    <div className="evidence-card">
      {/* Card Header */}
      <div className="evidence-card-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-rescue-bg flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-accent-rescue" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">Evidence Synthesis</span>
              {message.deepDive && (
                <span className="px-2 py-0.5 rounded-full bg-accent-rescue/10 text-accent-rescue text-xs font-medium">
                  Deep Dive
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              {message.model && <span>{message.model}</span>}
              {!message.isStreaming && sourceCount > 0 && (
                <>
                  <span>·</span>
                  <span>{sourceCount} sources</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="evidence-card-content">
        {message.isError ? (
          <div className="flex items-start gap-3 text-red-600 dark:text-red-400 py-4">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{message.content}</p>
            </div>
          </div>
        ) : isLoading ? (
          <LoadingIndicator />
        ) : (
          <div className="research-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const text = String(children);
                  if (isCitationLink(text) && href) {
                    return <CitationBadge href={href}>{children}</CitationBadge>;
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-interactive hover:underline"
                    >
                      {children}
                    </a>
                  );
                },
                h1: ({ children }) => <h1 className="research-h1">{children}</h1>,
                h2: ({ children }) => <h2 className="research-h2">{children}</h2>,
                h3: ({ children }) => <h3 className="research-h3">{children}</h3>,
                h4: ({ children }) => <h4 className="research-h4">{children}</h4>,
                p: ({ children }) => <p className="research-p">{children}</p>,
                ul: ({ children }) => <ul className="research-ul">{children}</ul>,
                ol: ({ children }) => <ol className="research-ol">{children}</ol>,
                li: ({ children }) => <li className="research-li">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-text-primary">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="research-blockquote">{children}</blockquote>
                ),
                hr: () => <hr className="research-hr" />,
                code: ({ children, className }) => {
                  const isInline = !className;
                  if (isInline) {
                    return <code className="research-code-inline">{children}</code>;
                  }
                  return <code className={className}>{children}</code>;
                },
                pre: ({ children }) => <pre className="research-pre">{children}</pre>,
                table: ({ children }) => (
                  <div className="research-table-wrapper">
                    <table className="research-table">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="research-thead">{children}</thead>,
                tbody: ({ children }) => <tbody className="research-tbody">{children}</tbody>,
                tr: ({ children }) => <tr className="research-tr">{children}</tr>,
                th: ({ children }) => <th className="research-th">{children}</th>,
                td: ({ children }) => <td className="research-td">{children}</td>,
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && message.content.length > 0 && (
              <span className="inline-block w-2 h-5 bg-accent-rescue animate-pulse ml-1 align-text-bottom rounded-sm" />
            )}
          </div>
        )}

        {/* Incomplete answer warning */}
        {!message.isStreaming && !message.isError && message.isIncomplete && (
          <IncompleteWarning onContinue={onContinue} />
        )}
      </div>

      {/* Sources Panel */}
      {!message.isStreaming && !message.isError && message.content.length > 0 && (
        <div className="evidence-card-footer">
          <SourcesPanel
            structuredSources={message.structuredSources || []}
            paperSources={message.paperSources || []}
          />
        </div>
      )}
    </div>
  );
}
