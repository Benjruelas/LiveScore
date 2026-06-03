import type { LeaderboardResult, StandingRow } from "../types";
import type { ScoringContext } from "./types";

export function computeWolfLeaderboard(ctx: ScoringContext): LeaderboardResult {
  const through = ctx.throughHole ?? 18;
  const points = new Map<string, number>();
  for (const p of ctx.players.filter((x) => x.is_active)) points.set(p.id, 0);

  for (const s of ctx.scores.filter((sc) => sc.hole <= through && sc.wolf_points != null)) {
    if (s.player_id) {
      points.set(s.player_id, (points.get(s.player_id) ?? 0) + (s.wolf_points ?? 0));
    }
  }

  const rows = [...points.entries()]
    .map(([id, pts]) => ({
      id,
      label: ctx.players.find((p) => p.id === id)?.display_name ?? "?",
      pts,
    }))
    .sort((a, b) => b.pts - a.pts);

  const standings: StandingRow[] = rows.map((r, i) => ({
    id: r.id,
    label: r.label,
    rank: i + 1,
    primary: `${r.pts} pts`,
  }));

  const variant = ctx.modeConfig.wolf_variant ?? "standard";
  const leader = standings[0];
  return {
    mode: "wolf",
    standings,
    drama: leader
      ? `${leader.label} leads Wolf (${variant}) with ${leader.primary}`
      : "Enter wolf points per hole on scorecard",
    hole: through,
  };
}
