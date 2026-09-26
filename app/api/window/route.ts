import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { windowInfo, specialStillValid } from "@/lib/serverWindow";

export const dynamic = "force-dynamic";

const KEY = "special_draw_date";

/** Current window state (target date, phase, opening/closing times). */
export async function GET() {
  const special = specialStillValid(await getSetting(KEY));
  return NextResponse.json(windowInfo(new Date(), special));
}

/** Admin: open a special draw (Sunday / bank holiday) for a given date. */
export async function POST(req: NextRequest) {
  const { date } = await req.json();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "A date (YYYY-MM-DD) is required." },
      { status: 400 }
    );
  }
  if (!specialStillValid(date)) {
    return NextResponse.json(
      { error: "That date has already passed." },
      { status: 400 }
    );
  }
  await setSetting(KEY, date);
  return NextResponse.json(windowInfo(new Date(), date));
}

/** Admin: cancel the special draw. */
export async function DELETE() {
  await setSetting(KEY, null);
  return NextResponse.json(windowInfo(new Date(), null));
}
