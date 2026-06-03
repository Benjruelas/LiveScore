"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function HandicapEditor({
  players,
  enabled,
  onUpdated,
}: {
  players: Player[];
  enabled: boolean;
  onUpdated: () => void;
}) {
  if (!enabled) return null;

  const update = async (playerId: string, value: string) => {
    const supabase = getSupabase();
    const num = value === "" ? null : parseFloat(value);
    await supabase
      .from("players")
      .update({ handicap_index: num })
      .eq("id", playerId);
    onUpdated();
  };

  return (
    <Card>
      <p className="text-xs font-semibold uppercase text-white/50">Handicap index</p>
      <ul className="mt-2 space-y-2">
        {players
          .filter((p) => p.is_active)
          .map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <span className="text-sm text-white">{p.display_name}</span>
              <Input
                type="number"
                step="0.1"
                className="max-w-[5rem] py-2 text-center"
                placeholder="—"
                defaultValue={p.handicap_index ?? ""}
                onBlur={(e) => update(p.id, e.target.value)}
              />
            </li>
          ))}
      </ul>
    </Card>
  );
}
