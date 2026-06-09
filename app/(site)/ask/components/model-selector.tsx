"use client";

import { ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const MODELS = [
  { id: "gpt-5.4", label: "GPT-5.4", description: "Fast, reliable" },
  { id: "gpt-5.5", label: "GPT-5.5", description: "Best reasoning" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

interface ModelSelectorProps {
  value: ModelId;
  onChange: (model: ModelId) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = MODELS.find((m) => m.id === value) || MODELS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg border border-border bg-surface text-sm text-text-primary hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="font-medium">{selected.label}</span>
        <span className="text-text-tertiary hidden sm:inline">({selected.description})</span>
        <ChevronDown className="w-4 h-4 text-text-tertiary ml-1" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-border bg-surface shadow-lg z-50">
          {MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onChange(model.id);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-surface-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <div>
                <span className="font-medium text-text-primary">{model.label}</span>
                <span className="text-text-tertiary ml-2">{model.description}</span>
              </div>
              {model.id === value && (
                <Check className="w-4 h-4 text-accent-rescue" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
