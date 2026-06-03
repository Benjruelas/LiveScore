"use client";

import { useEffect, useMemo, useState } from "react";
import { useRoundRealtime } from "@/hooks/use-round-realtime";
import { getStoredPlayerId, setStoredPlayerId } from "@/lib/storage";
import { joinRound, upsertScore, deleteScore } from "@/lib/round-service";
import { getHolePar } from "@/lib/courses";
import { enqueueScore, getQueue, removeFromQueue } from "@/lib/offline/queue";
import { HoleStrip } from "@/components/scoring/hole-strip";
import { ScoreKeypad } from "@/components/scoring/score-keypad";
import { LeaderboardPanel } from "@/components/round/leaderboard-panel";
import { TeamBuilder } from "@/components/teams/team-builder";
import { HostAdmin } from "@/components/admin/host-admin";
import { RulesSheet } from "@/components/rules/rules-sheet";
import { MilestoneCard } from "@/components/notifications/milestone-card";
import { useToast } from "@/components/notifications/toast-provider";
import { PushPrompt } from "@/components/notifications/push-prompt";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LeaderboardResult, Player, Score } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GAME_MODES } from "@/lib/constants";
import { HandicapEditor } from "@/components/players/handicap-editor";

type Tab = "score" | "leaderboard" | "teams" | "admin";

