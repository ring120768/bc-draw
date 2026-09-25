"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import RulesCard from "@/components/RulesCard";
import {
  getPlayers,
  getEntries,
  enterDraw,
  updateEntry,
  withdrawEntry,
  clearAllEntries,
  generateDraw,
  type Entry,
} from "@/lib/store";
import type {
  PlayerPreference,
  AdminOverride,
} from "@/lib/drawEngine";
import {
  getCurrentDrawWindow,
  formatDrawDate,
} from "@/lib/timeWindow";
import type { Player } from "@/lib/mockData";

const PREFERENCE_LABELS: Record<PlayerPreference, string> = {
  none: "None",
  prefer_early: "Prefer early",
  prefer_late: "Prefer late",
};

const OVERRIDE_LABELS: Record<AdminOverride, string> = {
  none: "None",
  must_first: "Must be first group",
  must_last: "Must be last group",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);

  const window = getCurrentDrawWindow();

  const refresh = async () => {
    const [pl, en] = await Promise.all([getPlayers(), getEntries()]);
    setPlayers(pl);
    setEntries(en);
  };

  useEffect(() => {
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const confirmed = useMemo(
    () => entries.filter((e) => e.status === "playing"),
    [entries]
  );

  const playerName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? "Unknown";

  const playerHandicap = (id: string): number | null => {
    const h = players.find((p) => p.id === id)?.handicap;
    return h === undefined ? null : h;
  };

  const notEntered = players.filter(
    (p) => !confirmed.some((e) => e.playerId === p.id)
  );

  // --- Conflict detection (live, before generation) ---
  const mustFirstCount = confirmed.filter(
    (e) => e.adminOverride === "must_first"
  ).length;
  const mustLastCount = confirmed.filter(
    (e) => e.adminOverride === "must_last"
  ).length;
  const conflicts: string[] = [];
  if (mustFirstCount > 4)
    conflicts.push(
      `${mustFirstCount} players are marked “Must be first group”. Maximum group size is 4. Please change one player to Prefer early or remove the override.`
    );
  if (mustLastCount > 4)
    conflicts.push(
      `${mustLastCount} players are marked “Must be last group”. Maximum group size is 4. Please change one player to Prefer late or remove the override.`
    );
  if (confirmed.length === 5)
    conflicts.push(
      "5 players cannot make a clean 3/4-ball draw. Add or remove a player, or accept a 2-ball."
    );
  if (confirmed.length > 0 && confirmed.length < 3)
    conflicts.push("At least 3 players are needed for a draw.");

  const canGenerate = confirmed.length >= 3 && conflicts.length === 0 && !busy;

  const act = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleGenerate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await generateDraw();
      router.push("/draw");
    } catch (e) {
      alert("Draw failed:\n" + (e instanceof Error ? e.message : String(e)));
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main>
        <Header />
        <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main>
      <Header badge="Entries Open" />

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">
          {formatDrawDate(window.drawDate)}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Confirmed players:{" "}
          <span className="font-bold text-club-green">{confirmed.length}</span>
        </p>
        <p className="text-xs text-gray-500">
          Entry window: 07:45 Friday → 07:44 Saturday · Draw time: 07:45
        </p>
        <Link
          href="/players"
          className="mt-2 inline-block text-xs font-semibold text-club-green underline"
        >
          Manage club player list ({players.length} players)
        </Link>
      </div>

      {conflicts.length > 0 && (
        <div className="mb-4 rounded-xl border-2 border-red-400 bg-red-50 p-4">
          <h3 className="font-semibold text-red-700">Tee position conflict</h3>
          {conflicts.map((c) => (
            <p key={c} className="mt-1 text-sm text-red-700">
              {c}
            </p>
          ))}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => setAddingPlayer(!addingPlayer)}
          className="rounded-xl border-2 border-club-green bg-white py-3 text-sm font-semibold text-club-green"
        >
          Add Player
        </button>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="rounded-xl bg-club-green py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Working…" : "Generate Draw"}
        </button>
      </div>

      {addingPlayer && (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium">Add a player manually:</p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {notEntered.map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  act(async () => {
                    await enterDraw(p.id, "none", "admin");
                    setAddingPlayer(false);
                  })
                }
                className="block w-full rounded-lg border border-gray-200 p-2 text-left text-sm hover:bg-club-cream"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 space-y-2">
        {confirmed.length === 0 && (
          <p className="rounded-xl bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
            No players confirmed yet.
          </p>
        )}
        {confirmed.map((entry) => (
          <div
            key={entry.playerId}
            className="rounded-xl bg-white p-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {playerName(entry.playerId)}
                  {playerHandicap(entry.playerId) !== null && (
                    <span className="ml-2 rounded-full bg-club-green/10 px-2 py-0.5 text-xs font-semibold text-club-green">
                      HCP {playerHandicap(entry.playerId)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-600">
                  👍 Playing
                  {entry.playerPreference !== "none" &&
                    ` · ${PREFERENCE_LABELS[entry.playerPreference]}`}
                  {entry.adminOverride !== "none" && (
                    <span className="font-semibold text-club-gold">
                      {" "}
                      · {OVERRIDE_LABELS[entry.adminOverride]}
                    </span>
                  )}
                </p>
                {entry.note && (
                  <p className="text-xs italic text-gray-500">{entry.note}</p>
                )}
              </div>
              <button
                onClick={() =>
                  setEditingId(
                    editingId === entry.playerId ? null : entry.playerId
                  )
                }
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm"
              >
                Edit
              </button>
            </div>

            {editingId === entry.playerId && (
              <div className="mt-3 space-y-3 border-t pt-3 text-sm">
                <div>
                  <p className="mb-1 font-medium">Player request:</p>
                  <div className="flex gap-2">
                    {(
                      Object.keys(PREFERENCE_LABELS) as PlayerPreference[]
                    ).map((pref) => (
                      <button
                        key={pref}
                        onClick={() =>
                          act(() =>
                            updateEntry(entry.playerId, { preference: pref })
                          )
                        }
                        className={`rounded-lg border px-2 py-1 text-xs ${
                          entry.playerPreference === pref
                            ? "border-club-green bg-club-green text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {PREFERENCE_LABELS[pref]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 font-medium">Admin override:</p>
                  <div className="flex gap-2">
                    {(Object.keys(OVERRIDE_LABELS) as AdminOverride[]).map(
                      (ovr) => (
                        <button
                          key={ovr}
                          onClick={() =>
                            act(() =>
                              updateEntry(entry.playerId, { override: ovr })
                            )
                          }
                          className={`rounded-lg border px-2 py-1 text-xs ${
                            entry.adminOverride === ovr
                              ? "border-club-gold bg-club-gold text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {OVERRIDE_LABELS[ovr]}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1 font-medium">Admin note:</p>
                  <input
                    type="text"
                    defaultValue={entry.note ?? ""}
                    onBlur={(e) =>
                      act(() =>
                        updateEntry(entry.playerId, { note: e.target.value })
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                    placeholder="e.g. Needs to leave early"
                  />
                </div>
                <button
                  onClick={() =>
                    act(async () => {
                      await withdrawEntry(entry.playerId, "admin");
                      setEditingId(null);
                    })
                  }
                  className="w-full rounded-lg border border-red-400 py-2 text-xs font-semibold text-red-600"
                >
                  Remove from draw
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {confirmed.length > 0 && (
        <button
          onClick={() => {
            if (
              confirm(
                `Clear all ${confirmed.length} entries and start a fresh week? The saved draw history is kept.`
              )
            ) {
              act(() => clearAllEntries());
            }
          }}
          className="mb-4 w-full rounded-xl border border-gray-300 py-2 text-xs font-semibold text-gray-500"
        >
          Start next week (clear all entries)
        </button>
      )}

      <RulesCard />
    </main>
  );
}
