import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getTee } from "@/lib/courses";
import { computeFullMilestonePayload } from "@/lib/scoring";
import type { GameMode, ModeConfig, Player, Score, Team } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { roundId, hole } = (await request.json()) as { roundId: string; hole?: number };
    if (!roundId) return NextResponse.json({ error: "roundId required" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single();
    if (!round) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [{ data: players }, { data: teams }, { data: scores }] = await Promise.all([
      supabase.from("players").select("*").eq("round_id", roundId),
      supabase.from("teams").select("*").eq("round_id", roundId),
      supabase.from("scores").select("*").eq("round_id", roundId),
    ]);

    const maxHole =
      hole ?? (Math.max(0, ...(scores ?? []).map((s: Score) => s.hole)) || 3);

    const tee = getTee(round.course_id, round.tee_id);
    const lb = computeFullMilestonePayload({
      mode: round.game_mode as GameMode,
      modeConfig: (round.mode_config ?? {}) as ModeConfig,
      players: players as Player[],
      teams: teams as Team[],
      scores: scores as Score[],
      holes: tee?.holes ?? [],
      handicapsEnabled: round.handicaps_enabled,
      slopeRating: tee?.slopeRating,
      throughHole: maxHole,
    });

    const { data: ev } = await supabase
      .from("round_events")
      .insert({
        round_id: roundId,
        event_type: "leaderboard_milestone",
        payload: { hole: maxHole, leaderboard: lb, forced: true },
      })
      .select()
      .single();

    return NextResponse.json({ ok: true, event: ev });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
