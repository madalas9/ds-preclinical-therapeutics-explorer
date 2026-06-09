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
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-text-tertiary text-sm">
        <Sparkles className="w-4 h-4" />
        <span>Try asking:</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(prompt)}
            className="text-left p-4 rounded-xl border border-border bg-surface hover:bg-surface-muted hover:border-interactive/50 transition-all text-sm text-text-secondary leading-relaxed min-h-[72px] group"
          >
            <span className="group-hover:text-text-primary transition-colors">
              {prompt}
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-text-tertiary">
        Ask follow-up questions to explore deeper — the AI remembers the conversation context.
      </p>
    </div>
  );
}
