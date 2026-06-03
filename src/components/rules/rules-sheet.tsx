"use client";

import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const RULES: Record<string, string> = {
  stroke: `# Stroke Play\n\nCount every stroke. Lowest total wins. Optional net scoring uses handicap strokes per hole.`,
  stableford: `# Stableford\n\nPoints by score vs par: Eagle+ = 4, Birdie = 3, Par = 2, Bogey = 1, Double+ = 0. Highest points wins.`,
  skins: `# Skins\n\nWin a hole outright (lowest score) to earn a skin. **Ties = no skin, no carry.**`,
  scramble: `# Scramble\n\nOne team score per hole. Everyone hits, play best ball, repeat. Optional tag who hit the scoring shot.`,
  best_ball: `# Best Ball\n\nEach player plays own ball; team score is the best score on the hole.`,
  wolf_standard: `# Standard Wolf\n\n- 4 players, rotating Wolf each hole\n- Wolf picks a partner after drives, OR plays Lone Wolf\n- Lone Wolf wins = more points; loses = more lost\n- Default: Win hole = 2 pts, Halve = 1, Lone Wolf win = 4`,
  wolf_hammer: `# Wolf + Hammer\n\nStandard Wolf plus **Hammer**: after partners set, any player can hammer to double hole points. Wolf can re-hammer.`,
  wolf_simplified: `# Trip Simplified Wolf\n\n- Rotating Wolf only\n- Partner pick or Lone Wolf (no hammer)\n- Win = 1 pt, Lone Wolf win = 2, Halve = 0`,
  ryder_team_points: `# Ryder — Team Points\n\nEach hole: compare team totals. Lower team wins 1 point. Tie = 0.5 each.`,
  ryder_match_play: `# Ryder — Match Play\n\nEach hole won by a team adds to hole-win count. Most holes won leads.`,
  ryder_cumulative: `# Ryder — Cumulative Strokes\n\nAdd all team members' strokes. Lowest team total wins.`,
};

export function RulesSheet({
  gameMode,
  wolfVariant,
  ryderFormat,
  onClose,
}: {
  gameMode: string;
  wolfVariant?: string;
  ryderFormat?: string;
  onClose: () => void;
}) {
  let key = gameMode;
  if (gameMode === "wolf") key = `wolf_${wolfVariant ?? "standard"}`;
  if (gameMode === "ryder") key = `ryder_${ryderFormat ?? "team_points"}`;
  const md = RULES[key] ?? RULES[gameMode] ?? "# Rules\n\nAsk the host.";

  const share = () => {
    navigator.clipboard?.writeText(window.location.href.split("#")[0] + "#rules");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60">
      <Card className="max-h-[80vh] overflow-y-auto rounded-b-none border-b-0">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{md}</ReactMarkdown>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={share}>
            Copy rules link
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
