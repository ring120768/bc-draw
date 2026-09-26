import { NextRequest, NextResponse } from "next/server";
import { db, getSetting } from "@/lib/db";
import { targetDrawDate } from "@/lib/serverWindow";
import { generateDraw, type PlayerForDraw } from "@/lib/drawEngine";
import { buildWhatsAppMessage } from "@/lib/whatsappMessage";

export const dynamic = "force-dynamic";

/** GET: { current, history } */
export async function GET() {
  const p = await db();
  const { rows } = await p.query(
    `select draw_date::text as "drawDate", generated_at as "generatedAt",
            is_current as "isCurrent", result, whatsapp_message as "whatsappMessage", scores
     from draws order by draw_date desc limit 52`
  );
  const current = rows.find((r) => r.isCurrent) ?? null;
  return NextResponse.json({ current, history: rows });
}

/** POST { action: "generate" | "reshuffle" } — runs the draw engine server-side. */
export async function POST(req: NextRequest) {
  const { action = "generate" } = await req.json().catch(() => ({}));
  const p = await db();

  const { rows: entries } = await p.query(
    `select e.player_id as id, pl.name, e.preference, e.override
     from entries e join players pl on pl.id = e.player_id
     where e.status = 'playing'`
  );

  const drawPlayers: PlayerForDraw[] = entries.map((e) => ({
    id: e.id,
    name: e.name,
    playerPreference: e.preference,
    adminOverride: e.override,
  }));

  const result = generateDraw(drawPlayers);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.errors.join("\n"), warnings: result.warnings },
      { status: 422 }
    );
  }

  const drawDate = targetDrawDate(
    new Date(),
    await getSetting("special_draw_date")
  );
  const whatsappMessage = buildWhatsAppMessage(result, "07:45");

  await p.query("update draws set is_current = false where is_current");
  await p.query(
    `insert into draws (draw_date, generated_at, is_current, result, whatsapp_message)
     values ($1, now(), true, $2, $3)
     on conflict (draw_date)
     do update set generated_at = now(), is_current = true,
                   result = $2, whatsapp_message = $3`,
    [drawDate, JSON.stringify(result), whatsappMessage]
  );

  return NextResponse.json({
    drawDate,
    generatedAt: new Date().toISOString(),
    result,
    whatsappMessage,
    action,
  });
}
