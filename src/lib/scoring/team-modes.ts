import type { LeaderboardResult, StandingRow } from "../types";
import type { ScoringContext } from "./types";

function teamHoleBest(
  teamId: string,
  hole: number,
  ctx: ScoringContext,
  useTeamScore: boolean
): number | null {
  if (useTeamScore) {
    const ts = ctx.scores.find((s) => s.team_id === teamId && s.hole === hole);
    return ts?.strokes ?? null;
  }
  const members = ctx.players.filter((p) => p.team_id === teamId && p.is_active);
  const vals = members
    .map((p) => ctx.scores.find((s) => s.player_id === p.id && s.hole === hole)?.strokes)
    .filter((v): v is number => v != null);
  return vals.length ? Math.min(...vals) : null;
}

export function computeScrambleLeaderboard(ctx: ScoringContext): LeaderboardResult {
  const through = ctx.throughHole ?? 18;
  const rows = ctx.teams.map((t) => {
    let total = 0;
    let holes = 0;
    for (let h = 1; h <= through; h++) {
      const s = ctx.scores.find((sc) => sc.team_id === t.id && sc.hole === h);
      if (s) {
        total += s.strokes;
        holes++;
      }
    }
    return { id: t.id, label: t.name, total, holes };
  });
  rows.sort((a, b) => a.total - b.total);
  const standings: StandingRow[] = rows.map((r, i) => ({
    id: r.id,
    label: r.label,
    rank: i + 1,
    primary: r.holes ? `${r.total} (${r.holes} holes)` : "—",
  }));
  const leader = standings[0];
  return {
    mode: "scramble",
    standings,
    drama: leader?.primary !== "—" ? `${leader.label} leads scramble at ${leader.primary}` : "Waiting for team scores",
    hole: through,
  };
}

export function computeBestBallLeaderboard(ctx: ScoringContext): LeaderboardResult {
  const through = ctx.throughHole ?? 18;
  const rows = ctx.teams.map((t) => {
    let total = 0;
    for (let h = 1; h <= through; h++) {
      const best = teamHoleBest(t.id, h, ctx, false);
      if (best != null) total += best;
    }
    return { id: t.id, label: t.name, total };
  });
  rows.sort((a, b) => a.total - b.total);
  const standings: StandingRow[] = rows.map((r, i) => ({
    id: r.id,
    label: r.label,
    rank: i + 1,
    primary: `${r.total}`,
  }));
  const leader = standings[0];
  return {
    mode: "best_ball",
    standings,
    drama: leader ? `${leader.label} leads best ball with ${leader.primary}` : "No scores",
    hole: through,
  };
}

export function computeRyderLeaderboard(ctx: ScoringContext): LeaderboardResult {
  const through = ctx.throughHole ?? 18;
  const format = ctx.modeConfig.ryder_format ?? "team_points";
  const teamStats = ctx.teams.map((t) => ({
    id: t.id,
    label: t.name,
    points: 0,
    strokes: 0,
    holeWins: 0,
  }));

  for (let h = 1; h <= through; h++) {
    const totals = ctx.teams.map((t) => ({
      teamId: t.id,
      strokes: teamHoleBest(t.id, h, ctx, false),
    }));
    if (totals.some((x) => x.strokes == null)) continue;

    if (format === "cumulative_strokes") {
      for (const t of teamStats) {
        const s = totals.find((x) => x.teamId === t.id)?.strokes ?? 0;
        t.strokes += s;
      }
      continue;
    }

    const sorted = [...totals].sort((a, b) => (a.strokes ?? 99) - (b.strokes ?? 99));
    const best = sorted[0].strokes;
    const winners = sorted.filter((x) => x.strokes === best);

    if (format === "team_points") {
      if (winners.length === 1) {
        const ts = teamStats.find((x) => x.id === winners[0].teamId);
        if (ts) ts.points += 1;
      } else {
        for (const w of winners) {
          const ts = teamStats.find((x) => x.id === w.teamId);
          if (ts) ts.points += 0.5;
        }
      }
    } else if (format === "match_play" && winners.length === 1) {
      const ts = teamStats.find((x) => x.id === winners[0].teamId);
      if (ts) ts.holeWins += 1;
    }
  }

  let standings: StandingRow[];
  if (format === "cumulative_strokes") {
    teamStats.sort((a, b) => a.strokes - b.strokes);
    standings = teamStats.map((t, i) => ({
      id: t.id,
      label: t.label,
      rank: i + 1,
      primary: `${t.strokes} strokes`,
    }));
  } else if (format === "match_play") {
    teamStats.sort((a, b) => b.holeWins - a.holeWins);
    standings = teamStats.map((t, i) => ({
      id: t.id,
      label: t.label,
      rank: i + 1,
      primary: `${t.holeWins} holes won`,
    }));
  } else {
    teamStats.sort((a, b) => b.points - a.points);
    standings = teamStats.map((t, i) => ({
      id: t.id,
      label: t.label,
      rank: i + 1,
      primary: `${t.points} pts`,
    }));
  }

  const leader = standings[0];
  return {
    mode: "ryder",
    standings,
    drama: leader ? `${leader.label} leads Ryder (${format.replace(/_/g, " ")})` : "Ryder Cup underway",
    hole: through,
  };
}
