"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    setLink(`${window.location.origin}/r/${slug}`);
  }, [slug]);

  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    alert("Link copied!");
  };

  return (
    <div className="flex min-h-screen flex-col justify-center gap-6 bg-emerald-950 p-6 text-white">
      <h1 className="text-2xl font-bold">Share round</h1>
      <Card>
        <p className="break-all text-sm text-emerald-100" suppressHydrationWarning>
          {link ?? "Loading…"}
        </p>
      </Card>
      <Button onClick={copy} disabled={!link}>
        Copy join link
      </Button>
      <Button variant="secondary" onClick={() => (window.location.href = `/r/${slug}`)}>
        Back to round
      </Button>
    </div>
  );
}
