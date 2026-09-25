"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  getPlayers,
  addPlayer,
  renamePlayer,
  removePlayer,
  setPlayerHandicap,
} from "@/lib/store";
import type { Player } from "@/lib/mockData";

export default function ManagePlayersPage() {
  const [mounted, setMounted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editHandicap, setEditHandicap] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    setPlayers(getPlayers());
  }, []);

  if (!mounted) return null;

  const refresh = () => setPlayers(getPlayers());

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  const handleAdd = () => {
    const result = addPlayer(newName);
    if (!result) {
      flash(
        newName.trim()
          ? `"${newName.trim()}" is already in the list.`
          : "Enter a name first."
      );
      return;
    }
    setNewName("");
    refresh();
    flash(`${result.name} added.`);
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

  const handleSave = (playerId: string) => {
    if (!renamePlayer(playerId, editName)) {
      flash("That name is empty or already taken.");
      return;
    }
    const trimmed = editHandicap.trim();
    if (trimmed === "") {
      setPlayerHandicap(playerId, null);
    } else {
      const value = Number(trimmed);
      if (Number.isNaN(value) || value < -10 || value > 54) {
        flash("Handicap must be a number between -10 and 54.");
        return;
      }
      setPlayerHandicap(playerId, value);
    }
    setEditingId(null);
    refresh();
  };

  const handleRemove = (player: Player) => {
    if (!confirm(`Remove ${player.name} from the club list?`)) return;
    removePlayer(player.id);
    refresh();
    flash(`${player.name} removed.`);
  };

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
          className="rounded-xl bg-club-green px-5 py-3 text-sm font-semibold text-white"
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
                  className="rounded-lg bg-club-green px-3 py-2 text-xs font-semibold text-white"
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
                    className="rounded-lg border border-red-400 px-3 py-1 text-xs text-red-600"
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
