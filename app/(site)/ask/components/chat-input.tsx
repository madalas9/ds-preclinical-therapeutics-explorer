"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_CHARS = 500;
const MIN_ROWS = 2;
const MAX_ROWS = 6;

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = value.length;
  const canSend = value.trim().length > 0 && !disabled && charCount <= MAX_CHARS;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineHeight = 24;
    const minHeight = lineHeight * MIN_ROWS;
    const maxHeight = lineHeight * MAX_ROWS;
    const scrollHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${scrollHeight}px`;
  }, [value]);

  function handleSubmit() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border border-border rounded-xl bg-surface p-2 shadow-sm">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS + 50))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask about Down syndrome preclinical research..."}
          disabled={disabled}
          rows={MIN_ROWS}
          className="flex-1 resize-none bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none px-2 py-1.5 disabled:opacity-50"
          style={{ lineHeight: "24px" }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className="w-11 h-11 rounded-lg bg-accent-rescue text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-rescue/90 transition-colors"
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <div className="flex items-center justify-between px-2 pt-1.5 text-xs text-text-tertiary">
        <span>Enter to send · Shift+Enter for newline</span>
        <span className={charCount > MAX_CHARS ? "text-red-500" : ""}>
          {charCount}/{MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
