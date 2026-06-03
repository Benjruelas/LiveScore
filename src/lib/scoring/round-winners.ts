import { GAME_MODES } from "@/lib/constants";
import type { GameMode, LeaderboardResult, Player } from "../types";

export function getRoundWinners(leaderboard: LeaderboardResult) {
  const top = leaderboard.standings[0];
  if (!top) {
    return { winnerIds: [] as string[], names: [] as string[] };
  }
  const coChampions = leaderboard.standings.filter(
    (s, i) => i > 0 && s.primary === top.primary
  );
  const winners = [top, ...coChampions];
  return {
    winnerIds: winners.map((w) => w.id),
    names: winners.map((w) => w.label),
  };
}

export function isPlayerRoundWinner(
  playerId: string | null | undefined,
  players: Player[],
  gameMode: GameMode,
  winnerIds: string[]
): boolean {
  if (!playerId || winnerIds.length === 0) return false;
  const me = players.find((p) => p.id === playerId);
  if (!me) return false;
  const teamBased = GAME_MODES.find((m) => m.id === gameMode)?.teamBased ?? false;
  if (teamBased) {
    return !!me.team_id && winnerIds.includes(me.team_id);
  }
  return winnerIds.includes(me.id);
}

export function championLine(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
}
