"use client";

import { useEffect, useState } from "react";
import { dismissPushPrompt, wasPushPromptDismissed } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushPrompt({
  roundId,
  playerId,
  slug,
}: {
  roundId: string;
  playerId: string;
  slug: string;
}) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (wasPushPromptDismissed(slug)) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "granted") return;
    setVisible(true);
  }, [slug]);

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const res = await fetch("/api/push/vapid");
      const { publicKey } = await res.json();
      if (!publicKey) {
        setStatus("Push not configured on server");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId,
          playerId,
          subscription: json,
        }),
      });
      setStatus("Notifications enabled!");
      setVisible(false);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not enable push");
    }
  };

  const enable = async () => {
    const perm = await Notification.requestPermission();
    if (perm === "granted") await subscribe();
    else setStatus("Permission denied — try Add to Home Screen on iOS");
  };

  if (!visible) return status ? <p className="text-xs text-emerald-300 p-2">{status}</p> : null;

  return (
    <Card className="mx-4 mb-4 border-emerald-400/30">
      <p className="text-sm font-medium text-white">Get score alerts</p>
      <p className="mt-1 text-xs text-white/60">
        Enable push for live updates. On iPhone: Add to Home Screen first.
      </p>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={enable}>
          Enable
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => {
            dismissPushPrompt(slug);
            setVisible(false);
          }}
        >
          Later
        </Button>
      </div>
      {status && <p className="mt-2 text-xs text-amber-300">{status}</p>}
    </Card>
  );
}
