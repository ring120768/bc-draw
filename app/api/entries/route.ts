import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isWindowOpen } from "@/lib/serverWindow";

export const dynamic = "force-dynamic";

export async function GET() {
  const p = await db();
  const { rows } = await p.query(
    `select e.player_id as "playerId", e.status, e.preference as "playerPreference",
            e.override as "adminOverride", e.note, e.entered_at as "enteredAt"
     from entries e order by e.entered_at`
  );
  return NextResponse.json(rows);
}

/** Player self-entry (window enforced) or admin add (source: "admin"). */
export async function POST(req: NextRequest) {
  const { playerId, preference = "none", source = "player" } = await req.json();
  if (!playerId) {
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  }
  if (source !== "admin" && !isWindowOpen()) {
    return NextResponse.json(
      {
        error:
          "Entries are closed. The window is 07:45 Friday until 07:44 Saturday. Contact the admin to be added manually.",
      },
      { status: 403 }
    );
  }
  const p = await db();
  await p.query(
    `insert into entries (player_id, status, preference, override, entered_at)
     values ($1, 'playing', $2, 'none', now())
     on conflict (player_id)
     do update set status = 'playing', preference = $2, entered_at = now()`,
    [playerId, preference]
  );
  return NextResponse.json({ ok: true });
}

/** Admin edits: preference, override, note, status. */
export async function PATCH(req: NextRequest) {
  const { playerId, preference, override, note, status } = await req.json();
  if (!playerId) {
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  }
  const p = await db();
  const sets: string[] = [];
  const params: (string | null)[] = [];
  const add = (col: string, val: string | null) => {
    params.push(val);
    sets.push(`${col} = $${params.length}`);
  };
  if (preference !== undefined) add("preference", preference);
  if (override !== undefined) add("override", override);
  if (note !== undefined) add("note", note);
  if (status !== undefined) add("status", status);
  if (!sets.length) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  params.push(playerId);
  await p.query(
    `update entries set ${sets.join(", ")} where player_id = $${params.length}`,
    params
  );
  return NextResponse.json({ ok: true });
}

/** Withdraw (player, window enforced), remove (admin), or clear all (admin, new week). */
export async function DELETE(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  const source = req.nextUrl.searchParams.get("source") ?? "player";
  const all = req.nextUrl.searchParams.get("all") === "true";
  if (all && source === "admin") {
    const p = await db();
    await p.query("delete from entries");
    return NextResponse.json({ ok: true });
  }
  if (!playerId) {
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  }
  if (source !== "admin" && !isWindowOpen()) {
    return NextResponse.json(
      { error: "The draw window is closed — contact the admin to withdraw." },
      { status: 403 }
    );
  }
  const p = await db();
  await p.query("delete from entries where player_id = $1", [playerId]);
  return NextResponse.json({ ok: true });
}
