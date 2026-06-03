"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScoreKeypad({
  value,
  par,
  onChange,
  onSubmit,
  submitting,
}: {
  value: number | null;
  par: number;
  onChange: (n: number) => void;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <span className="text-6xl font-bold tabular-nums text-white">
          {value ?? "—"}
        </span>
        <Button variant="secondary" type="button" onClick={() => onChange(par)}>
          Par ({par})
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {keys.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "min-h-14 rounded-xl text-xl font-bold transition active:scale-95",
              value === n
                ? "bg-emerald-500 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <Button
        className="w-full min-h-14 text-lg"
        disabled={value == null || submitting}
        onClick={onSubmit}
      >
        {submitting ? "Saving…" : "Post score"}
      </Button>
    </div>
  );
}
