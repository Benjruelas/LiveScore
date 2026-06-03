import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getTee } from "@/lib/courses";
import { computeFullMilestonePayload } from "@/lib/scoring";
import {
  getTeamsWithMembers,
  isRoundFullyScored,
  teamCompletedHole,
} from "@/lib/scoring/helpers";
import { MILESTONE_HOLES } from "@/lib/constants";
import type { GameMode, ModeConfig, Player, Score, Team } from "@/lib/types";
import webpush from "web-push";

function configureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:host@example.com";
  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roundId, hole, enteredByPlayerId, playerName, strokes } = body as {
      roundId: string;
      hole: number;
      enteredByPlayerId?: string;
      playerName?: string;
      strokes?: number;
    };

    if (!roundId || !hole) {
      return NextResponse.json({ error: "Missing roundId or hole" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single();
    if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });
    if (round.status === "completed") {
      return NextResponse.json({ ok: true, roundCompleted: true });
    }

    const [{ data: players }, { data: teams }, { data: scores }] = await Promise.all([
      supabase.from("players").select("*").eq("round_id", roundId),
      supabase.from("teams").select("*").eq("round_id", roundId),
      supabase.from("scores").select("*").eq("round_id", roundId),
    ]);

    const activePlayers = (players ?? []).filter((p: Player) => p.is_active);
    const scoreMsg =
      playerName && strokes
        ? `${playerName} posted ${strokes} on hole ${hole}`
        : `Score updated on hole ${hole}`;

    await supabase.from("round_events").insert({
      round_id: roundId,
      event_type: "score_updated",
      payload: { hole, message: scoreMsg, enteredByPlayerId },
    });

    const holeScores = (scores ?? []).filter((s: Score) => s.hole === hole);
    const teamMode = ["scramble", "ryder", "best_ball"].includes(round.game_mode);
    const gameMode = round.game_mode as GameMode;

    let requiredCount = activePlayers.length;
    let completeCount = new Set(
      holeScores.map((s: Score) => s.player_id).filter(Boolean)
    ).size;

    if (teamMode && teams) {
      const ctx = {
        mode: gameMode,
        modeConfig: (round.mode_config ?? {}) as ModeConfig,
        players: players as Player[],
        teams: teams as Team[],
        scores: scores as Score[],
        holes: [],
        handicapsEnabled: round.handicaps_enabled,
      };
      const contestTeams = getTeamsWithMembers(ctx);
      requiredCount = contestTeams.length;
      completeCount = contestTeams.filter((t) =>
        teamCompletedHole(t.id, hole, gameMode, players as Player[], scores as Score[])
      ).length;
    }

    const fullyScored =
      round.status === "active" &&
      isRoundFullyScored(
        gameMode,
        players as Player[],
        (teams ?? []) as Team[],
        scores as Score[]
      );

    let milestone = null;
    if (
      MILESTONE_HOLES.includes(hole) &&
      requiredCount > 0 &&
      completeCount >= requiredCount &&
      !(hole === 18 && fullyScored)
    ) {
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
        throughHole: hole,
      });

      const { data: ev } = await supabase
        .from("round_events")
        .insert({
          round_id: roundId,
          event_type: "leaderboard_milestone",
          payload: { hole, leaderboard: lb },
        })
        .select()
        .single();

      milestone = ev;
      await sendPush(supabase, roundId, `Hole ${hole} leaderboard`, lb.drama);
    } else {
      await sendPush(supabase, roundId, "LiveScore", scoreMsg, enteredByPlayerId);
    }

    let roundCompleted = false;
    if (fullyScored) {
      const tee = getTee(round.course_id, round.tee_id);
      const finalLb = computeFullMilestonePayload({
        mode: gameMode,
        modeConfig: (round.mode_config ?? {}) as ModeConfig,
        players: players as Player[],
        teams: (teams ?? []) as Team[],
        scores: scores as Score[],
        holes: tee?.holes ?? [],
        handicapsEnabled: round.handicaps_enabled,
        slopeRating: tee?.slopeRating,
        throughHole: 18,
      });

      await supabase
        .from("rounds")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", roundId);

      await supabase.from("round_events").insert({
        round_id: roundId,
        event_type: "leaderboard_milestone",
        payload: { hole: 18, leaderboard: finalLb, roundComplete: true },
      });

      const winner = finalLb.standings[0]?.label ?? "the leaders";
      await sendPush(
        supabase,
        roundId,
        "Round complete!",
        `All 18 holes in — ${winner} take the crown.`
      );
      roundCompleted = true;
    }

    return NextResponse.json({ ok: true, milestone, roundCompleted });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

async function sendPush(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  roundId: string,
  title: string,
  body: string,
  excludePlayerId?: string
) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  configureVapid();

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("round_id", roundId);

  for (const sub of subs ?? []) {
    if (excludePlayerId && sub.player_id === excludePlayerId) continue;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, roundId })
      );
    } catch {
      /* stale subscription */
    }
  }
}
