import type { LeaderboardResult, StandingRow } from "../types";
import type { ScoringContext } from "./types";
import { netStrokes } from "./helpers";

export function computeSkinsLeaderboard(ctx: ScoringContext): LeaderboardResult {
  const through = ctx.throughHole ?? 18;
  const skinCounts = new Map<string, number>();
  for (const p of ctx.players.filter((x) => x.is_active)) skinCounts.set(p.id, 0);

  for (const h of ctx.holes.filter((hole) => hole.hole <= through)) {
    const holeScores = ctx.players
      .filter((x) => x.is_active)
      .map((p) => {
        const sc = ctx.scores.find((s) => s.player_id === p.id && s.hole === h.hole);
        if (!sc) return null;
        const strokes = netStrokes(
          p,
          h.hole,
          sc.strokes,
          ctx.holes,
          ctx.slopeRating ?? 113,
          ctx.handicapsEnabled
        );
        return { playerId: p.id, strokes };
      })
      .filter(Boolean) as { playerId: string; strokes: number }[];

    if (holeScores.length !== ctx.players.filter((x) => x.is_active).length) continue;

    const min = Math.min(...holeScores.map((x) => x.strokes));
    const winners = holeScores.filter((x) => x.strokes === min);
    if (winners.length === 1) {
      skinCounts.set(winners[0].playerId, (skinCounts.get(winners[0].playerId) ?? 0) + 1);
    }
  }

  const rows = [...skinCounts.entries()]
    .map(([id, skins]) => ({
      id,
      label: ctx.players.find((p) => p.id === id)?.display_name ?? "?",
      skins,
    }))
    .sort((a, b) => b.skins - a.skins);

  const standings: StandingRow[] = rows.map((r, i) => ({
    id: r.id,
    label: r.label,
    rank: i + 1,
    primary: `${r.skins} skin${r.skins === 1 ? "" : "s"}`,
  }));

  const leader = standings[0];
  const drama = leader
    ? `${leader.label} leads with ${leader.primary} (no carry on ties)`
    : "No skins awarded yet";

  return { mode: "skins", standings, drama, hole: through };
}
