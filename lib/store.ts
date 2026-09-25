// Mock data store — localStorage-backed for the MVP.
// All access goes through this module so it can be swapped for Supabase later
// without touching the UI components.

import { DEFAULT_PLAYERS, type Player } from "./mockData";
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
  note?: string;
  enteredAt: string;
};

/** Player scores for a draw, keyed by player id. */
export type Scores = Record<string, number>;

export type SavedDraw = {
  drawDate: string;
  generatedAt: string;
  result: DrawResult;
  whatsappMessage: string;
  scores?: Scores;
};

const KEYS = {
  players: "bcd_players",
  entries: "bcd_entries",
  draw: "bcd_current_draw",
  history: "bcd_draw_history",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// --- Players -----------------------------------------------------------------
// The player list is editable. It is seeded from the WhatsApp group member
// list on first load, then lives in the store.

export function getPlayers(): Player[] {
  if (typeof window === "undefined") return DEFAULT_PLAYERS;
  const stored = read<Player[] | null>(KEYS.players, null);
  if (stored === null) {
    write(KEYS.players, DEFAULT_PLAYERS);
    return DEFAULT_PLAYERS;
  }
  return stored;
}

export function addPlayer(name: string): Player | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const players = getPlayers();
  if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    return null; // duplicate name
  }
  const player: Player = {
    id: `player-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: trimmed,
    active: true,
  };
  write(KEYS.players, [...players, player]);
  return player;
}

export function renamePlayer(playerId: string, newName: string): boolean {
  const trimmed = newName.trim();
  if (!trimmed) return false;
  const players = getPlayers();
  if (
    players.some(
      (p) =>
        p.id !== playerId && p.name.toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    return false; // duplicate name
  }
  write(
    KEYS.players,
    players.map((p) => (p.id === playerId ? { ...p, name: trimmed } : p))
  );
  return true;
}

export function setPlayerHandicap(
  playerId: string,
  handicap: number | null
): void {
  write(
    KEYS.players,
    getPlayers().map((p) => (p.id === playerId ? { ...p, handicap } : p))
  );
}

export function removePlayer(playerId: string): void {
  write(
    KEYS.players,
    getPlayers().filter((p) => p.id !== playerId)
  );
  // Also remove any entry they have in the current draw
  removeEntry(playerId);
}

// --- Entries -----------------------------------------------------------------

export function getEntries(): Entry[] {
  return read<Entry[]>(KEYS.entries, []);
}

export function getConfirmedEntries(): Entry[] {
  return getEntries().filter((e) => e.status === "playing");
}

export function upsertEntry(entry: Entry): void {
  const entries = getEntries().filter((e) => e.playerId !== entry.playerId);
  entries.push(entry);
  write(KEYS.entries, entries);
}

export function withdrawEntry(playerId: string): void {
  const entries = getEntries().map((e) =>
    e.playerId === playerId ? { ...e, status: "withdrawn" as const } : e
  );
  write(KEYS.entries, entries);
}

export function removeEntry(playerId: string): void {
  write(
    KEYS.entries,
    getEntries().filter((e) => e.playerId !== playerId)
  );
}

export function clearEntries(): void {
  write(KEYS.entries, []);
}

// --- Current draw --------------------------------------------------------------

export function getCurrentDraw(): SavedDraw | null {
  return read<SavedDraw | null>(KEYS.draw, null);
}

export function setCurrentDraw(draw: SavedDraw | null): void {
  write(KEYS.draw, draw);
}

// --- History ---------------------------------------------------------------------

export function getDrawHistory(): SavedDraw[] {
  return read<SavedDraw[]>(KEYS.history, []);
}

export function saveDrawToHistory(draw: SavedDraw): void {
  const history = getDrawHistory().filter(
    (d) => d.drawDate !== draw.drawDate
  );
  history.unshift(draw);
  write(KEYS.history, history.slice(0, 52));
}

// --- Scores ------------------------------------------------------------------

/**
 * Save final scores for a draw (matched by drawDate).
 * Updates both the current draw and the history record so results are kept.
 */
export function saveScores(drawDate: string, scores: Scores): void {
  const current = getCurrentDraw();
  if (current && current.drawDate === drawDate) {
    const updated = { ...current, scores };
    setCurrentDraw(updated);
    saveDrawToHistory(updated);
    return;
  }
  const history = getDrawHistory().map((d) =>
    d.drawDate === drawDate ? { ...d, scores } : d
  );
  write(KEYS.history, history);
}
