"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  getCurrentDraw,
  setCurrentDraw,
  saveDrawToHistory,
  getEntries,
  getPlayers,
  getDrawHistory,
  type SavedDraw,
} from "@/lib/store";
import { generateDraw, type PlayerForDraw } from "@/lib/drawEngine";
import { buildWhatsAppMessage } from "@/lib/whatsappMessage";

export default function DrawResultPage() {
  const [mounted, setMounted] = useState(false);
  const [draw, setDraw] = useState<SavedDraw | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<SavedDraw[]>([]);

  useEffect(() => {
    setMounted(true);
    setDraw(getCurrentDraw());
    setHistory(getDrawHistory());
  }, []);

  if (!mounted) return null;

  if (!draw) {
    return (
      <main>
        <Header />
        <div className="rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-gray-600">No draw has been generated yet.</p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-xl bg-club-green px-6 py-3 font-semibold text-white"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const playerCount = draw.result.groups.reduce(
    (sum, g) => sum + g.players.length,
    0
  );

  const copyMessage = async () => {
    await navigator.clipboard.writeText(draw.whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reshuffle = () => {
    const players = getPlayers();
    const confirmed = getEntries().filter((e) => e.status === "playing");
    const drawPlayers: PlayerForDraw[] = confirmed.map((e) => ({
      id: e.playerId,
      name: players.find((p) => p.id === e.playerId)?.name ?? "Unknown",
      playerPreference: e.playerPreference,
      adminOverride: e.adminOverride,
    }));
    const result = generateDraw(drawPlayers);
    if (!result.ok) {
      alert("Reshuffle failed:\n" + result.errors.join("\n"));
      return;
    }
    const next: SavedDraw = {
      ...draw,
      generatedAt: new Date().toISOString(),
      result,
      whatsappMessage: buildWhatsAppMessage(result, "07:45"),
    };
    setCurrentDraw(next);
    setDraw(next);
    setSaved(false);
  };

  const save = () => {
    saveDrawToHistory(draw);
    setHistory(getDrawHistory());
    setSaved(true);
  };

  return (
    <main>
      <Header badge="Draw Generated" />

      <div className="mb-4 rounded-xl bg-white p-4 text-center shadow-sm">
        <p className="font-semibold">{playerCount} players confirmed</p>
        <p className="text-sm text-gray-600">
          {draw.result.groups.length} groups created · Drawn at 07:45
        </p>
      </div>

      {draw.result.warnings.length > 0 && (
        <div className="mb-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
          {draw.result.warnings.map((w) => (
            <p key={w} className="text-sm text-amber-800">
              ⚠️ {w}
            </p>
          ))}
        </div>
      )}

      <div className="mb-4 space-y-3">
        {draw.result.groups.map((group) => (
          <div
            key={group.groupNumber}
            className="rounded-xl bg-white p-4 shadow-sm"
          >
            <h3 className="mb-2 font-semibold text-club-green">
              Group {group.groupNumber}
              {group.label && (
                <span className="ml-2 rounded-full bg-club-gold/20 px-2 py-0.5 text-xs font-medium text-club-gold">
                  {group.label}
                </span>
              )}
            </h3>
            <ul className="space-y-1 text-sm">
              {group.players.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(draw.whatsappMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-[#25D366] py-4 text-center text-lg font-semibold text-white shadow"
        >
          Share to WhatsApp
        </a>
        <button
          onClick={copyMessage}
          className="rounded-xl bg-club-green py-3 font-semibold text-white shadow"
        >
          {copied ? "✓ Copied!" : "Copy Message"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={reshuffle}
            className="rounded-xl border-2 border-club-green bg-white py-3 font-semibold text-club-green"
          >
            Reshuffle
          </button>
          <button
            onClick={save}
            disabled={saved}
            className="rounded-xl border-2 border-club-gold bg-white py-3 font-semibold text-club-gold disabled:opacity-40"
          >
            {saved ? "✓ Saved" : "Save Draw"}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          WhatsApp Message Preview
        </h3>
        <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
          {draw.whatsappMessage}
        </pre>
      </div>

      {history.length > 0 && (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Draw History
          </h3>
          <ul className="space-y-1 text-sm text-gray-600">
            {history.map((h) => (
              <li key={h.generatedAt}>
                {h.drawDate} —{" "}
                {h.result.groups.reduce((s, g) => s + g.players.length, 0)}{" "}
                players, {h.result.groups.length} groups
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/scores"
        className="mb-2 block rounded-xl border-2 border-club-green bg-white py-3 text-center font-semibold text-club-green"
      >
        Enter Final Scores
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
