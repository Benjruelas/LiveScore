import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { roundId, playerId, subscription } = await request.json();
    if (!roundId || !playerId || !subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        round_id: roundId,
        player_id: playerId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: "player_id,endpoint" }
    );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Subscribe failed" },
      { status: 500 }
    );
  }
}
