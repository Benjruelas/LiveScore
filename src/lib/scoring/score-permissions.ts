import type { GameMode, Player } from "../types";

export class ScorePermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScorePermissionError";
  }
}

/** Whether this player may post a score for the given target */
export function canEnterScore(
  gameMode: GameMode,
  enteredBy: Player,
  target: { playerId?: string | null; teamId?: string | null }
): boolean {
  if (!enteredBy.is_active) return false;

  if (gameMode === "scramble") {
    if (!enteredBy.team_id || !target.teamId) return false;
    return enteredBy.team_id === target.teamId;
  }

  if (!target.playerId) return false;
  return enteredBy.id === target.playerId;
}

export function assertCanEnterScore(
  gameMode: GameMode,
  enteredBy: Player | null | undefined,
  target: { playerId?: string | null; teamId?: string | null }
): void {
  if (!enteredBy) {
    throw new ScorePermissionError("You must join the round before entering scores.");
  }
  if (!canEnterScore(gameMode, enteredBy, target)) {
    if (gameMode === "scramble") {
      throw new ScorePermissionError("You can only enter scores for your own team.");
    }
    throw new ScorePermissionError("You can only enter scores for yourself.");
  }
}
