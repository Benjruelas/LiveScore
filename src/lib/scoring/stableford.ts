import type { LeaderboardResult, StandingRow } from "../types";
import type { ScoringContext } from "./types";
import { stablefordPoints } from "./helpers";

export function computeStablefordLeaderboard(ctx: ScoringContext): LeaderboardResult {
  const through = ctx.throughHole ?? 18;
  const rows: { id: string; label: string; points: number }[] = [];

  for (const p of ctx.players.filter((x) => x.is_active)) {
    let points = 0;
    for (const h of ctx.holes.filter((hole) => hole.hole <= through)) {
      const sc = ctx.scores.find((s) => s.player_id === p.id && s.hole === h.hole);
      if (sc) points += stablefordPoints(sc.strokes, h.par);
    }
    rows.push({ id: p.id, label: p.display_name, points });
  }

  rows.sort((a, b) => b.points - a.points);
  const standings: StandingRow[] = rows.map((r, i) => ({
    id: r.id,
    label: r.label,
    rank: i + 1,
    primary: `${r.points} pts`,
  }));

  const leader = standings[0];
  const drama = leader
    ? `${leader.label} leads Stableford with ${leader.primary} through ${through}`
    : "No scores yet";

  return { mode: "stableford", standings, drama, hole: through, nextHole: through < 18 ? through + 1 : undefined };
}
