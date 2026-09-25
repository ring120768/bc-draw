"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { getDrawHistory, type SavedDraw, type Scores } from "@/lib/store";

type LeagueRow = {
  playerId: string;
  name: string;
  played: number;
  individualWins: number;
  teamWins: number;
  totalPoints: number;
  best: number;
  average: number;
};

function playersInDraw(draw: SavedDraw) {
  return draw.result.groups.flatMap((g) => g.players);
}

/** Individual winners of one draw (shared on ties). */
function individualWinners(scores: Scores): string[] {
  const best = Math.max(...Object.values(scores));
  return Object.entries(scores)
    .filter(([, s]) => s === best)
    .map(([id]) => id);
}

/** Player ids in the winning team(s) of one draw (average points, fully-scored groups only). */
function teamWinnerIds(draw: SavedDraw, scores: Scores): string[] {
  const eligible = draw.result.groups
    .map((g) => {
      const entered = g.players
        .map((p) => scores[p.id])
        .filter((s): s is number => s !== undefined);
      return {
        players: g.players.map((p) => p.id),
        full: entered.length === g.players.length && entered.length > 0,
        average:
          entered.length > 0
            ? Math.round(
                (entered.reduce((sum, s) => sum + s, 0) / entered.length) * 10
              ) / 10
            : 0,
      };
    })
    .filter((t) => t.full);
  if (eligible.length === 0) return [];
  const best = Math.max(...eligible.map((t) => t.average));
  return eligible.filter((t) => t.average === best).flatMap((t) => t.players);
}

function buildLeague(history: SavedDraw[]): LeagueRow[] {
  const rows = new Map<string, LeagueRow>();

  for (const draw of history) {
    if (!draw.scores || Object.keys(draw.scores).length === 0) continue;
    const scores = draw.scores;
    const indWinners = new Set(individualWinners(scores));
    const teamWinners = new Set(teamWinnerIds(draw, scores));
    const names = new Map(playersInDraw(draw).map((p) => [p.id, p.name]));

    for (const [playerId, score] of Object.entries(scores)) {
      const row = rows.get(playerId) ?? {
        playerId,
        name: names.get(playerId) ?? "Unknown",
        played: 0,
        individualWins: 0,
        teamWins: 0,
        totalPoints: 0,
        best: 0,
        average: 0,
      };
      row.played += 1;
      row.totalPoints += score;
      row.best = Math.max(row.best, score);
      if (indWinners.has(playerId)) row.individualWins += 1;
      if (teamWinners.has(playerId)) row.teamWins += 1;
      // Keep the most recent name in case of renames
      row.name = names.get(playerId) ?? row.name;
      rows.set(playerId, row);
    }
  }

  return Array.from(rows.values())
    .map((r) => ({
      ...r,
      average: Math.round((r.totalPoints / r.played) * 10) / 10,
    }))
    .sort(
      (a, b) =>
        b.individualWins - a.individualWins ||
        b.teamWins - a.teamWins ||
        b.totalPoints - a.totalPoints ||
        a.name.localeCompare(b.name, "en-GB")
    );
}

export default function LeaguePage() {
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<SavedDraw[]>([]);

  useEffect(() => {
    setMounted(true);
    setHistory(getDrawHistory());
  }, []);

  if (!mounted) return null;

  const scored = history.filter(
    (d) => d.scores && Object.keys(d.scores).length > 0
  );
  const league = buildLeague(scored);

  const nameOf = (d: SavedDraw, id: string) =>
    playersInDraw(d).find((p) => p.id === id)?.name ?? "Unknown";

  return (
    <main>
      <Header />

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-club-green">League Table</h2>
        <p className="mt-1 text-sm text-gray-600">
          Season standings from {scored.length} scored draw
          {scored.length === 1 ? "" : "s"}. Ranked by individual wins, then
          team wins, then total points.
        </p>
      </div>

      {league.length === 0 ? (
        <div className="mb-4 rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            No results yet. The table builds itself as scores are saved each
            week.
          </p>
          <Link
            href="/scores"
            className="mt-3 inline-block rounded-xl bg-club-green px-5 py-3 text-sm font-semibold text-white"
          >
            Enter Scores
          </Link>
        </div>
      ) : (
        <div className="mb-4 overflow-x-auto rounded-xl bg-white p-2 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="p-2">#</th>
                <th className="p-2">Player</th>
                <th className="p-2 text-center" title="Rounds played">P</th>
                <th className="p-2 text-center" title="Individual wins">🏆</th>
                <th className="p-2 text-center" title="Team wins">👥</th>
                <th className="p-2 text-center" title="Total points">Pts</th>
                <th className="p-2 text-center" title="Average points">Avg</th>
              </tr>
            </thead>
            <tbody>
              {league.map((row, i) => (
                <tr
                  key={row.playerId}
                  className={`border-b last:border-b-0 ${
                    i === 0 ? "bg-club-gold/10 font-semibold" : ""
                  }`}
                >
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{row.name}</td>
                  <td className="p-2 text-center">{row.played}</td>
                  <td className="p-2 text-center">{row.individualWins}</td>
                  <td className="p-2 text-center">{row.teamWins}</td>
                  <td className="p-2 text-center">{row.totalPoints}</td>
                  <td className="p-2 text-center">{row.average}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scored.length > 0 && (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Results History
          </h3>
          <div className="space-y-3">
            {scored.map((d) => {
              const scores = d.scores!;
              const best = Math.max(...Object.values(scores));
              const winners = individualWinners(scores).map((id) =>
                nameOf(d, id)
              );
              const sorted = Object.entries(scores).sort(
                ([, a], [, b]) => b - a
              );
              return (
                <div
                  key={d.drawDate}
                  className="border-t pt-2 first:border-t-0 first:pt-0"
                >
                  <p className="text-sm font-semibold">{d.drawDate}</p>
                  <p className="text-sm">
                    🏆 {winners.join(" & ")} ({best})
                  </p>
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
        href="/scores"
        className="mb-2 block rounded-xl border-2 border-club-green bg-white py-3 text-center font-semibold text-club-green"
      >
        Enter This Week’s Scores
      </Link>
      <Link
        href="/"
        className="block text-center text-sm text-gray-500 underline"
      >
        Back to Home
      </Link>
    </main>
  );
}
