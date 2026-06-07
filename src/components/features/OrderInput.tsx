"use client";

import { Mic, MicOff } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useVoice } from "@/lib/hooks/useVoice";
import { cn } from "@/lib/cn";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function OrderInput({ value, onChange, onSubmit, disabled, loading }: Props) {
  const { listening, supported, toggle } = useVoice((t) =>
    onChange(value ? `${value} ${t}` : t),
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter submits; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !loading) onSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='e.g. "order a CBC and a chest X-ray, and start metformin 500mg BID"'
          disabled={disabled || loading}
          aria-label="Natural-language order"
          className={supported ? "pr-11" : undefined}
        />
        {supported && (
          <button
            type="button"
            onClick={toggle}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            className={cn(
              "absolute right-2 top-2 rounded-md p-1.5 transition-colors",
              listening ? "bg-primary text-surface" : "text-text-muted hover:bg-surface-alt",
            )}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted" aria-live="polite">
          {loading
            ? "Atlas is drafting…"
            : listening
              ? "Listening…"
              : "Enter to draft · Shift+Enter for a new line"}
        </span>
        <Button size="sm" onClick={onSubmit} disabled={disabled || loading || !value.trim()}>
          Draft orders
        </Button>
      </div>
    </div>
  );
}
