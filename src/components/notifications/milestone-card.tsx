"use client";

import type { LeaderboardResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MilestoneCard({
  hole,
  leaderboard,
  onDismiss,
}: {
  hole: number;
  leaderboard: LeaderboardResult;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <Card className="max-h-[85vh] w-full max-w-md overflow-y-auto border-amber-400/40 bg-gradient-to-b from-amber-950 to-emerald-950">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
          Leaderboard · Hole {hole}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">Status Drop</h2>
        <p className="mt-2 text-sm text-emerald-100">{leaderboard.drama}</p>

        <div className="mt-4 space-y-2">
          {leaderboard.standings.slice(0, 8).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
            >
              <span className="font-medium text-white">
                <span className="mr-2 text-amber-400">#{s.rank}</span>
                {s.label}
              </span>
              <span className="text-emerald-300">{s.primary}</span>
            </div>
          ))}
        </div>

        {leaderboard.strokeTotals && leaderboard.strokeTotals.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="text-xs font-semibold uppercase text-white/50">Stroke totals</p>
            {leaderboard.strokeTotals.slice(0, 5).map((s) => (
              <div key={s.id} className="flex justify-between py-1 text-sm text-white/80">
                <span>{s.label}</span>
                <span>{s.primary}</span>
              </div>
            ))}
          </div>
        )}

        <Button className="mt-6 w-full" variant="secondary" onClick={onDismiss}>
          Keep scoring
        </Button>
      </Card>
    </div>
  );
}
