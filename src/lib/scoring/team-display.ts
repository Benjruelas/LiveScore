import type { Player, Score } from "../types";

/** Team score on a hole: scramble uses team row; otherwise best ball among members */
export function teamHoleStrokes(
  teamId: string,
  hole: number,
  players: Player[],
  scores: Score[],
  scramble: boolean
): number | null {
  if (scramble) {
    return scores.find((s) => s.team_id === teamId && s.hole === hole)?.strokes ?? null;
  }
  const members = players.filter((p) => p.team_id === teamId && p.is_active);
  const vals = members
    .map((p) => scores.find((s) => s.player_id === p.id && s.hole === hole)?.strokes)
    .filter((v): v is number => v != null);
  return vals.length ? Math.min(...vals) : null;
}
