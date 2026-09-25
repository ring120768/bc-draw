// Server-side entry-window enforcement in the club's timezone.
// Entry window: 07:45 the day before the draw → 07:44 on draw day (Europe/London).
// Vercel servers run in UTC, so all decisions convert to London time first.

const TZ = "Europe/London";

/** Current date/time components in the club's timezone. */
function londonNow(now: Date = new Date()) {
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
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

/** The draw date (Saturday) the current entry window applies to, as YYYY-MM-DD. */
export function currentDrawDate(now: Date = new Date()): string {
  const ldn = londonNow(now);
  // Work in a plain date counter starting from London's "today"
  const d = new Date(Date.UTC(ldn.year, ldn.month - 1, ldn.day));
  let daysToSat = (6 - d.getUTCDay() + 7) % 7;
  // If it's Saturday after the 07:45 draw, roll to next Saturday
  if (daysToSat === 0 && (ldn.hour > 7 || (ldn.hour === 7 && ldn.minute >= 45))) {
    daysToSat = 7;
  }
  d.setUTCDate(d.getUTCDate() + daysToSat);
  return d.toISOString().slice(0, 10);
}

/**
 * Is the entry window open right now (London time)?
 * Open: Friday 07:45 → Saturday 07:44 for the upcoming Saturday draw.
 */
export function isWindowOpen(now: Date = new Date()): boolean {
  const ldn = londonNow(now);
  const minutes = ldn.hour * 60 + ldn.minute;
  const cutoff = 7 * 60 + 44; // 07:44
  const open = 7 * 60 + 45; // 07:45

  if (ldn.weekday === 5) {
    // Friday: opens at 07:45
    return minutes >= open;
  }
  if (ldn.weekday === 6) {
    // Saturday: open until 07:44 inclusive
    return minutes <= cutoff;
  }
  return false;
}
