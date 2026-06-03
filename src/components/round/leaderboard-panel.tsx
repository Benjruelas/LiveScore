"use client";

import { computeLeaderboard } from "@/lib/scoring";
import { getTee } from "@/lib/courses";
import type { Player, Round, Score, Team } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RoundCompleteCelebration } from "@/components/round/round-complete-celebration";
import { getRoundWinners, isPlayerRoundWinner } from "@/lib/scoring/round-winners";
import { GAME_MODES } from "@/lib/constants";

export function LeaderboardPanel({
  round,
  players,
  teams,
  scores,
  playerId,
}: {
  round: Round;
  players: Player[];
  teams: Team[];
  scores: Score[];
  playerId?: string | null;
}) {
  const tee = getTee(round.course_id, round.tee_id);
  const isComplete = round.status === "completed";
  const maxHole = Math.max(0, ...scores.map((s) => s.hole)) || undefined;
  const throughHole = isComplete ? 18 : maxHole || undefined;
  const lb = computeLeaderboard({
    mode: round.game_mode,
    modeConfig: round.mode_config ?? {},
    players,
    teams,
    scores,
    holes: tee?.holes ?? [],
    handicapsEnabled: round.handicaps_enabled,
    slopeRating: tee?.slopeRating,
    throughHole,
  });

  const { winnerIds } = getRoundWinners(lb);
  const isWinner = isPlayerRoundWinner(playerId, players, round.game_mode, winnerIds);
  const teamBased = GAME_MODES.find((m) => m.id === round.game_mode)?.teamBased ?? false;
  const me = players.find((p) => p.id === playerId);
  const myStandingId = teamBased ? me?.team_id : me?.id;

  return (
    <div className="space-y-4">
      {isComplete && (
        <RoundCompleteCelebration
          tripName={round.trip_name}
          gameMode={round.game_mode}
          leaderboard={lb}
          playerId={playerId}
          players={players}
        />
      )}
      {!isComplete && <p className="text-sm text-emerald-200">{lb.drama}</p>}
      {lb.standings.map((s) => (
        <Card
          key={s.id}
          className={cn(
            "flex items-center justify-between py-3",
            isComplete &&
              winnerIds.includes(s.id) &&
              "border-amber-400/50 bg-amber-500/10 ring-1 ring-amber-400/40",
            isComplete &&
              !isWinner &&
              myStandingId &&
              s.id === myStandingId &&
              "border-red-900/50 bg-red-950/30 ring-1 ring-red-800/40"
          )}
        >
          <div>
            <span className="text-white">
              <span className="mr-2 font-bold text-amber-400">#{s.rank}</span>
              {s.label}
            </span>
            {s.secondary && (
              <p className="text-xs text-white/50">{s.secondary}</p>
            )}
          </div>
          <span className="font-semibold text-emerald-300">{s.primary}</span>
        </Card>
      ))}
      {lb.standings.length === 0 && (
        <p className="text-center text-white/50">No standings yet</p>
      )}
    </div>
  );
}
