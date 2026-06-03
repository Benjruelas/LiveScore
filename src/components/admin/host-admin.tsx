"use client";

import { GAME_MODES, RYDER_FORMATS, WOLF_VARIANTS } from "@/lib/constants";
import { getAllCourses } from "@/lib/courses";
import { updateRound } from "@/lib/round-service";
import type { GameMode, ModeConfig, Round } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function HostAdmin({
  round,
  onUpdated,
  onForceMilestone,
}: {
  round: Round;
  onUpdated: () => void;
  onForceMilestone: () => void;
}) {
  const courses = getAllCourses();
  const course = courses.find((c) => c.id === round.course_id);
  const config = (round.mode_config ?? {}) as ModeConfig;

  const patch = async (updates: Parameters<typeof updateRound>[1]) => {
    await updateRound(round.id, updates);
    onUpdated();
  };

  return (
    <Card className="space-y-4">
      <h3 className="font-bold text-white">Host controls</h3>

      <label className="block text-xs text-white/60">Game mode</label>
      <select
        className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white"
        value={round.game_mode}
        onChange={(e) => patch({ game_mode: e.target.value as GameMode })}
      >
        {GAME_MODES.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>

      {round.game_mode === "ryder" && (
        <>
          <label className="block text-xs text-white/60">Ryder format</label>
          <select
            className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white"
            value={config.ryder_format ?? "team_points"}
            onChange={(e) =>
              patch({
                mode_config: {
                  ...config,
                  ryder_format: e.target.value as ModeConfig["ryder_format"],
                },
              })
            }
          >
            {RYDER_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </>
      )}

      {round.game_mode === "wolf" && (
        <>
          <label className="block text-xs text-white/60">Wolf variant</label>
          <select
            className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white"
            value={config.wolf_variant ?? "standard"}
            onChange={(e) =>
              patch({
                mode_config: {
                  ...config,
                  wolf_variant: e.target.value as ModeConfig["wolf_variant"],
                },
              })
            }
          >
            {WOLF_VARIANTS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </>
      )}

      <label className="block text-xs text-white/60">Course</label>
      <select
        className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white"
        value={round.course_id}
        onChange={(e) => patch({ course_id: e.target.value })}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label className="block text-xs text-white/60">Tees</label>
      <select
        className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white"
        value={round.tee_id}
        onChange={(e) => patch({ tee_id: e.target.value })}
      >
        {course?.tees.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} · {t.totalYardage} yds
          </option>
        ))}
      </select>

      <label className="flex items-center gap-3 text-white">
        <input
          type="checkbox"
          checked={round.handicaps_enabled}
          onChange={(e) => patch({ handicaps_enabled: e.target.checked })}
          className="h-5 w-5"
        />
        Handicaps enabled
      </label>

      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={onForceMilestone}>
          Force leaderboard now
        </Button>
        {round.status === "setup" && (
          <Button onClick={() => patch({ status: "active" })}>Start round</Button>
        )}
        {round.status === "active" && (
          <Button variant="danger" onClick={() => patch({ status: "completed" })}>
            End round
          </Button>
        )}
      </div>
    </Card>
  );
}
