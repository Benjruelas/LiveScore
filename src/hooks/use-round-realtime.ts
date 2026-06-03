"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { Player, Round, RoundEvent, Score, Team } from "@/lib/types";
import { fetchRoundBundle } from "@/lib/round-service";

function mergeScoreRow(prev: Score[], row: Score): Score[] {
  const filtered = prev.filter((s) => {
    if (row.team_id) {
      return !(s.hole === row.hole && s.team_id === row.team_id);
    }
    return !(s.hole === row.hole && s.player_id === row.player_id);
  });
  return [...filtered, row].sort((a, b) => a.hole - b.hole);
}

export function useRoundRealtime(slug: string) {
  const [round, setRound] = useState<Round | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [events, setEvents] = useState<RoundEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const bundle = await fetchRoundBundle(slug);
      setRound(bundle.round);
      setPlayers(bundle.players);
      setTeams(bundle.teams);
      setScores(bundle.scores);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      refresh();
    }, 150);
  }, [refresh]);

  useEffect(() => {
    refresh();
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      refresh();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  useEffect(() => {
    if (!round?.id) return;
    const supabase = getSupabase();

    const channel = supabase
      .channel(`round:${round.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores", filter: `round_id=eq.${round.id}` },
        (payload) => {
          if (payload.eventType === "DELETE" && payload.old) {
            const old = payload.old as Score;
            setScores((prev) =>
              prev.filter((s) => {
                if (old.team_id) {
                  return !(s.hole === old.hole && s.team_id === old.team_id);
                }
                return !(s.hole === old.hole && s.player_id === old.player_id);
              })
            );
            return;
          }
          if (payload.new) {
            setScores((prev) => mergeScoreRow(prev, payload.new as Score));
          }
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `round_id=eq.${round.id}` },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `round_id=eq.${round.id}` },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rounds", filter: `id=eq.${round.id}` },
        () => scheduleRefresh()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "round_events",
          filter: `round_id=eq.${round.id}`,
        },
        (payload) => {
          const ev = payload.new as RoundEvent;
          setEvents((prev) => {
            if (prev.some((e) => e.id === ev.id)) return prev;
            return [...prev.slice(-30), ev];
          });
          if (
            ev.event_type === "score_updated" ||
            ev.event_type === "leaderboard_milestone"
          ) {
            scheduleRefresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [round?.id, scheduleRefresh]);

  return {
    round,
    players,
    teams,
    scores,
    events,
    loading,
    error,
    online,
    refresh,
    setScores,
  };
}
