"use client";

import { cn } from "@/lib/utils";
import { getScoreColorClass, getScoreMarkVariant } from "@/lib/scoring/score-labels";

/** Fixed square boxes so circles stay round and squares stay square */
const sizeStyles = {
  xs: {
    label: "text-[9px]",
    num: "text-xs font-bold leading-none",
    box: "size-6",
    inner: "size-[1.125rem]",
  },
  sm: {
    label: "text-[10px]",
    num: "text-sm font-bold leading-none",
    box: "size-8",
    inner: "size-6",
  },
  md: {
    label: "text-xs",
    num: "text-base font-bold leading-none",
    box: "size-9",
    inner: "size-7",
  },
  lg: {
    label: "text-sm",
    num: "text-2xl font-bold leading-none",
    box: "size-14",
    inner: "size-11",
  },
} as const;

function NumberCell({
  strokes,
  className,
}: {
  strokes: number;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center justify-center tabular-nums", className)}>
      {strokes}
    </span>
  );
}

function MarkedNumber({
  strokes,
  par,
  size,
}: {
  strokes: number;
  par: number;
  size: keyof typeof sizeStyles;
}) {
  const variant = getScoreMarkVariant(strokes, par);
  const colorClass = getScoreColorClass(strokes, par);
  const s = sizeStyles[size];
  const center = "flex shrink-0 items-center justify-center box-border";

  if (variant === "none") {
    return (
      <span className={cn(center, s.box, colorClass)}>
        <NumberCell strokes={strokes} className={s.num} />
      </span>
    );
  }

  if (variant === "circle") {
    return (
      <span
        className={cn(center, s.box, "rounded-full border-2 border-current", colorClass)}
      >
        <NumberCell strokes={strokes} className={s.num} />
      </span>
    );
  }

  if (variant === "double-circle") {
    return (
      <span
        className={cn(center, s.box, "rounded-full border-2 border-current", colorClass)}
      >
        <span
          className={cn(
            center,
            s.inner,
            "rounded-full border border-current"
          )}
        >
          <NumberCell strokes={strokes} className={s.num} />
        </span>
      </span>
    );
  }

  if (variant === "square") {
    return (
      <span className={cn(center, s.box, "border-2 border-current", colorClass)}>
        <NumberCell strokes={strokes} className={s.num} />
      </span>
    );
  }

  return (
    <span className={cn(center, s.box, "border-2 border-current", colorClass)}>
      <span className={cn(center, s.inner, "border border-current")}>
        <NumberCell strokes={strokes} className={s.num} />
      </span>
    </span>
  );
}

/** Marked stroke count; optional label sits outside the circle/square (for keypad selection). */
export function GolfScoreMark({
  strokes,
  par,
  label,
  size = "sm",
  className,
}: {
  strokes: number;
  par: number;
  /** Golf term shown above the number — use only on score selection UI */
  label?: string;
  size?: keyof typeof sizeStyles;
  className?: string;
}) {
  const s = sizeStyles[size];

  if (!label) {
    return (
      <span className={cn("inline-flex", className)}>
        <MarkedNumber strokes={strokes} par={par} size={size} />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-col items-center gap-1 leading-none", className)}>
      <span className={cn("font-semibold text-white/80", s.label)}>{label}</span>
      <MarkedNumber strokes={strokes} par={par} size={size} />
    </span>
  );
}
