import paiuteData from "@/data/courses/paiute.json";
import type { CourseData, HoleData, TeeData } from "./types";

const courses = paiuteData as CourseData[];

export function getAllCourses(): CourseData[] {
  return courses;
}

export function getCourse(courseId: string): CourseData | undefined {
  return courses.find((c) => c.id === courseId);
}

export function getTee(courseId: string, teeId: string): TeeData | undefined {
  return getCourse(courseId)?.tees.find((t) => t.id === teeId);
}

export function getHole(courseId: string, teeId: string, hole: number): HoleData | undefined {
  return getTee(courseId, teeId)?.holes.find((h) => h.hole === hole);
}

export function getHolePar(courseId: string, teeId: string, hole: number): number {
  return getHole(courseId, teeId, hole)?.par ?? 4;
}

export function getTeeHoles(courseId: string, teeId: string): HoleData[] {
  return getTee(courseId, teeId)?.holes ?? [];
}

export function courseHandicapStrokes(
  handicapIndex: number,
  slopeRating: number,
  strokeIndexes: number[],
  holesPlayed: number[] = Array.from({ length: 18 }, (_, i) => i + 1)
): Map<number, number> {
  const courseHandicap = Math.round((handicapIndex * slopeRating) / 113);
  const strokes = new Map<number, number>();
  const sorted = [...strokeIndexes].sort((a, b) => a - b);
  for (let i = 0; i < courseHandicap; i++) {
    const si = sorted[i % sorted.length];
    const hole = strokeIndexes.indexOf(si) + 1;
    if (holesPlayed.includes(hole)) {
      strokes.set(hole, (strokes.get(hole) ?? 0) + 1);
    }
  }
  return strokes;
}
