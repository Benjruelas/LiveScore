export interface QueuedScore {
  id: string;
  roundId: string;
  payload: Record<string, unknown>;
  retries: number;
  createdAt: number;
}

const QUEUE_KEY = "livescore:offlineQueue";

function load(): QueuedScore[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(items: QueuedScore[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function enqueueScore(item: Omit<QueuedScore, "retries" | "createdAt">) {
  const q = load();
  q.push({ ...item, retries: 0, createdAt: Date.now() });
  save(q);
}

export function getQueue(): QueuedScore[] {
  return load();
}

export function removeFromQueue(id: string) {
  save(load().filter((x) => x.id !== id));
}

export function markRetry(id: string) {
  const q = load();
  const item = q.find((x) => x.id === id);
  if (item) item.retries += 1;
  save(q);
}
