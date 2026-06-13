"use client";

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
        flex items-center gap-1.5 px-4 h-9 rounded-full border text-sm font-medium transition-all
        ${
          enabled
            ? "bg-accent-rescue text-white border-accent-rescue"
            : "bg-surface text-text-primary border-border hover:bg-surface-muted"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <span>Deep Dive</span>
      <span
        className={`
          px-1.5 py-0.5 rounded text-xs font-bold
          ${enabled ? "bg-white/20" : "bg-text-tertiary/20"}
        `}
      >
        {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}
