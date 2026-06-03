"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRoundRealtime } from "@/hooks/use-round-realtime";
import { getStoredPlayerId, setStoredPlayerId } from "@/lib/storage";
import { joinRound, upsertScore, deleteScore, ScorePermissionError } from "@/lib/round-service";
import { getHolePar } from "@/lib/courses";
import { enqueueScore, getQueue, removeFromQueue } from "@/lib/offline/queue";
import { HoleStrip } from "@/components/scoring/hole-strip";
import { ScoreKeypad } from "@/components/scoring/score-keypad";
import { TeamHoleScores } from "@/components/scoring/team-hole-scores";
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
  /** Blocks realtime from overwriting keypad; ref updates synchronously on tap */
  const scoreDirtyRef = useRef(false);
  const [showRules, setShowRules] = useState(false);
  const [milestone, setMilestone] = useState<{
    hole: number;
    leaderboard: LeaderboardResult;
  } | null>(null);

  const me = players.find((p) => p.id === playerId);
  const isHost = me?.is_host ?? false;
  const teamMode = round?.game_mode === "scramble";
  const myTeamId = me?.team_id ?? null;
  const myTeam = teams.find((t) => t.id === myTeamId);
  const canPostScore = teamMode ? !!myTeamId : !!playerId;

  useEffect(() => {
    const stored = getStoredPlayerId(slug);
    if (stored) setPlayerId(stored);
  }, [slug]);

  useEffect(() => {
    if (round?.status === "active") wasActiveRef.current = true;
    if (round?.status === "completed") {
      setTab("leaderboard");
      if (wasActiveRef.current) {
        toast("Round complete — check Results!", "milestone");
        wasActiveRef.current = false;
      }
    }
  }, [round?.status, toast]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#rules") {
      setShowRules(true);
    }
  }, []);

  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const wasActiveRef = useRef(false);

  useEffect(() => {
    for (const ev of events) {
      if (seenEventIdsRef.current.has(ev.id)) continue;
      seenEventIdsRef.current.add(ev.id);

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

  const stripScores = useMemo(() => {
    if (teamMode) {
      return scores.filter((s) => s.team_id === targetTeamId);
    }
    return scores.filter((s) => s.player_id === targetPlayerId);
  }, [scores, teamMode, targetTeamId, targetPlayerId]);

  const scoredHoles = useMemo(() => {
    const set = new Set<number>();
    stripScores.forEach((s) => set.add(s.hole));
    return set;
  }, [stripScores]);

  const suggestedHole = useMemo(() => {
    for (let h = 1; h <= 18; h++) {
      if (!scoredHoles.has(h)) return h;
    }
    return 18;
  }, [scoredHoles]);

  useEffect(() => {
    if (playerId) setTargetPlayerId(playerId);
  }, [playerId]);

  useEffect(() => {
    if (teamMode && myTeamId) setTargetTeamId(myTeamId);
  }, [teamMode, myTeamId]);

  const loadSavedScoreForSelection = () => {
    const existing = teamMode
      ? scores.find((s) => s.team_id === targetTeamId && s.hole === hole)
      : scores.find((s) => s.player_id === targetPlayerId && s.hole === hole);
    setStrokes(existing?.strokes ?? null);
    setWolfPoints(existing?.wolf_points ?? null);
    setContributorId(existing?.contributor_player_id ?? null);
  };

  const selectHole = (h: number) => {
    scoreDirtyRef.current = false;
    setHole(h);
  };

  const markScoreDirty = () => {
    scoreDirtyRef.current = true;
  };

  const setScoreDraft = (n: number) => {
    markScoreDirty();
    setStrokes(n);
  };

  // Only reload keypad when hole / player / team / round id changes — NOT on every realtime refresh
  useEffect(() => {
    if (!round?.id) return;
    if (scoreDirtyRef.current) return;
    loadSavedScoreForSelection();
    // scores read from render; intentionally omit scores + round object from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hole, targetPlayerId, targetTeamId, teamMode, round?.id]);

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
    if (!round || strokes == null || !canPostScore) return;
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
        await refresh();
      }
      const next = hole < 18 ? hole + 1 : hole;
      scoreDirtyRef.current = false;
      setHole(next);
      setStrokes(null);
    } catch (e) {
      toast(
        e instanceof ScorePermissionError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to save"
      );
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
            <div className="sticky top-[4.25rem] z-30 -mx-4 border-b border-white/10 bg-emerald-950/95 px-4 py-2 backdrop-blur-md">
              <HoleStrip
                currentHole={hole}
                courseId={round.course_id}
                teeId={round.tee_id}
                scores={stripScores}
                draftStrokes={strokes}
                onSelect={selectHole}
              />
              <Button
                variant="ghost"
                className="mt-1 h-8 w-full text-xs"
                onClick={() => selectHole(suggestedHole)}
              >
                Suggested: hole {suggestedHole}
              </Button>
            </div>

            <Card>
              <p className="text-xs text-white/50">Scoring for</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {teamMode
                  ? (myTeam?.name ?? "No team assigned")
                  : (me?.display_name ?? "—")}
              </p>
              {teamMode && !myTeamId && (
                <p className="mt-2 text-sm text-amber-200">
                  Ask the host to add you to a team before entering scores.
                </p>
              )}
            </Card>

            {teamMode && myTeamId && (
              <Card>
                <p className="mb-2 text-xs text-white/50">Shot counted (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {players
                    .filter((p) => p.is_active && p.team_id === myTeamId)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          markScoreDirty();
                          setContributorId(contributorId === p.id ? null : p.id);
                        }}
                        className={cn(
                          "rounded-lg px-2 py-1 text-xs",
                          contributorId === p.id ? "bg-amber-500" : "bg-white/10"
                        )}
                      >
                        {p.display_name}
                      </button>
                    ))}
                </div>
              </Card>
            )}

            {teams.length > 0 && (
              <TeamHoleScores
                teams={teams}
                players={players}
                scores={scores}
                hole={hole}
                courseId={round.course_id}
                teeId={round.tee_id}
                scramble={teamMode}
                highlightTeamId={myTeamId}
              />
            )}

            {round.game_mode === "wolf" && (
              <Card>
                <p className="mb-2 text-xs text-white/50">Wolf points this hole</p>
                <div className="flex gap-2">
                  {[-2, -1, 0, 1, 2, 3, 4].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => {
                        markScoreDirty();
                        setWolfPoints(pt);
                      }}
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
              onChange={setScoreDraft}
              onSubmit={submitScore}
              submitting={submitting}
              disabled={!canPostScore}
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
          <LeaderboardPanel
            round={round}
            players={players}
            teams={teams}
            scores={scores}
            playerId={playerId}
          />
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
            ...(round.status === "active" ? [["score", "Score"] as const] : []),
            ["leaderboard", round.status === "completed" ? "Results" : "Board"],
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
              H{s.hole}: {players.find((p) => p.id === s.player_id)?.display_name ?? "Team"} —{" "}
              {s.strokes}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
