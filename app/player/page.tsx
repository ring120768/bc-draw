"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import RulesCard from "@/components/RulesCard";
import {
  getPlayers,
  getEntries,
  enterDraw,
  withdrawEntry,
  type Entry,
} from "@/lib/store";
import {
  getCurrentDrawWindow,
  getWindowStatus,
  formatDrawDate,
  formatWindowLine,
  type WindowStatus,
} from "@/lib/timeWindow";
import type { PlayerPreference } from "@/lib/drawEngine";
import type { Player } from "@/lib/mockData";

const PREFERENCE_LABELS: Record<PlayerPreference, string> = {
  none: "No preference",
  prefer_early: "Prefer early",
  prefer_late: "Prefer late",
};

export default function PlayerEntryPage() {
  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState("");
  const [preference, setPreference] = useState<PlayerPreference>("none");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<WindowStatus>("open");

  const window = getCurrentDrawWindow();

  const load = async () => {
    const [pl, en] = await Promise.all([getPlayers(), getEntries()]);
    setPlayers(pl);
    setEntries(en);
  };

  useEffect(() => {
    setStatus(getWindowStatus(getCurrentDrawWindow()));
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main>
        <Header />
        <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  const myEntry = entries.find(
    (e) => e.playerId === playerId && e.status === "playing"
  );

  const confirm = async () => {
    if (!playerId || busy) return;
    setBusy(true);
    try {
      await enterDraw(playerId, preference);
      setEntries(await getEntries());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not enter the draw.");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await withdrawEntry(playerId);
      setEntries(await getEntries());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not withdraw.");
    } finally {
      setBusy(false);
    }
  };

  if (status !== "open") {
    return (
      <main>
        <Header badge="Entries Closed" />
        <div className="rounded-xl bg-white p-6 text-center shadow-sm">
          {status === "not_yet_open" ? (
            <>
              <h2 className="mb-2 text-lg font-semibold">
                Entries aren’t open yet.
              </h2>
              <p className="text-sm text-gray-600">
                The window for{" "}
                <span className="font-medium">
                  {formatDrawDate(window.drawDate)}
                </span>{" "}
                opens at
                <br />
                {formatWindowLine(window.windowStart)}.
              </p>
            </>
          ) : (
            <>
              <h2 className="mb-2 text-lg font-semibold">
                Entries are closed for this draw.
              </h2>
              <p className="text-sm text-gray-600">
                The draw closed at 07:44.
                <br />
                Groups are drawn at 07:45.
              </p>
            </>
          )}
          <p className="mt-4 text-sm text-gray-600">
            Contact the admin if you need to be added manually.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header badge="Entries Open" />

      <div className="mb-4 rounded-xl bg-white p-4 text-center shadow-sm">
        <p className="font-semibold">Are you playing this weekend?</p>
        <p className="mt-2 text-sm text-gray-600">
          You are entering for:
          <br />
          <span className="font-medium text-gray-900">
            {formatDrawDate(window.drawDate)}
          </span>
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Entry window:
          <br />
          {formatWindowLine(window.windowStart)}
          <br />
          until
          <br />
          {formatWindowLine(window.windowEnd)}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Draw made: {formatWindowLine(window.drawTime)}
        </p>
      </div>

      {myEntry ? (
        <div className="mb-4 rounded-xl bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-bold text-club-green">You’re in. 👍</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your 👍 has been counted for this weekend’s Breakfast Club draw.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Draw closes at 07:44. Groups are drawn at 07:45.
          </p>
          <p className="mt-3 text-sm">
            Tee preference:{" "}
            <span className="font-medium">
              {PREFERENCE_LABELS[myEntry.playerPreference]}
            </span>
          </p>
          <button
            onClick={withdraw}
            disabled={busy}
            className="mt-4 w-full rounded-xl border-2 border-red-500 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            Withdraw
          </button>
        </div>
      ) : (
        <div className="mb-4 space-y-4 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="player">
              Who are you?
            </label>
            <select
              id="player"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3"
            >
              <option value="">Select your name…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Optional tee preference:</p>
            <div className="space-y-2">
              {(Object.keys(PREFERENCE_LABELS) as PlayerPreference[]).map(
                (pref) => (
                  <label
                    key={pref}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm"
                  >
                    <input
                      type="radio"
                      name="preference"
                      checked={preference === pref}
                      onChange={() => setPreference(pref)}
                    />
                    {PREFERENCE_LABELS[pref]}
                  </label>
                )
              )}
            </div>
          </div>

          <button
            onClick={confirm}
            disabled={!playerId || busy}
            className="w-full rounded-xl bg-club-green py-4 text-lg font-semibold text-white shadow hover:bg-club-greenDark disabled:opacity-40"
          >
            {busy ? "Entering…" : "👍 I’m playing"}
          </button>
        </div>
      )}

      <RulesCard />
    </main>
  );
}
