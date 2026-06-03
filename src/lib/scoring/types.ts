import type { GameMode, ModeConfig, Player, Score, Team } from "../types";
import type { HoleData } from "../types";

export interface ScoringContext {
  mode: GameMode;
  modeConfig: ModeConfig;
  players: Player[];
  teams: Team[];
  scores: Score[];
  holes: HoleData[];
  handicapsEnabled: boolean;
  slopeRating?: number;
  throughHole?: number;
}
