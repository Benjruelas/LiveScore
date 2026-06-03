export type GameMode =
  | "stroke"
  | "stableford"
  | "skins"
  | "scramble"
  | "best_ball"
  | "wolf"
  | "ryder";

export type RoundStatus = "setup" | "active" | "completed";

export type RyderFormat = "team_points" | "match_play" | "cumulative_strokes";
export type WolfVariant = "standard" | "hammer" | "simplified";

export interface ModeConfig {
  ryder_format?: RyderFormat;
  wolf_variant?: WolfVariant;
  wolf_point_values?: { lone_wolf: number; win: number; halve: number };
  skins_carry?: boolean;
}

export interface HoleData {
  hole: number;
  par: number;
  yardage: number;
  strokeIndex: number;
}

export interface TeeData {
  id: string;
  name: string;
  color: string;
  totalYardage: number;
  courseRating?: number;
  slopeRating?: number;
  holes: HoleData[];
}

export interface CourseData {
  id: string;
  name: string;
  tees: TeeData[];
}

export interface Round {
  id: string;
  slug: string;
  status: RoundStatus;
  game_mode: GameMode;
  mode_config: ModeConfig;
  course_id: string;
  tee_id: string;
  handicaps_enabled: boolean;
  host_player_id: string | null;
  trip_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  round_id: string;
  display_name: string;
  handicap_index: number | null;
  team_id: string | null;
  is_active: boolean;
  is_host: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  round_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Score {
  id: string;
  round_id: string;
  hole: number;
  player_id: string | null;
  team_id: string | null;
  strokes: number;
  contributor_player_id: string | null;
  entered_by_player_id: string | null;
  wolf_points: number | null;
  created_at: string;
  updated_at: string;
}

export type RoundEventType =
  | "score_updated"
  | "leaderboard_milestone"
  | "mode_changed"
  | "host_message";

export interface RoundEvent {
  id: string;
  round_id: string;
  event_type: RoundEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface StandingRow {
  id: string;
  label: string;
  rank: number;
  primary: string;
  secondary?: string;
  detail?: string;
}

export interface LeaderboardResult {
  mode: GameMode;
  standings: StandingRow[];
  drama: string;
  strokeTotals?: StandingRow[];
  nextHole?: number;
  hole?: number;
}

export interface PushSubscription {
  id: string;
  round_id: string;
  player_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}
