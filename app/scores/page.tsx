"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  getDrawState,
  saveScores,
  type SavedDraw,
  type Scores,
} from "@/lib/store";

function playersInDraw(draw: SavedDraw) {
  return draw.result.groups.flatMap((g) => g.players);
}

function topScore(scores: Scores): number {
  return Math.max(...Object.values(scores));
}

type TeamResult = {
  groupNumber: number;
  playerCount: number;
  scoredCount: number;
  total: number;
  average: number;
};

/**
 * Team stableford: every drawn group is a team.
 * Scored by AVERAGE points per player so 3-balls and 4-balls compete fairly.
 * Only groups where every player has a score are eligible to win.
 */
function teamResults(draw: SavedDraw, scores: Scores): TeamResult[] {
  return draw.result.groups.map((g) => {
    const entered = g.players
      .map((p) => scores[p.id])
      .filter((s): s is number => s !== undefined);
    const total = entered.reduce((sum, s) => sum + s, 0);
    return {
      groupNumber: g.groupNumber,
      playerCount: g.players.length,
      scoredCount: entered.length,
      total,
      average:
        entered.length > 0
          ? Math.round((total / entered.length) * 10) / 10
          : 0,
    };
  });
}

function winningTeams(results: TeamResult[]): TeamResult[] {
  const eligible = results.filter(
    (t) => t.scoredCount === t.playerCount && t.scoredCount > 0
  );
  if (eligible.length === 0) return [];
  const best = Math.max(...eligible.map((t) => t.average));
  return eligible.filter((t) => t.average === best);
}

export default function ScoresPage() {
  const [loading, setLoading] = useState(true);
  const [draw, setDraw] = useState<SavedDraw | null>(null);
  const [history, setHistory] = useState<SavedDraw[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const state = await getDrawState();
      // Score the current draw, or the most recent saved one
      const target = state.current ?? state.history[0] ?? null;
      setDraw(target);
      setHistory(state.history);
      if (target?.scores) {
        const prefill: Record<string, string> = {};
        for (const [id, score] of Object.entries(target.scores)) {
          prefill[id] = String(score);
        }
        setInputs(prefill);
      }
    })()
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

  const handleSave = async () => {
    if (!draw || busy) return;
    const scores: Scores = {};
    for (const p of playersInDraw(draw)) {
      const raw = (inputs[p.id] ?? "").trim();
      if (raw === "") continue;
      const value = Number(raw);
      if (Number.isNaN(value)) continue;
      scores[p.id] = value;
    }
    setBusy(true);
    try {
      await saveScores(draw.drawDate, scores);
      setDraw({ ...draw, scores });
      setHistory((await getDrawState()).history);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save scores.");
    } finally {
      setBusy(false);
    }
  };

  const nameOf = (d: SavedDraw, playerId: string) =>
    playersInDraw(d).find((p) => p.id === playerId)?.name ?? "Unknown";

  const pastResults = history.filter(
    (d) => d.scores && Object.keys(d.scores).length > 0
  );

  return (
    <main>
      <Header />

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-club-green">Final Scores</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter each player’s stableford points after the round. Two prizes:
          highest individual score, and best team (your drawn group, scored by
          average points per player so 3-balls and 4-balls are fair).
        </p>
      </div>

      {!draw ? (
        <div className="mb-4 rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            No draw to score yet. Generate a draw first.
          </p>
          <Link
            href="/admin"
            className="mt-3 inline-block rounded-xl bg-club-green px-5 py-3 text-sm font-semibold text-white"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      ) : (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            {draw.drawDate} — {playersInDraw(draw).length} players
          </h3>
          <div className="space-y-2">
            {draw.result.groups.map((group) => {
              const entered = group.players
                .map((p) => (inputs[p.id] ?? "").trim())
                .filter((raw) => raw !== "")
                .map(Number)
                .filter((n) => !Number.isNaN(n));
              return (
              <div key={group.groupNumber}>
                <p className="mb-1 text-xs font-semibold text-gray-500">
                  Group {group.groupNumber}
                  {group.label ? ` — ${group.label}` : ""}
                  {entered.length === group.players.length &&
                    entered.length > 0 && (
                      <span className="ml-2 text-club-green">
                        team avg{" "}
                        {Math.round(
                          (entered.reduce((s, n) => s + n, 0) /
                            entered.length) *
                            10
                        ) / 10}
                      </span>
                    )}
                </p>
                {group.players.map((p) => (
                  <div
                    key={p.id}
                    className="mb-1 flex items-center justify-between gap-3"
                  >
                    <span className="text-sm">{p.name}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={inputs[p.id] ?? ""}
                      onChange={(e) =>
                        setInputs({ ...inputs, [p.id]: e.target.value })
                      }
                      placeholder="—"
                      className="w-20 rounded-lg border border-gray-300 p-2 text-right text-sm"
                    />
                  </div>
                ))}
              </div>
              );
            })}
          </div>
          <button
            onClick={handleSave}
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-club-green py-3 font-semibold text-white disabled:opacity-40"
          >
            {saved ? "✓ Scores saved" : busy ? "Saving…" : "Save Scores"}
          </button>
        </div>
      )}

      {pastResults.length > 0 && (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Past Results
          </h3>
          <div className="space-y-3">
            {pastResults.map((d) => {
              const scores = d.scores!;
              const best = topScore(scores);
              const winners = Object.entries(scores)
                .filter(([, s]) => s === best)
                .map(([id]) => nameOf(d, id));
              const sorted = Object.entries(scores).sort(
                ([, a], [, b]) => b - a
              );
              const teams = winningTeams(teamResults(d, scores));
              return (
                <div key={d.drawDate} className="border-t pt-2 first:border-t-0 first:pt-0">
                  <p className="text-sm font-semibold">{d.drawDate}</p>
                  <p className="text-sm">
                    🏆 Individual: {winners.join(" & ")} ({best})
                  </p>
                  {teams.length > 0 && (
                    <p className="text-sm">
                      👥 Team: Group{teams.length > 1 ? "s" : ""}{" "}
                      {teams.map((t) => t.groupNumber).join(" & ")} (avg{" "}
                      {teams[0].average})
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-600">
                    {sorted
                      .map(([id, s]) => `${nameOf(d, id)} ${s}`)
                      .join(" · ")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Link
        href="/league"
        className="mb-2 block rounded-xl border-2 border-club-gold bg-white py-3 text-center font-semibold text-club-gold"
      >
        📊 View League Table
      </Link>
      <Link
        href="/admin"
        className="block text-center text-sm text-gray-500 underline"
      >
        Back to Admin Dashboard
      </Link>
    </main>
  );
}
