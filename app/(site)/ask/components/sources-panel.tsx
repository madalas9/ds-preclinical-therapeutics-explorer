"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Database, FileText } from "lucide-react";

export interface StructuredSource {
  id: string;
  name: string;
  doi: string;
}

export interface PaperSource {
  title: string;
  year: string;
  doi: string;
}

interface SourcesPanelProps {
  structuredSources: StructuredSource[];
  paperSources: PaperSource[];
}

function formatDoi(doi: string): string {
  if (!doi) return "";
  if (doi.startsWith("http")) return doi;
  return `https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//i, "")}`;
}

export function SourcesPanel({ structuredSources, paperSources }: SourcesPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const dbCount = structuredSources.length;
  const paperCount = paperSources.length;
  const totalCount = dbCount + paperCount;

  if (totalCount === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-muted transition-colors min-h-[48px]"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-tertiary shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
        )}
        <span className="font-medium text-text-primary">
          {totalCount} sources used
        </span>
        <span className="text-text-tertiary">
          — {dbCount} database record{dbCount !== 1 ? "s" : ""}, {paperCount} paper passage{paperCount !== 1 ? "s" : ""}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {dbCount > 0 && (
            <div className="px-4 py-4">
              <div className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide font-medium mb-3">
                <Database className="w-3.5 h-3.5" />
                Database Records ({dbCount})
              </div>
              <div className="flex flex-wrap gap-2">
                {structuredSources.map((src, i) => (
                  <a
                    key={i}
                    href={formatDoi(src.doi)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-rescue-bg border border-accent-rescue/20 text-xs hover:bg-accent-rescue/20 transition-colors group"
                  >
                    <span className="font-mono font-semibold text-accent-rescue">{src.id}</span>
                    <span className="text-text-tertiary">·</span>
                    <span className="text-text-secondary max-w-[140px] truncate">{src.name}</span>
                    <ExternalLink className="w-3 h-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {paperCount > 0 && (
            <div className={`px-4 py-4 ${dbCount > 0 ? "border-t border-border" : ""}`}>
              <div className="flex items-center gap-2 text-xs text-text-tertiary uppercase tracking-wide font-medium mb-3">
                <FileText className="w-3.5 h-3.5" />
                Paper Passages ({paperCount})
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {paperSources.map((src, i) => (
                  <a
                    key={i}
                    href={formatDoi(src.doi)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-surface-muted transition-colors group"
                  >
                    <span className="text-xs font-mono text-text-tertiary shrink-0 mt-0.5">
                      {src.year}
                    </span>
                    <span className="text-sm text-text-primary group-hover:text-interactive line-clamp-2 flex-1">
                      {src.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
