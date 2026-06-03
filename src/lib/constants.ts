import type { GameMode, RyderFormat, WolfVariant } from "./types";

export const GAME_MODES: {
  id: GameMode;
  label: string;
  description: string;
  teamBased: boolean;
}[] = [
  { id: "stroke", label: "Stroke Play", description: "Lowest total strokes wins", teamBased: false },
  { id: "stableford", label: "Stableford", description: "Most points vs par wins", teamBased: false },
  { id: "skins", label: "Skins", description: "Win holes outright — no carry on ties", teamBased: false },
  { id: "scramble", label: "Scramble", description: "One team score per hole", teamBased: true },
  { id: "best_ball", label: "Best Ball", description: "Best team score each hole", teamBased: true },
  { id: "wolf", label: "Wolf", description: "Rotating wolf — points per hole", teamBased: false },
  { id: "ryder", label: "Ryder Cup", description: "Team match play formats", teamBased: true },
];

export const RYDER_FORMATS: { id: RyderFormat; label: string; hint: string }[] = [
  { id: "team_points", label: "Team Points", hint: "Win/halve/loss per hole by team total" },
  { id: "match_play", label: "Match Play", hint: "Head-to-head hole wins between teams" },
  { id: "cumulative_strokes", label: "Cumulative Strokes", hint: "Lowest combined team strokes" },
];

export const WOLF_VARIANTS: { id: WolfVariant; label: string }[] = [
  { id: "standard", label: "Standard Wolf" },
  { id: "hammer", label: "Wolf + Hammer" },
  { id: "simplified", label: "Trip Simplified" },
];

export const MILESTONE_HOLES = [3, 6, 9, 12, 15, 18];

export const STORAGE_KEYS = {
  playerId: (slug: string) => `livescore:player:${slug}`,
  roundSlug: "livescore:lastRound",
  pushDismissed: (slug: string) => `livescore:pushDismissed:${slug}`,
} as const;
