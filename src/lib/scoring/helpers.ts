import type { HoleData, Player, Score, Team } from "../types";
import { courseHandicapStrokes } from "../courses";
import type { GameMode } from "../types";
import type { ScoringContext } from "./types";

/** Teams that have at least one active player — empty teams are excluded from team contests */
export function getTeamsWithMembers(ctx: ScoringContext): Team[] {
  return ctx.teams.filter((t) =>
    ctx.players.some((p) => p.team_id === t.id && p.is_active)
  );
}

export function playerCompletedRound(playerId: string, scores: Score[]): boolean {
  for (let h = 1; h <= 18; h++) {
    if (!scores.some((s) => s.player_id === playerId && s.hole === h)) return false;
  }
  return true;
}

export function teamCompletedRound(
  teamId: string,
  gameMode: GameMode,
  players: Player[],
  scores: Score[]
): boolean {
  for (let h = 1; h <= 18; h++) {
    if (!teamCompletedHole(teamId, h, gameMode, players, scores)) return false;
  }
  return true;
}

/** True when every active player (or contest team in scramble) has all 18 holes scored */
export function isRoundFullyScored(
  gameMode: GameMode,
  players: Player[],
  teams: Team[],
  scores: Score[]
): boolean {
  const active = players.filter((p) => p.is_active);
  if (active.length === 0) return false;

  if (gameMode === "scramble") {
    const contestTeams = teams.filter((t) =>
      active.some((p) => p.team_id === t.id)
    );
    if (contestTeams.length === 0) return false;
    return contestTeams.every((t) =>
      teamCompletedRound(t.id, gameMode, players, scores)
    );
  }

  return active.every((p) => playerCompletedRound(p.id, scores));
}

export function teamCompletedHole(
  teamId: string,
  hole: number,
  gameMode: GameMode,
  players: Player[],
  scores: Score[]
): boolean {
  const members = players.filter((p) => p.team_id === teamId && p.is_active);
  if (members.length === 0) return true;

  if (gameMode === "scramble") {
    return scores.some((s) => s.team_id === teamId && s.hole === hole);
  }
  return members.every((m) =>
    scores.some((s) => s.player_id === m.id && s.hole === hole)
  );
}

export function scoresThroughHole(scores: Score[], hole: number): Score[] {
  return scores.filter((s) => s.hole <= hole);
}

export function playerGrossTotal(
  playerId: string,
  scores: Score[],
  throughHole = 18
): number {
  return scores
    .filter((s) => s.player_id === playerId && s.hole <= throughHole)
    .reduce((sum, s) => sum + s.strokes, 0);
}

export function netStrokes(
  player: Player,
  hole: number,
  gross: number,
  holes: HoleData[],
  slopeRating: number,
  enabled: boolean
): number {
  if (!enabled || player.handicap_index == null) return gross;
  const sis = holes.map((h) => h.strokeIndex);
  const strokes = courseHandicapStrokes(player.handicap_index, slopeRating, sis);
  return gross - (strokes.get(hole) ?? 0);
}

export function stablefordPoints(strokes: number, par: number): number {
  const diff = strokes - par;
  if (diff <= -2) return 4;
  if (diff === -1) return 3;
  if (diff === 0) return 2;
  if (diff === 1) return 1;
  return 0;
}
