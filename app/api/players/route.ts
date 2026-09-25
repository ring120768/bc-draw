import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const p = await db();
  const { rows } = await p.query(
    "select id, name, active, handicap from players order by name"
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const p = await db();
  const dup = await p.query(
    "select 1 from players where lower(name) = lower($1)",
    [trimmed]
  );
  if (dup.rowCount) {
    return NextResponse.json(
      { error: `"${trimmed}" is already in the list.` },
      { status: 409 }
    );
  }
  const id = `player-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  await p.query("insert into players (id, name) values ($1, $2)", [
    id,
    trimmed,
  ]);
  return NextResponse.json({ id, name: trimmed, active: true, handicap: null });
}

export async function PATCH(req: NextRequest) {
  const { id, name, handicap } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const p = await db();
  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const dup = await p.query(
      "select 1 from players where lower(name) = lower($1) and id <> $2",
      [trimmed, id]
    );
    if (dup.rowCount) {
      return NextResponse.json(
        { error: "That name is already taken." },
        { status: 409 }
      );
    }
    await p.query("update players set name = $1 where id = $2", [trimmed, id]);
  }
  if (handicap !== undefined) {
    await p.query("update players set handicap = $1 where id = $2", [
      handicap,
      id,
    ]);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const p = await db();
  await p.query("delete from players where id = $1", [id]); // cascades entry
  return NextResponse.json({ ok: true });
}
