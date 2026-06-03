"use client";

import { cn } from "@/lib/utils";
import { getHolePar } from "@/lib/courses";

export function HoleStrip({
  currentHole,
  courseId,
  teeId,
  scoredHoles,
  onSelect,
}: {
  currentHole: number;
  courseId: string;
  teeId: string;
  scoredHoles: Set<number>;
  onSelect: (hole: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => {
        const par = getHolePar(courseId, teeId, hole);
        const done = scoredHoles.has(hole);
        const active = hole === currentHole;
        return (
          <button
            key={hole}
            type="button"
            onClick={() => onSelect(hole)}
            className={cn(
              "flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition",
              active
                ? "border-emerald-400 bg-emerald-500/30"
                : done
                  ? "border-emerald-700/50 bg-emerald-900/40"
                  : "border-white/10 bg-white/5"
            )}
          >
            <span className="text-lg font-bold text-white">{hole}</span>
            <span className="text-[10px] text-white/50">Par {par}</span>
          </button>
        );
      })}
    </div>
  );
}