export function RoundApp({ slug }: { slug: string }) {
  const { round, players, teams, scores, events, loading, error, online, refresh, setScores } =
    useRoundRealtime(slug);
  const { push: toast } = useToast();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState("");
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState<Tab>("score");
  const [hole, setHole] = useState(1);
  const [strokes, setStrokes] = useState<number | null>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<string | null>(null);
  const [contributorId, setContributorId] = useState<string | null>(null);
  const [wolfPoints, setWolfPoints] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [milestone, setMilestone] = useState<{
    hole: number;
    leaderboard: LeaderboardResult;
  } | null>(null);

  const me = players.find((p) => p.id === playerId);
  const isHost = me?.is_host ?? false;
  const teamMode = round?.game_mode === "scramble";
  const playerMode = !["scramble"].includes(round?.game_mode ?? "");

  useEffect(() => {
    const stored = getStoredPlayerId(slug);
    if (stored) setPlayerId(stored);
  }, [slug]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#rules") {
      setShowRules(true);
    }
  }, []);

  useEffect(() => {
    for (const ev of events) {
      if (ev.event_type === "score_updated") {
        const msg = (ev.payload as { message?: string }).message;
        const by = (ev.payload as { enteredByPlayerId?: string }).enteredByPlayerId;
        if (msg && by !== playerId) toast(msg);
      }
      if (ev.event_type === "leaderboard_milestone") {
        const payload = ev.payload as {
          hole?: number;
          leaderboard?: LeaderboardResult;
        };
        if (payload.leaderboard && payload.hole) {
          setMilestone({ hole: payload.hole, leaderboard: payload.leaderboard });
          toast(`Leaderboard update — hole ${payload.hole}`, "milestone");
        }
      }
    }
  }, [events, playerId, toast]);

  useEffect(() => {
    if (!online || !round) return;
    const flush = async () => {
      for (const item of getQueue()) {
        if (item.roundId !== round.id) continue;
        try {
          const p = item.payload as Parameters<typeof upsertScore>[0];
          await upsertScore(p);
          await fetch("/api/rounds/process-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roundId: p.roundId,
              hole: p.hole,
              enteredByPlayerId: p.enteredByPlayerId,
              playerName: item.payload.playerName,
              strokes: p.strokes,
            }),
          });
          removeFromQueue(item.id);
        } catch {
          /* keep in queue */
        }
      }
      refresh();
    };
    flush();
  }, [online, round, refresh]);

  const scoredHoles = useMemo(() => {
    const set = new Set<number>();
    if (!round) return set;
    if (teamMode) {
      scores.filter((s) => s.team_id).forEach((s) => set.add(s.hole));
    } else {
      scores.filter((s) => s.player_id).forEach((s) => set.add(s.hole));
    }
    return set;
  }, [scores, round, teamMode]);

  const suggestedHole = useMemo(() => {
    for (let h = 1; h <= 18; h++) {
      if (!scoredHoles.has(h)) return h;
    }
    return 18;
  }, [scoredHoles]);

  useEffect(() => {
    if (!targetPlayerId && players.length) {
      setTargetPlayerId(playerId ?? players[0]?.id ?? null);
    }
    if (!targetTeamId && teams.length) {
      setTargetTeamId(teams[0]?.id ?? null);
    }
  }, [players, teams, playerId, targetPlayerId, targetTeamId]);

  useEffect(() => {
    if (!round) return;
    const existing = teamMode
      ? scores.find((s) => s.team_id === targetTeamId && s.hole === hole)
      : scores.find((s) => s.player_id === targetPlayerId && s.hole === hole);
    setStrokes(existing?.strokes ?? null);
    setWolfPoints(existing?.wolf_points ?? null);
    if (existing?.contributor_player_id) setContributorId(existing.contributor_player_id);
  }, [hole, targetPlayerId, targetTeamId, scores, round, teamMode]);

  const handleJoin = async () => {
    if (!joinName.trim()) return;
    setJoining(true);
    try {
      const p = await joinRound(slug, joinName.trim());
      setStoredPlayerId(slug, p.id);
      setPlayerId(p.id);
      refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Join failed");
    } finally {
      setJoining(false);
    }
  };

  const submitScore = async () => {
    if (!round || strokes == null) return;
    setSubmitting(true);

    const playerLabel =
      players.find((p) => p.id === targetPlayerId)?.display_name ??
      teams.find((t) => t.id === targetTeamId)?.name ??
      "Player";

    const payload = {
      roundId: round.id,
      hole,
      strokes,
      playerId: teamMode ? null : targetPlayerId,
      teamId: teamMode ? targetTeamId : null,
      contributorPlayerId: teamMode ? contributorId : null,
      enteredByPlayerId: playerId,
      wolfPoints: round.game_mode === "wolf" ? wolfPoints : null,
    };

    const optimistic: Score = {
      id: `temp-${Date.now()}`,
      round_id: round.id,
      hole,
      player_id: payload.playerId ?? null,
      team_id: payload.teamId ?? null,
      strokes,
      contributor_player_id: contributorId,
      entered_by_player_id: playerId,
      wolf_points: wolfPoints,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setScores((prev) => {
      const filtered = prev.filter(
        (s) =>
          !(
            s.hole === hole &&
            (teamMode ? s.team_id === targetTeamId : s.player_id === targetPlayerId)
          )
      );
      return [...filtered, optimistic];
    });

    try {
      if (!online) {
        enqueueScore({
          id: crypto.randomUUID(),
          roundId: round.id,
          payload: { ...payload, playerName: playerLabel },
        });
        toast("Saved offline — will sync when connected");
      } else {
        await upsertScore(payload);
        await fetch("/api/rounds/process-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roundId: round.id,
            hole,
            enteredByPlayerId: playerId,
            playerName: playerLabel,
            strokes,
          }),
        });
      }
      const next = hole < 18 ? hole + 1 : hole;
      setHole(next);
      setStrokes(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save");
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const forceMilestone = async () => {
    if (!round) return;
    await fetch("/api/rounds/force-milestone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: round.id }),
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Loading round…
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-white">
        <p>{error ?? "Round not found"}</p>
        <Button onClick={() => (window.location.href = "/")}>Home</Button>
      </div>
    );
  }

  if (!playerId || !me) {
    return (
      <div className="flex min-h-screen flex-col justify-center gap-6 bg-gradient-to-b from-emerald-950 to-emerald-900 p-6">
        <h1 className="text-3xl font-bold text-white">{round.trip_name ?? "LiveScore"}</h1>
        <p className="text-emerald-100">Join the bachelor trip round</p>
        <Input
          placeholder="Your name"
          value={joinName}
          onChange={(e) => setJoinName(e.target.value)}
        />
        <Button disabled={joining} onClick={handleJoin}>
          {joining ? "Joining…" : "Join round"}
        </Button>
      </div>
    );
  }

  if (round.status === "setup" && !isHost) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center text-white">
        <h1 className="text-2xl font-bold">Waiting for host</h1>
        <p className="text-emerald-100">
          {round.trip_name} · {GAME_MODES.find((m) => m.id === round.game_mode)?.label}
        </p>
        <p className="text-sm text-white/60">The host is setting up teams. Hang tight!</p>
        <PushPrompt roundId={round.id} playerId={playerId} slug={slug} />
      </div>
    );
  }

  const par = getHolePar(round.course_id, round.tee_id, hole);
  const modeLabel = GAME_MODES.find((m) => m.id === round.game_mode)?.label;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 pb-24 text-white">
      {!online && (
        <div className="bg-amber-600 px-4 py-2 text-center text-sm font-medium text-amber-950">
          Offline — scores queue locally
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-emerald-950/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-300">{modeLabel}</p>
            <h1 className="text-lg font-bold">{round.trip_name}</h1>
          </div>
          <div className="flex gap-3">
            {isHost && (
              <a
                href={`/r/${slug}/share`}
                className="text-sm text-emerald-300 underline"
              >
                Share
              </a>
            )}
            <button
              type="button"
              className="text-sm text-emerald-300 underline"
              onClick={() => setShowRules(true)}
            >
              Rules
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4">
        {tab === "score" && round.status === "active" && (
          <div className="space-y-4">
            <HoleStrip
              currentHole={hole}
              courseId={round.course_id}
              teeId={round.tee_id}
              scoredHoles={scoredHoles}
              onSelect={setHole}
            />
            <Button variant="ghost" className="text-sm" onClick={() => setHole(suggestedHole)}>
              Suggested: hole {suggestedHole}
            </Button>

            {playerMode && players.length > 1 && (
              <Card>
                <p className="mb-2 text-xs text-white/50">Scoring for</p>
                <div className="flex flex-wrap gap-2">
                  {players
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTargetPlayerId(p.id)}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium",
                          targetPlayerId === p.id
                            ? "bg-emerald-500 text-white"
                            : "bg-white/10"
                        )}
                      >
                        {p.display_name}
                      </button>
                    ))}
                </div>
              </Card>
            )}

            {teamMode && (
              <Card>
                <p className="mb-2 text-xs text-white/50">Team</p>
                <div className="flex flex-wrap gap-2">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTargetTeamId(t.id)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        targetTeamId === t.id ? "bg-emerald-500" : "bg-white/10"
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                {teams.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs text-white/50">Shot counted (optional)</p>
                    <div className="flex flex-wrap gap-2">
                      {players
                        .filter((p) => p.team_id === targetTeamId)
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() =>
                              setContributorId(contributorId === p.id ? null : p.id)
                            }
                            className={cn(
                              "rounded-lg px-2 py-1 text-xs",
                              contributorId === p.id ? "bg-amber-500" : "bg-white/10"
                            )}
                          >
                            {p.display_name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {round.game_mode === "wolf" && (
              <Card>
                <p className="mb-2 text-xs text-white/50">Wolf points this hole</p>
                <div className="flex gap-2">
                  {[-2, -1, 0, 1, 2, 3, 4].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setWolfPoints(pt)}
                      className={cn(
                        "min-h-12 flex-1 rounded-lg font-bold",
                        wolfPoints === pt ? "bg-emerald-500" : "bg-white/10"
                      )}
                    >
                      {pt > 0 ? `+${pt}` : pt}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            <ScoreKeypad
              value={strokes}
              par={par}
              onChange={setStrokes}
              onSubmit={submitScore}
              submitting={submitting}
            />

            {isHost && (
              <HostScoreList
                scores={scores}
                players={players}
                onDelete={async (id) => {
                  await deleteScore(id);
                  refresh();
                }}
              />
            )}
          </div>
        )}

        {tab === "score" && round.status === "setup" && isHost && (
          <div className="space-y-4">
            <p className="text-emerald-100">Set up teams, then start the round.</p>
            <TeamBuilder
              roundId={round.id}
              players={players}
              teams={teams}
              onUpdated={refresh}
            />
            <HandicapEditor
              players={players}
              enabled={round.handicaps_enabled}
              onUpdated={refresh}
            />
            <HostAdmin round={round} onUpdated={refresh} onForceMilestone={forceMilestone} />
          </div>
        )}

        {tab === "leaderboard" && (
          <LeaderboardPanel round={round} players={players} teams={teams} scores={scores} />
        )}

        {tab === "teams" && (
          <>
            <TeamBuilder roundId={round.id} players={players} teams={teams} onUpdated={refresh} />
            <HandicapEditor
              players={players}
              enabled={round.handicaps_enabled}
              onUpdated={refresh}
            />
          </>
        )}

        {tab === "admin" && isHost && (
          <HostAdmin round={round} onUpdated={refresh} onForceMilestone={forceMilestone} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-white/10 bg-emerald-950/95 backdrop-blur">
        {(
          [
            ["score", "Score"],
            ["leaderboard", "Board"],
            ...(round.status === "setup" || isHost
              ? [["teams", "Teams"] as const]
              : []),
            ...(isHost ? [["admin", "Host"] as const] : []),
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "min-h-16 flex-1 text-sm font-semibold",
              tab === id ? "text-emerald-400" : "text-white/50"
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {showRules && (
        <RulesSheet
          gameMode={round.game_mode}
          wolfVariant={round.mode_config?.wolf_variant}
          ryderFormat={round.mode_config?.ryder_format}
          onClose={() => setShowRules(false)}
        />
      )}

      {milestone && (
        <MilestoneCard
          hole={milestone.hole}
          leaderboard={milestone.leaderboard}
          onDismiss={() => setMilestone(null)}
        />
      )}

      <PushPrompt roundId={round.id} playerId={playerId} slug={slug} />
    </div>
  );
}

function HostScoreList({
  scores,
  players,
  onDelete,
}: {
  scores: Score[];
  players: Player[];
  onDelete: (id: string) => void;
}) {
  const recent = [...scores].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 8);
  if (!recent.length) return null;
  return (
    <Card>
      <p className="text-xs text-white/50">Recent — tap to undo</p>
      <ul className="mt-2 space-y-1">
        {recent.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="w-full text-left text-sm text-white/80"
              onClick={() => s.id.startsWith("temp") ? undefined : onDelete(s.id)}
            >
              H{s.hole}: {players.find((p) => p.id === s.player_id)?.display_name ?? "Team"}{" "}
              — {s.strokes}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
