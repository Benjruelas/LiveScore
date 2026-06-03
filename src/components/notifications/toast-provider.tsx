"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  message: string;
  type?: "info" | "milestone";
}

const ToastContext = createContext<{
  toasts: Toast[];
  push: (message: string, type?: Toast["type"]) => void;
  dismiss: (id: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex flex-col gap-2 p-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
              t.type === "milestone"
                ? "bg-amber-500 text-amber-950"
                : "bg-emerald-600 text-white"
            )}
            onClick={() => dismiss(t.id)}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requires ToastProvider");
  return ctx;
}
