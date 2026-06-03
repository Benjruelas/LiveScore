"use client";

import { getHolePar } from "@/lib/courses";
import { teamHoleStrokes } from "@/lib/scoring/team-display";
import { GolfScoreMark } from "@/components/scoring/golf-score-mark";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Player, Score, Team } from "@/lib/types";

export function TeamHoleScores({
  teams,
  players,
  scores,
  hole,
  courseId,
  teeId,
  scramble,
  highlightTeamId,
}: {
  teams: Team[];
  players: Player[];
  scores: Score[];
  hole: number;
  courseId: string;
  teeId: string;
  scramble: boolean;
  highlightTeamId?: string | null;
}) {
  if (teams.length === 0) return null;

  const par = getHolePar(courseId, teeId, hole);

  return (
    <Card>
      <p className="mb-2 text-xs text-white/50">Teams · hole {hole}</p>
      <ul className="space-y-2">
        {teams.map((t) => {
          const strokes = teamHoleStrokes(t.id, hole, players, scores, scramble);
          const hasMembers = players.some((p) => p.team_id === t.id && p.is_active);
          const active = t.id === highlightTeamId;

          return (
            <li
              key={t.id}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2",
                active ? "bg-emerald-500/20 ring-1 ring-emerald-500/40" : "bg-white/5"
              )}
            >
              <span className="font-medium text-white">{t.name}</span>
              <span className="text-right">
                {!hasMembers ? (
                  <span className="text-xs text-white/40">No players</span>
                ) : strokes != null ? (
                  <div className="flex justify-end">
                    <GolfScoreMark strokes={strokes} par={par} size="md" />
                  </div>
                ) : (
                  <span className="text-sm text-white/35">—</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
