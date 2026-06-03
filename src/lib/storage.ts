import { STORAGE_KEYS } from "./constants";

export function getStoredPlayerId(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.playerId(slug));
}

export function setStoredPlayerId(slug: string, playerId: string) {
  localStorage.setItem(STORAGE_KEYS.playerId(slug), playerId);
  localStorage.setItem(STORAGE_KEYS.roundSlug, slug);
}

export function getLastRoundSlug(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.roundSlug);
}

export function wasPushPromptDismissed(slug: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.pushDismissed(slug)) === "1";
}

export function dismissPushPrompt(slug: string) {
  localStorage.setItem(STORAGE_KEYS.pushDismissed(slug), "1");
}
