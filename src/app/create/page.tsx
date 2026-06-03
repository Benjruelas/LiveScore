"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRound } from "@/lib/round-service";
import { setStoredPlayerId } from "@/lib/storage";
import { GAME_MODES, RYDER_FORMATS, WOLF_VARIANTS } from "@/lib/constants";
import { getAllCourses } from "@/lib/courses";
import type { GameMode, ModeConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function CreateRoundPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [tripName, setTripName] = useState("Bachelor Trip");
  const [hostName, setHostName] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("stroke");
  const [wolfVariant, setWolfVariant] = useState<ModeConfig["wolf_variant"]>("standard");
  const [ryderFormat, setRyderFormat] = useState<ModeConfig["ryder_format"]>("team_points");
  const [courseId, setCourseId] = useState("wolf");
  const [teeId, setTeeId] = useState("yellow");
  const [handicaps, setHandicaps] = useState(false);
  const [loading, setLoading] = useState(false);

  const courses = getAllCourses();
  const course = courses.find((c) => c.id === courseId);

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-emerald-950 p-6 text-white">
        <h1 className="text-xl font-bold">Supabase required</h1>
        <p className="mt-2 text-emerald-100">
          Copy <code className="text-amber-300">.env.local.example</code> to{" "}
          <code className="text-amber-300">.env.local</code> and add your project URL + anon key.
          Run the SQL migration in <code className="text-amber-300">supabase/migrations/</code>.
        </p>
      </div>
    );
  }

  const create = async () => {
    if (!hostName.trim()) return;
    setLoading(true);
    try {
      const modeConfig: ModeConfig = {};
      if (gameMode === "wolf") modeConfig.wolf_variant = wolfVariant;
      if (gameMode === "ryder") modeConfig.ryder_format = ryderFormat;
      if (gameMode === "skins") modeConfig.skins_carry = false;

      const { round, hostPlayer } = await createRound({
        gameMode,
        modeConfig,
        courseId,
        teeId,
        handicapsEnabled: handicaps,
        tripName: tripName.trim(),
        hostName: hostName.trim(),
      });
      setStoredPlayerId(round.slug, hostPlayer.id);
      router.push(`/r/${round.slug}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create round");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 px-4 py-8 text-white">
      <h1 className="text-2xl font-bold">Create round</h1>
      <p className="mt-1 text-sm text-emerald-200">Step {step + 1} of 4</p>

      {step === 0 && (
        <Card className="mt-6 space-y-4">
          <Input
            placeholder="Trip name"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
          />
          <Input
            placeholder="Your name (host)"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />
          <Button className="w-full" onClick={() => hostName.trim() && setStep(1)}>
            Next
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="mt-6 space-y-2">
          {GAME_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setGameMode(m.id)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition",
                gameMode === m.id
                  ? "border-emerald-400 bg-emerald-500/20"
                  : "border-white/10 bg-white/5"
              )}
            >
              <p className="font-bold">{m.label}</p>
              <p className="text-sm text-white/60">{m.description}</p>
            </button>
          ))}
          {gameMode === "wolf" && (
            <select
              className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3"
              value={wolfVariant}
              onChange={(e) =>
                setWolfVariant(e.target.value as ModeConfig["wolf_variant"])
              }
            >
              {WOLF_VARIANTS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          )}
          {gameMode === "ryder" && (
            <select
              className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3"
              value={ryderFormat}
              onChange={(e) =>
                setRyderFormat(e.target.value as ModeConfig["ryder_format"])
              }
            >
              {RYDER_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          )}
          <Button className="mt-4 w-full" onClick={() => setStep(2)}>
            Next
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="mt-6 space-y-4">
          <label className="text-xs text-white/60">Paiute course</label>
          <select
            className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              const c = courses.find((x) => x.id === e.target.value);
              setTeeId(c?.tees[1]?.id ?? c?.tees[0]?.id ?? "yellow");
            }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="text-xs text-white/60">Tees</label>
          <select
            className="min-h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-white"
            value={teeId}
            onChange={(e) => setTeeId(e.target.value)}
          >
            {course?.tees.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.totalYardage} yds
                {t.courseRating ? ` · ${t.courseRating}/${t.slopeRating}` : ""}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={handicaps}
              onChange={(e) => setHandicaps(e.target.checked)}
              className="h-5 w-5"
            />
            Enable handicaps (optional)
          </label>
          <Button className="w-full" onClick={() => setStep(3)}>
            Next
          </Button>
        </Card>
      )}

      {step === 3 && (
        <Card className="mt-6 space-y-4">
          <p className="text-emerald-100">Review</p>
          <ul className="space-y-1 text-sm">
            <li>Trip: {tripName}</li>
            <li>Mode: {GAME_MODES.find((m) => m.id === gameMode)?.label}</li>
            <li>
              Course: {course?.name} · {course?.tees.find((t) => t.id === teeId)?.name}
            </li>
          </ul>
          <Button className="w-full" disabled={loading} onClick={create}>
            {loading ? "Creating…" : "Create & share link"}
          </Button>
        </Card>
      )}

      {step > 0 && (
        <Button variant="ghost" className="mt-4" onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
      )}
    </div>
  );
}
