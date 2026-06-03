"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { Player, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TeamBuilder({
  roundId,
  players,
  teams,
  onUpdated,
}: {
  roundId: string;
  players: Player[];
  teams: Team[];
  onUpdated: () => void;
}) {
  const [teamName, setTeamName] = useState("");

  const unassigned = players.filter((p) => !p.team_id);

  const addTeam = async () => {
    if (!teamName.trim()) return;
    const supabase = getSupabase();
    await supabase.from("teams").insert({
      round_id: roundId,
      name: teamName.trim(),
      sort_order: teams.length,
    });
    setTeamName("");
    onUpdated();
  };

  const assignPlayer = async (playerId: string, teamId: string | null) => {
    const supabase = getSupabase();
    await supabase.from("players").update({ team_id: teamId }).eq("id", playerId);
    onUpdated();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <Button type="button" onClick={addTeam}>
          Add
        </Button>
      </div>

      {teams.map((team) => {
        const members = players.filter((p) => p.team_id === team.id);
        return (
          <Card key={team.id}>
            <h3 className="font-bold text-white">{team.name}</h3>
            <ul className="mt-2 space-y-1">
              {members.map((m) => (
                <li key={m.id} className="flex justify-between text-sm text-emerald-100">
                  {m.display_name}
                  <button
                    type="button"
                    className="text-white/50"
                    onClick={() => assignPlayer(m.id, null)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              {unassigned.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => assignPlayer(p.id, team.id)}
                  className="rounded-lg bg-emerald-800/50 px-3 py-1 text-sm text-white"
                >
                  + {p.display_name}
                </button>
              ))}
            </div>
          </Card>
        );
      })}

      {unassigned.length > 0 && teams.length === 0 && (
        <p className="text-sm text-white/60">Add teams, then tap players to assign.</p>
      )}

      {unassigned.length > 0 && teams.length > 0 && (
        <Card>
          <p className="text-xs uppercase text-white/50">Unassigned</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unassigned.map((p) => (
              <span key={p.id} className={cn("rounded-lg bg-white/10 px-3 py-1 text-sm")}>
                {p.display_name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
