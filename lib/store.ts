// Data layer — now an API client talking to the shared Neon Postgres backend.
// Every phone sees the same live draw. All club rules are enforced server-side.
// (This file previously used localStorage; the function names survived the swap.)

import type { Player } from "./mockData";
import type {
  PlayerPreference,
  AdminOverride,
  DrawResult,
} from "./drawEngine";

export type Entry = {
  playerId: string;
  status: "playing" | "withdrawn";
  playerPreference: PlayerPreference;
  adminOverride: AdminOverride;
  note?: string | null;
  enteredAt: string;
};

/** Player scores for a draw, keyed by player id. */
export type Scores = Record<string, number>;

export type SavedDraw = {
  drawDate: string;
  generatedAt: string;
  result: DrawResult;
  whatsappMessage: string;
  scores?: Scores | null;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// --- Entry window --------------------------------------------------------------

export type WindowInfo = {
  targetDate: string;
  targetLabel: string;
  phase: "open" | "pending" | "closed";
  opensLabel: string;
  closesLabel: string;
  drawLabel: string;
  special: boolean;
  specialDate: string | null;
};

export async function getWindow(): Promise<WindowInfo> {
  return api<WindowInfo>("/api/window");
}

/** Admin: open a special draw for a Sunday or bank holiday. */
export async function openSpecialDraw(date: string): Promise<WindowInfo> {
  return api<WindowInfo>("/api/window", {
    method: "POST",
    body: JSON.stringify({ date }),
  });
}

/** Admin: cancel the special draw. */
export async function cancelSpecialDraw(): Promise<WindowInfo> {
  return api<WindowInfo>("/api/window", { method: "DELETE" });
}

// --- Players -----------------------------------------------------------------

export async function getPlayers(): Promise<Player[]> {
  return api<Player[]>("/api/players");
}

export async function addPlayer(name: string): Promise<Player> {
  return api<Player>("/api/players", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updatePlayer(
  id: string,
  patch: { name?: string; handicap?: number | null }
): Promise<void> {
  await api("/api/players", {
    method: "PATCH",
    body: JSON.stringify({ id, ...patch }),
  });
}

export async function removePlayer(id: string): Promise<void> {
  await api(`/api/players?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Entries -----------------------------------------------------------------

export async function getEntries(): Promise<Entry[]> {
  return api<Entry[]>("/api/entries");
}

export async function enterDraw(
  playerId: string,
  preference: PlayerPreference,
  source: "player" | "admin" = "player"
): Promise<void> {
  await api("/api/entries", {
    method: "POST",
    body: JSON.stringify({ playerId, preference, source }),
  });
}

export async function updateEntry(
  playerId: string,
  patch: {
    preference?: PlayerPreference;
    override?: AdminOverride;
    note?: string;
    status?: string;
  }
): Promise<void> {
  await api("/api/entries", {
    method: "PATCH",
    body: JSON.stringify({ playerId, ...patch }),
  });
}

export async function withdrawEntry(
  playerId: string,
  source: "player" | "admin" = "player"
): Promise<void> {
  await api(
    `/api/entries?playerId=${encodeURIComponent(playerId)}&source=${source}`,
    { method: "DELETE" }
  );
}

/** Admin: clear all entries ready for a new week. */
export async function clearAllEntries(): Promise<void> {
  await api("/api/entries?all=true&source=admin", { method: "DELETE" });
}

// --- Draw --------------------------------------------------------------------

export async function generateDraw(): Promise<SavedDraw> {
  return api<SavedDraw>("/api/draw", {
    method: "POST",
    body: JSON.stringify({ action: "generate" }),
  });
}

export async function getDrawState(): Promise<{
  current: SavedDraw | null;
  history: SavedDraw[];
}> {
  return api("/api/draw");
}

export async function getCurrentDraw(): Promise<SavedDraw | null> {
  return (await getDrawState()).current;
}

export async function getDrawHistory(): Promise<SavedDraw[]> {
  return (await getDrawState()).history;
}

// --- Scores ------------------------------------------------------------------

export async function saveScores(
  drawDate: string,
  scores: Scores
): Promise<void> {
  await api("/api/scores", {
    method: "POST",
    body: JSON.stringify({ drawDate, scores }),
  });
}
