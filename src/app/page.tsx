"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLastRoundSlug } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const [lastSlug, setLastSlug] = useState<string | null>(null);

  useEffect(() => {
    setLastSlug(getLastRoundSlug());
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-md flex-1">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Las Vegas Paiute
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">LiveScore</h1>
        <p className="mt-3 text-lg text-emerald-100">
          Real-time scoring for your bachelor trip. Ryder Cup, Wolf, Scramble & more.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link href="/create">
            <Button className="w-full min-h-14 text-lg">Create round</Button>
          </Link>
          {lastSlug && (
            <Link href={`/r/${lastSlug}`}>
              <Button variant="secondary" className="w-full min-h-14">
                Resume last round
              </Button>
            </Link>
          )}
        </div>

        <Card className="mt-10">
          <h2 className="font-bold text-white">How it works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-emerald-100">
            <li>Host creates a round and shares one link</li>
            <li>Everyone joins with their name — no accounts</li>
            <li>Enter scores hole by hole; leaderboard updates live</li>
            <li>Alerts every score + status drop every 3 holes</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
