"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  getPlayers,
  addPlayer,
  updatePlayer,
  removePlayer,
} from "@/lib/store";
import type { Player } from "@/lib/mockData";

export default function ManagePlayersPage() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHandicap, setEditHandicap] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => setPlayers(await getPlayers());

  useEffect(() => {
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  const handleAdd = async () => {
    if (busy) return;
    if (!newName.trim()) {
      flash("Enter a name first.");
      return;
    }
    setBusy(true);
    try {
      const created = await addPlayer(newName);
      setNewName("");
      await refresh();
      flash(`${created.name} added.`);
    } catch (e) {
      flash(e instanceof Error ? e.message : "Could not add player.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditHandicap(
      player.handicap === null || player.handicap === undefined
        ? ""
        : String(player.handicap)
    );
  };

  const handleSave = async (playerId: string) => {
    if (busy) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      flash("Name can’t be empty.");
      return;
    }
    const trimmedHcp = editHandicap.trim();
    let handicap: number | null = null;
    if (trimmedHcp !== "") {
      const value = Number(trimmedHcp);
      if (Number.isNaN(value) || value < -10 || value > 54) {
        flash("Handicap must be a number between -10 and 54.");
        return;
      }
      handicap = value;
    }
    setBusy(true);
    try {
      await updatePlayer(playerId, { name: trimmedName, handicap });
      setEditingId(null);
      await refresh();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (player: Player) => {
    if (busy) return;
    if (!confirm(`Remove ${player.name} from the club list?`)) return;
    setBusy(true);
    try {
      await removePlayer(player.id);
      await refresh();
      flash(`${player.name} removed.`);
    } catch (e) {
      flash(e instanceof Error ? e.message : "Could not remove.");
    } finally {
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

  const sorted = [...players].sort((a, b) =>
    a.name.localeCompare(b.name, "en-GB")
  );

  return (
    <main>
      <Header />

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-club-green">Manage Players</h2>
        <p className="mt-1 text-sm text-gray-600">
          {players.length} players in the club list.
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-club-green/30 bg-green-50 p-3 text-sm text-club-green">
          {message}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New player name…"
          className="flex-1 rounded-xl border border-gray-300 p-3 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={busy}
          className="rounded-xl bg-club-green px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>

      <div className="mb-4 space-y-1">
        {sorted.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
          >
            {editingId === player.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave(player.id)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 p-2 text-sm"
                  autoFocus
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={editHandicap}
                  onChange={(e) => setEditHandicap(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave(player.id)}
                  placeholder="HCP"
                  className="w-16 rounded-lg border border-gray-300 p-2 text-sm"
                />
                <button
                  onClick={() => handleSave(player.id)}
                  disabled={busy}
                  className="rounded-lg bg-club-green px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium">
                  {player.name}
                  {player.handicap !== null &&
                    player.handicap !== undefined && (
                      <span className="ml-2 rounded-full bg-club-green/10 px-2 py-0.5 text-xs font-semibold text-club-green">
                        HCP {player.handicap}
                      </span>
                    )}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(player)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemove(player)}
                    disabled={busy}
                    className="rounded-lg border border-red-400 px-3 py-1 text-xs text-red-600 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <Link
        href="/admin"
        className="block text-center text-sm text-gray-500 underline"
      >
        Back to Admin Dashboard
      </Link>
    </main>
  );
}
