"use client";

import { RoundCompleteBanner } from "@/components/round/round-complete-banner";
import { RoundLoserBanner } from "@/components/round/round-loser-banner";
import {
  getRoundWinners,
  isPlayerRoundWinner,
} from "@/lib/scoring/round-winners";
import type { GameMode, LeaderboardResult, Player } from "@/lib/types";

export function RoundCompleteCelebration({
  tripName,
  gameMode,
  leaderboard,
  playerId,
  players,
}: {
  tripName?: string | null;
  gameMode: GameMode;
  leaderboard: LeaderboardResult;
  playerId?: string | null;
  players: Player[];
}) {
  const { winnerIds, names } = getRoundWinners(leaderboard);
  const isWinner = isPlayerRoundWinner(playerId, players, gameMode, winnerIds);
  const me = players.find((p) => p.id === playerId);

  if (isWinner) {
    return (
      <RoundCompleteBanner
        tripName={tripName}
        gameMode={gameMode}
        leaderboard={leaderboard}
      />
    );
  }

  return (
    <RoundLoserBanner
      tripName={tripName}
      winnerNames={names}
      playerName={me?.display_name}
    />
  );
}
