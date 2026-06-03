/** Golf score name relative to par; optional numeric strokes shown separately in UI */
export function strokesToGolfLabel(strokes: number, par: number): string {
  if (strokes === 1 && par > 1) return "Hole in one";
  const diff = strokes - par;
  if (diff <= -3) return "Albatross";
  if (diff === -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double";
  if (diff === 3) return "Triple";
  if (diff === 4) return "Quad";
  return `+${diff}`;
}

/** Keypad options from eagle-or-better through triple bogey (min stroke 1) */
export function scoreKeyOptions(par: number): number[] {
  const min = Math.max(1, par - 2);
  const max = par + 3;
  const opts: number[] = [];
  for (let s = min; s <= max; s++) opts.push(s);
  return opts;
}

export function formatScoreCell(strokes: number, par: number): { label: string; strokes: number } {
  return { label: strokesToGolfLabel(strokes, par), strokes };
}

/** Standard scorecard shapes: circle(s) under par, square(s) over par */
export type ScoreMarkVariant = "none" | "circle" | "double-circle" | "square" | "double-square";

export function scoreVsPar(strokes: number, par: number): number {
  return strokes - par;
}

export function getScoreMarkVariant(strokes: number, par: number): ScoreMarkVariant {
  const diff = scoreVsPar(strokes, par);
  if (diff <= -2) return "double-circle";
  if (diff === -1) return "circle";
  if (diff === 0) return "none";
  if (diff === 1) return "square";
  return "double-square";
}

export function getScoreColorClass(strokes: number, par: number): string {
  const diff = scoreVsPar(strokes, par);
  if (diff < 0) return "text-amber-300";
  if (diff > 0) return "text-red-400";
  return "text-white";
}
