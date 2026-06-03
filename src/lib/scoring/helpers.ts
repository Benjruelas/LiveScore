import type { HoleData, Player, Score } from "../types";
import { courseHandicapStrokes } from "../courses";

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
