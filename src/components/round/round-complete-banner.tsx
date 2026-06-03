"use client";

import { GAME_MODES } from "@/lib/constants";
import { championLine, getRoundWinners } from "@/lib/scoring/round-winners";
import type { GameMode, LeaderboardResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RoundCompleteBanner({
  tripName,
  gameMode,
  leaderboard,
}: {
  tripName?: string | null;
  gameMode: GameMode;
  leaderboard: LeaderboardResult;
}) {
  const modeMeta = GAME_MODES.find((m) => m.id === gameMode);
  const teamBased = modeMeta?.teamBased ?? false;
  const top = leaderboard.standings[0];
  const { names } = getRoundWinners(leaderboard);
  const coCount = names.length;
  const title = championLine(names);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-400/40 p-6 text-center shadow-lg shadow-amber-900/30",
        "bg-gradient-to-br from-amber-500/25 via-emerald-800/40 to-emerald-950"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(251,191,36,0.35) 0%, transparent 45%), radial-gradient(circle at 80% 30%, rgba(52,211,153,0.25) 0%, transparent 40%)",
        }}
      />
      <p className="relative text-xs font-bold uppercase tracking-[0.25em] text-amber-200/90">
        Round complete
      </p>
      <p className="relative mt-2 text-5xl" aria-hidden>
        🏆
      </p>
      {top ? (
        <>
          <h2 className="relative mt-3 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-3xl font-black uppercase tracking-tight text-transparent sm:text-4xl">
            {coCount > 1 ? "Co-champions!" : "Champions!"}
          </h2>
          <p className="relative mt-3 text-2xl font-bold text-white sm:text-3xl">{title}</p>
          <p className="relative mt-2 text-lg font-semibold text-emerald-200">{top.primary}</p>
          <p className="relative mt-4 text-sm leading-relaxed text-white/75">
            {teamBased ? (
              <>
                <span className="font-semibold text-amber-200">{title}</span> takes the{" "}
                {tripName ? `${tripName} ` : ""}
                {modeMeta?.label ?? "round"} — unbelievable finish out there!
              </>
            ) : (
              <>
                Congrats to <span className="font-semibold text-amber-200">{title}</span>
                {coCount > 1 ? " — what a battle" : " — what a round"}!
                {tripName ? ` ${tripName} is in the books.` : ""}
              </>
            )}
          </p>
        </>
      ) : (
        <>
          <h2 className="relative mt-3 text-2xl font-bold text-white">Thanks for playing!</h2>
          <p className="relative mt-2 text-sm text-white/70">
            {tripName ?? "The trip"} is wrapped — check back for final standings.
          </p>
        </>
      )}
      <p className="relative mt-4 text-xs text-emerald-300/80">Final leaderboard ↓</p>
    </div>
  );
}
