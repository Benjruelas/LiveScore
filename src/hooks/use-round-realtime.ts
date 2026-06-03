"use client";

import { useEffect, useCallback, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { Player, Round, RoundEvent, Score, Team } from "@/lib/types";
import { fetchRoundBundle } from "@/lib/round-service";

export function useRoundRealtime(slug: string) {
  const [round, setRound] = useState<Round | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [events, setEvents] = useState<RoundEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    refresh();
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
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `round_id=eq.${round.id}` },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `round_id=eq.${round.id}` },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rounds", filter: `id=eq.${round.id}` },
        () => refresh()
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
          setEvents((prev) => [...prev.slice(-20), ev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [round?.id, refresh]);

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
