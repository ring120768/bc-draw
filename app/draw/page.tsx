"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  getDrawState,
  generateDraw,
  type SavedDraw,
} from "@/lib/store";

export default function DrawResultPage() {
  const [loading, setLoading] = useState(true);
  const [draw, setDraw] = useState<SavedDraw | null>(null);
  const [history, setHistory] = useState<SavedDraw[]>([]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const state = await getDrawState();
    setDraw(state.current);
    setHistory(state.history);
  };

  useEffect(() => {
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

  const reshuffle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await generateDraw();
      await load();
    } catch (e) {
      alert(
        "Reshuffle failed:\n" + (e instanceof Error ? e.message : String(e))
      );
    } finally {
      setBusy(false);
    }
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
        <button
          onClick={reshuffle}
          disabled={busy}
          className="rounded-xl border-2 border-club-green bg-white py-3 font-semibold text-club-green disabled:opacity-40"
        >
          {busy ? "Reshuffling…" : "Reshuffle"}
        </button>
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
              <li key={h.drawDate}>
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
