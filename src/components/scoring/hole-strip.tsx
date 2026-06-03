"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { getHole } from "@/lib/courses";
import { GolfScoreMark } from "@/components/scoring/golf-score-mark";

export function HoleStrip({
  currentHole,
  courseId,
  teeId,
  scores,
  draftStrokes,
  onSelect,
}: {
  currentHole: number;
  courseId: string;
  teeId: string;
  scores: { hole: number; strokes: number }[];
  draftStrokes: number | null;
  onSelect: (hole: number) => void;
}) {
  const scoreByHole = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of scores) m.set(s.hole, s.strokes);
    return m;
  }, [scores]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const holeRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const holeEl = holeRefs.current.get(currentHole);
    if (!container || !holeEl) return;

    const center = () => {
      const targetLeft =
        holeEl.offsetLeft - (container.clientWidth - holeEl.clientWidth) / 2;
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollTo({
        left: Math.max(0, Math.min(targetLeft, maxScroll)),
        behavior: "smooth",
      });
    };

    center();
    requestAnimationFrame(center);
  }, [currentHole]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
    >
      {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => {
        const data = getHole(courseId, teeId, hole);
        const par = data?.par ?? 4;
        const saved = scoreByHole.get(hole);
        const display =
          hole === currentHole && draftStrokes != null ? draftStrokes : saved;
        const active = hole === currentHole;
        const done = saved != null;

        return (
          <button
            key={hole}
            ref={(node) => {
              if (node) holeRefs.current.set(hole, node);
              else holeRefs.current.delete(hole);
            }}
            type="button"
            onClick={() => onSelect(hole)}
            className={cn(
              "flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition",
              active
                ? "border-emerald-400 bg-emerald-500/30"
                : done
                  ? "border-emerald-700/50 bg-emerald-900/40"
                  : "border-white/10 bg-white/5"
            )}
          >
            <span className="text-lg font-bold leading-none text-white">{hole}</span>
            <span className="mt-0.5 text-[9px] tabular-nums text-white/55">
              {data?.yardage ?? "—"} yds
            </span>
            <span className="text-[9px] text-white/45">HCP {data?.strokeIndex ?? "—"}</span>
            <span className="text-[9px] text-white/45">Par {par}</span>
            <span
              className={cn(
                "mt-1 flex min-h-[2.25rem] w-full flex-col items-center justify-center rounded-md border px-0.5",
                display != null
                  ? "border-emerald-600/40 bg-emerald-950/50"
                  : "border-dashed border-white/20 bg-white/5"
              )}
            >
              {display != null ? (
                <GolfScoreMark strokes={display} par={par} size="xs" />
              ) : (
                <span className="text-[10px] text-white/25">—</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
