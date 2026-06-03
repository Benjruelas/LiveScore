"use client";

import { championLine } from "@/lib/scoring/round-winners";
import { cn } from "@/lib/utils";

const ROASTS = [
  "The beer cart had a better short game than you today.",
  "Your ball spent more time in the desert than a roadrunner.",
  "Vegas still has your dignity — check lost & found.",
  "They don't make a mulligan big enough for that scorecard.",
];

export function RoundLoserBanner({
  tripName,
  winnerNames,
  playerName,
}: {
  tripName?: string | null;
  winnerNames: string[];
  playerName?: string;
}) {
  const champions = championLine(winnerNames);
  const roast = ROASTS[Math.abs((playerName ?? "").length) % ROASTS.length];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-red-900/60 p-6 text-center shadow-lg shadow-red-950/50",
        "bg-gradient-to-br from-red-950 via-stone-900 to-black"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          background:
            "repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(127,29,29,0.15) 12px, rgba(127,29,29,0.15) 24px)",
        }}
      />
      <p className="relative text-xs font-bold uppercase tracking-[0.3em] text-red-400/90">
        Round over
      </p>
      <p className="relative mt-2 text-5xl" aria-hidden>
        💀
      </p>
      <h2 className="relative mt-3 text-4xl font-black uppercase tracking-tighter text-red-500 sm:text-5xl">
        You lost
      </h2>
      {playerName && (
        <p className="relative mt-2 text-lg font-bold text-red-300/90">{playerName}</p>
      )}
      <p className="relative mt-4 text-sm font-semibold uppercase tracking-wide text-stone-400">
        Champions
      </p>
      <p className="relative mt-1 text-2xl font-bold text-white">{champions || "Someone else"}</p>
      <p className="relative mt-5 text-base leading-relaxed text-stone-300">
        {champions ? (
          <>
            <span className="font-bold text-red-400">{champions}</span> won
            {tripName ? ` ${tripName}` : " this round"}. You didn&apos;t. Pack it in.
          </>
        ) : (
          <>You didn&apos;t win. Shocking, we know.</>
        )}
      </p>
      <p className="relative mt-4 rounded-lg border border-red-900/50 bg-black/40 px-4 py-3 text-sm italic text-red-200/80">
        {roast}
      </p>
      <p className="relative mt-4 text-xs text-stone-500">
        Final standings below — try not to cry into your nachos.
      </p>
    </div>
  );
}
