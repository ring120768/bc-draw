import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** POST { drawDate, scores: { [playerId]: number } } */
export async function POST(req: NextRequest) {
  const { drawDate, scores } = await req.json();
  if (!drawDate || typeof scores !== "object") {
    return NextResponse.json(
      { error: "drawDate and scores required" },
      { status: 400 }
    );
  }
  const p = await db();
  const res = await p.query(
    "update draws set scores = $1 where draw_date = $2",
    [JSON.stringify(scores), drawDate]
  );
  if (res.rowCount === 0) {
    return NextResponse.json(
      { error: "No draw found for that date" },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
