"use client";

import { computeLeaderboard } from "@/lib/scoring";
import { getTee } from "@/lib/courses";
import type { Player, Round, Score, Team } from "@/lib/types";
import { Card } from "@/components/ui/card";

export function LeaderboardPanel({
  round,
  players,
  teams,
  scores,
}: {
  round: Round;
  players: Player[];
  teams: Team[];
  scores: Score[];
}) {
  const tee = getTee(round.course_id, round.tee_id);
  const maxHole = Math.max(0, ...scores.map((s) => s.hole)) || undefined;
  const lb = computeLeaderboard({
    mode: round.game_mode,
    modeConfig: round.mode_config ?? {},
    players,
    teams,
    scores,
    holes: tee?.holes ?? [],
    handicapsEnabled: round.handicaps_enabled,
    slopeRating: tee?.slopeRating,
    throughHole: maxHole,
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-emerald-200">{lb.drama}</p>
      {lb.standings.map((s) => (
        <Card key={s.id} className="flex items-center justify-between py-3">
          <span className="text-white">
            <span className="mr-2 font-bold text-amber-400">#{s.rank}</span>
            {s.label}
          </span>
          <span className="font-semibold text-emerald-300">{s.primary}</span>
        </Card>
      ))}
      {lb.standings.length === 0 && (
        <p className="text-center text-white/50">No standings yet</p>
      )}
    </div>
  );
}
