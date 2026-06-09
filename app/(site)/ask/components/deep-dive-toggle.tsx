"use client";

import { Layers } from "lucide-react";

interface DeepDiveToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function DeepDiveToggle({ enabled, onChange, disabled }: DeepDiveToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      title={
        enabled
          ? "Deep Dive ON: Uses more context and longer output. Best for mechanisms and detailed comparisons."
          : "Deep Dive OFF: Focused answers with standard context."
      }
      className={`
        flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg border text-sm font-medium transition-all
        ${
          enabled
            ? "bg-accent-rescue text-white border-accent-rescue"
            : "bg-surface text-text-primary border-border hover:bg-surface-muted"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <Layers className="w-4 h-4" />
      <span className="hidden sm:inline">Deep Dive</span>
      <span
        className={`
          w-5 h-5 rounded text-xs flex items-center justify-center font-bold
          ${enabled ? "bg-white/20" : "bg-text-tertiary/20"}
        `}
      >
        {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}
