"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GolfScoreMark } from "@/components/scoring/golf-score-mark";
import { scoreKeyOptions, strokesToGolfLabel } from "@/lib/scoring/score-labels";

export function ScoreKeypad({
  value,
  par,
  onChange,
  onSubmit,
  submitting,
  disabled,
}: {
  value: number | null;
  par: number;
  onChange: (n: number) => void;
  onSubmit: () => void;
  submitting?: boolean;
  disabled?: boolean;
}) {
  const keys = scoreKeyOptions(par);
  const locked = disabled || submitting;

  return (
    <div className={cn("space-y-4", disabled && "pointer-events-none opacity-50")}>
      <div className="flex flex-col items-center justify-center gap-1 py-2">
        {value != null ? (
          <GolfScoreMark
            strokes={value}
            par={par}
            size="lg"
            label={strokesToGolfLabel(value, par)}
          />
        ) : (
          <span className="text-4xl font-bold text-white/30">—</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {keys.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "flex min-h-[4.5rem] flex-col items-center justify-center rounded-xl px-1 py-2 transition active:scale-95",
                selected
                  ? "bg-emerald-800/80 ring-2 ring-emerald-400"
                  : "bg-white/10 hover:bg-white/20"
              )}
            >
              <GolfScoreMark
                strokes={n}
                par={par}
                size="sm"
                label={strokesToGolfLabel(n, par)}
              />
            </button>
          );
        })}
      </div>
      <Button
        className="w-full min-h-14 text-lg"
        disabled={value == null || locked}
        onClick={onSubmit}
      >
        {submitting ? "Saving…" : "Post score"}
      </Button>
    </div>
  );
}
