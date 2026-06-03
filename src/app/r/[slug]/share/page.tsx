"use client";

import { use, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const link = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/r/${slug}`;
  }, [slug]);

  const copy = () => {
    navigator.clipboard.writeText(link);
    alert("Link copied!");
  };

  return (
    <div className="flex min-h-screen flex-col justify-center gap-6 bg-emerald-950 p-6 text-white">
      <h1 className="text-2xl font-bold">Share round</h1>
      <Card>
        <p className="break-all text-sm text-emerald-100">{link || "Loading…"}</p>
      </Card>
      <Button onClick={copy}>Copy join link</Button>
      <Button variant="secondary" onClick={() => (window.location.href = `/r/${slug}`)}>
        Back to round
      </Button>
    </div>
  );
}
