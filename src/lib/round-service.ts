import { nanoid } from "nanoid";
import { getSupabase } from "./supabase/client";
import type { GameMode, ModeConfig, Player, Round, Score } from "./types";

export async function createRound(params: {
  gameMode: GameMode;
  modeConfig: ModeConfig;
  courseId: string;
  teeId: string;
  handicapsEnabled: boolean;
  tripName: string;
  hostName: string;
}): Promise<{ round: Round; hostPlayer: Player }> {
  const supabase = getSupabase();
  const slug = nanoid(12);

  const { data: round, error: roundErr } = await supabase
    .from("rounds")
    .insert({
      slug,
      status: "setup",
      game_mode: params.gameMode,
      mode_config: params.modeConfig,
      course_id: params.courseId,
      tee_id: params.teeId,
      handicaps_enabled: params.handicapsEnabled,
      trip_name: params.tripName,
    })
    .select()
    .single();

  if (roundErr || !round) throw roundErr ?? new Error("Failed to create round");

  const { data: hostPlayer, error: playerErr } = await supabase
    .from("players")
    .insert({
      round_id: round.id,
      display_name: params.hostName,
      is_host: true,
      is_active: true,
    })
    .select()
    .single();

  if (playerErr || !hostPlayer) throw playerErr ?? new Error("Failed to create host");

  await supabase
    .from("rounds")
    .update({ host_player_id: hostPlayer.id })
    .eq("id", round.id);

  return { round: { ...round, host_player_id: hostPlayer.id }, hostPlayer };
}

export async function fetchRoundBySlug(slug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rounds")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data as Round;
}

export async function fetchRoundBundle(slug: string) {
  const round = await fetchRoundBySlug(slug);
  const supabase = getSupabase();
  const [players, teams, scores] = await Promise.all([
    supabase.from("players").select("*").eq("round_id", round.id).order("created_at"),
    supabase.from("teams").select("*").eq("round_id", round.id).order("sort_order"),
    supabase.from("scores").select("*").eq("round_id", round.id).order("hole"),
  ]);
  return {
    round,
    players: (players.data ?? []) as Player[],
    teams: (teams.data ?? []) as import("./types").Team[],
    scores: (scores.data ?? []) as Score[],
  };
}

export async function joinRound(slug: string, displayName: string): Promise<Player> {
  const round = await fetchRoundBySlug(slug);
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("players")
    .insert({
      round_id: round.id,
      display_name: displayName,
      is_active: true,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("Join failed");
  return data as Player;
}

export async function upsertScore(payload: {
  roundId: string;
  hole: number;
  strokes: number;
  playerId?: string | null;
  teamId?: string | null;
  contributorPlayerId?: string | null;
  enteredByPlayerId?: string | null;
  wolfPoints?: number | null;
}) {
  const supabase = getSupabase();
  const row = {
    round_id: payload.roundId,
    hole: payload.hole,
    strokes: payload.strokes,
    player_id: payload.playerId ?? null,
    team_id: payload.teamId ?? null,
    contributor_player_id: payload.contributorPlayerId ?? null,
    entered_by_player_id: payload.enteredByPlayerId ?? null,
    wolf_points: payload.wolfPoints ?? null,
    updated_at: new Date().toISOString(),
  };

  const filter = payload.teamId
    ? { round_id: payload.roundId, hole: payload.hole, team_id: payload.teamId }
    : { round_id: payload.roundId, hole: payload.hole, player_id: payload.playerId };

  const { data: existing } = await supabase
    .from("scores")
    .select("id")
    .match(filter)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("scores")
      .update(row)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as Score;
  }

  const { data, error } = await supabase.from("scores").insert(row).select().single();
  if (error) throw error;
  return data as Score;
}

export async function deleteScore(scoreId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("scores").delete().eq("id", scoreId);
  if (error) throw error;
}

export async function updateRound(
  roundId: string,
  patch: Partial<{
    status: string;
    game_mode: GameMode;
    mode_config: ModeConfig;
    course_id: string;
    tee_id: string;
    handicaps_enabled: boolean;
  }>
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("rounds")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", roundId);
  if (error) throw error;
}
