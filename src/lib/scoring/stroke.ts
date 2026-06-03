import type { LeaderboardResult, StandingRow } from "../types";
import type { ScoringContext } from "./types";
import { netStrokes, playerGrossTotal } from "./helpers";

export function computeStrokeLeaderboard(ctx: ScoringContext): LeaderboardResult {
  const through = ctx.throughHole ?? 18;
  const rows: { id: string; label: string; gross: number; net: number }[] = [];

  for (const p of ctx.players.filter((x) => x.is_active)) {
    const gross = playerGrossTotal(p.id, ctx.scores, through);
    let net = 0;
    for (const h of ctx.holes.filter((hole) => hole.hole <= through)) {
      const sc = ctx.scores.find((s) => s.player_id === p.id && s.hole === h.hole);
      if (sc) {
        net += netStrokes(
          p,
          h.hole,
          sc.strokes,
          ctx.holes,
          ctx.slopeRating ?? 113,
          ctx.handicapsEnabled
        );
      }
    }
    rows.push({ id: p.id, label: p.display_name, gross, net: ctx.handicapsEnabled ? net : gross });
  }

  const sortKey = ctx.handicapsEnabled ? "net" : "gross";
  rows.sort((a, b) => a[sortKey] - b[sortKey]);

  const standings: StandingRow[] = rows.map((r, i) => ({
    id: r.id,
    label: r.label,
    rank: i + 1,
    primary: ctx.handicapsEnabled ? `${r.net} net` : `${r.gross}`,
    secondary: ctx.handicapsEnabled ? `${r.gross} gross` : undefined,
  }));

  const leader = standings[0];
  const drama = leader
    ? through < 18
      ? `${leader.label} leads with ${leader.primary} through hole ${through}`
      : `${leader.label} wins with ${leader.primary}`
    : "No scores yet";

  return {
    mode: "stroke",
    standings,
    strokeTotals: standings,
    drama,
    nextHole: through < 18 ? through + 1 : undefined,
    hole: through,
  };
}
