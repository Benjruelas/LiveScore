import type { LeaderboardResult } from "../types";
import type { ScoringContext } from "./types";
import { computeStrokeLeaderboard } from "./stroke";
import { computeStablefordLeaderboard } from "./stableford";
import { computeSkinsLeaderboard } from "./skins";
import {
  computeBestBallLeaderboard,
  computeRyderLeaderboard,
  computeScrambleLeaderboard,
} from "./team-modes";
import { computeWolfLeaderboard } from "./wolf";
import { computeStrokeLeaderboard as strokeForTotals } from "./stroke";

export function computeLeaderboard(ctx: ScoringContext): LeaderboardResult {
  switch (ctx.mode) {
    case "stroke":
      return computeStrokeLeaderboard(ctx);
    case "stableford":
      return computeStablefordLeaderboard(ctx);
    case "skins":
      return computeSkinsLeaderboard(ctx);
    case "scramble":
      return computeScrambleLeaderboard(ctx);
    case "best_ball":
      return computeBestBallLeaderboard(ctx);
    case "ryder":
      return computeRyderLeaderboard(ctx);
    case "wolf":
      return computeWolfLeaderboard(ctx);
    default:
      return computeStrokeLeaderboard(ctx);
  }
}

export function computeFullMilestonePayload(ctx: ScoringContext): LeaderboardResult & {
  strokeTotals?: LeaderboardResult["standings"];
} {
  const main = computeLeaderboard(ctx);
  const strokeCtx = { ...ctx, mode: "stroke" as const };
  const strokeLb = strokeForTotals(strokeCtx);
  return {
    ...main,
    strokeTotals: strokeLb.standings,
    drama: `${main.drama}. ${strokeLb.drama}`,
  };
}

export * from "./types";
