// Server-side entry-window rules in the club's timezone (Europe/London).
//
// Standard week: sign-up opens Friday 07:30 and closes Saturday 07:30.
// Outside that, entries are locked until the next Friday 07:30.
// The admin can open a SPECIAL draw for any date (Sunday, bank holiday):
// its window follows the same 24-hour rule — opens 07:30 the day before,
// closes 07:30 on the day itself.

const TZ = "Europe/London";
const OPEN_MINUTES = 7 * 60 + 30; // 07:30

type London = {
  dateStr: string; // YYYY-MM-DD in London
  minutes: number; // minutes since midnight in London
  weekday: number; // 0=Sun ... 6=Sat
};

function london(now: Date = new Date()): London {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dateStr = `${get("year")}-${get("month")}-${get("day")}`;
  return {
    dateStr,
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(dateStr: string): number {
  return new Date(dateStr + "T12:00:00Z").getUTCDay();
}

/** Format a London date (+ optional time) for display, e.g. "Saturday 4 October at 07:30". */
export function formatLondon(dateStr: string, time?: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return time ? `${day} at ${time}` : day;
}

/** A special date is only valid while it hasn't passed (London). */
export function specialStillValid(
  special: string | null | undefined,
  now: Date = new Date()
): string | null {
  if (!special) return null;
  return special >= london(now).dateStr ? special : null;
}

/**
 * The draw date the app is currently working towards.
 * On a draw day itself (Saturday or a special date) the date holds all day,
 * so the 07:45 draw and score entry land on the right record.
 */
export function targetDrawDate(
  now: Date = new Date(),
  specialRaw?: string | null
): string {
  const ldn = london(now);
  const special = specialStillValid(specialRaw, now);
  const isDrawDay = (d: string) => weekdayOf(d) === 6 || d === special;

  // A draw day today keeps its date all day
  if (isDrawDay(ldn.dateStr)) return ldn.dateStr;

  // An open window points at its draw date
  if (special && ldn.dateStr === addDays(special, -1) && ldn.minutes >= OPEN_MINUTES) {
    return special;
  }
  if (ldn.weekday === 5 && ldn.minutes >= OPEN_MINUTES) {
    return addDays(ldn.dateStr, 1);
  }

  // Otherwise: the nearest upcoming draw day
  const days = (6 - ldn.weekday + 7) % 7;
  const saturday = addDays(ldn.dateStr, days === 0 ? 7 : days);
  if (special && special > ldn.dateStr && special < saturday) return special;
  return saturday;
}

/** Is the standard Saturday window open? (Fri 07:30 → Sat 07:30) */
function saturdayWindowOpen(ldn: London): boolean {
  return (
    (ldn.weekday === 5 && ldn.minutes >= OPEN_MINUTES) ||
    (ldn.weekday === 6 && ldn.minutes < OPEN_MINUTES)
  );
}

/** Is the special-date window open? (D-1 07:30 → D 07:30) */
function specialWindowOpen(ldn: London, special: string | null): boolean {
  if (!special) return false;
  return (
    (ldn.dateStr === addDays(special, -1) && ldn.minutes >= OPEN_MINUTES) ||
    (ldn.dateStr === special && ldn.minutes < OPEN_MINUTES)
  );
}

/** Is ANY entry window open right now? */
export function isWindowOpen(
  now: Date = new Date(),
  specialRaw?: string | null
): boolean {
  const ldn = london(now);
  const special = specialStillValid(specialRaw, now);
  return saturdayWindowOpen(ldn) || specialWindowOpen(ldn, special);
}

export type WindowInfo = {
  targetDate: string; // YYYY-MM-DD
  targetLabel: string;
  phase: "open" | "pending" | "closed";
  opensLabel: string; // "Friday 3 October at 07:30"
  closesLabel: string;
  drawLabel: string;
  special: boolean;
  specialDate: string | null;
};

/**
 * Window state for players/admin: which draw is sign-up currently for,
 * and is it open, not-yet-open, or just-closed?
 * Note: this follows the ENTRY window. On a Saturday afternoon with a
 * special Sunday open, this points at Sunday while the draw/scores
 * endpoints (targetDrawDate) still point at Saturday's completed draw.
 */
export function windowInfo(
  now: Date = new Date(),
  specialRaw?: string | null
): WindowInfo {
  const ldn = london(now);
  const special = specialStillValid(specialRaw, now);

  let target: string;
  let phase: WindowInfo["phase"];

  if (saturdayWindowOpen(ldn)) {
    target = ldn.weekday === 5 ? addDays(ldn.dateStr, 1) : ldn.dateStr;
    phase = "open";
  } else if (specialWindowOpen(ldn, special)) {
    target = special!;
    phase = "open";
  } else if (
    (weekdayOf(ldn.dateStr) === 6 || ldn.dateStr === special) &&
    ldn.minutes >= OPEN_MINUTES
  ) {
    // A draw day after the close: show "closed" for today's draw
    target = ldn.dateStr;
    phase = "closed";
  } else {
    // Nothing open: point at the next upcoming window
    const days = (6 - ldn.weekday + 7) % 7;
    const saturday = addDays(ldn.dateStr, days === 0 ? 7 : days);
    target =
      special && special > ldn.dateStr && special < saturday
        ? special
        : saturday;
    phase = "pending";
  }

  return {
    targetDate: target,
    targetLabel: formatLondon(target),
    phase,
    opensLabel: formatLondon(addDays(target, -1), "07:30"),
    closesLabel: formatLondon(target, "07:30"),
    drawLabel: formatLondon(target, "07:45"),
    special: special === target,
    specialDate: special,
  };
}
