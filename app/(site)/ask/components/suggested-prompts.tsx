"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { getRandomPrompts } from "../lib/suggested-prompts";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const prompts = useMemo(() => getRandomPrompts(4), []);

  return (
    <div className="space-y-2 sm:space-y-4 w-full">
      <div className="flex items-center justify-center gap-1.5 text-text-tertiary text-[10px] sm:text-sm">
        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>Try asking:</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(prompt)}
            className="text-left p-2 sm:p-4 rounded-lg sm:rounded-xl border border-border bg-surface hover:bg-surface-muted hover:border-interactive/50 transition-all text-[11px] sm:text-sm text-text-secondary leading-snug sm:leading-relaxed group"
          >
            <span className="group-hover:text-text-primary transition-colors">
              {prompt}
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-[9px] sm:text-xs text-text-tertiary mt-1 sm:mt-0">
        Ask follow-up questions to explore deeper — the AI remembers the conversation context.
      </p>
    </div>
  );
}
