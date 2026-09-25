// Availability window logic — The Breakfast Club Draw
//
// Rules:
// - Entry window: 07:45 the day before the draw → 07:44 on draw day
// - Draw made at 07:45 on draw day
// - Draw day is Saturday (next upcoming Saturday, or today if it's Saturday)

export type DrawWindow = {
  drawDate: Date; // the day golf is played
  windowStart: Date; // 07:45 previous day
  windowEnd: Date; // 07:44 draw day
  drawTime: Date; // 07:45 draw day
};

export type WindowStatus = "not_yet_open" | "open" | "closed";

function atTime(date: Date, hours: number, minutes: number): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Find the draw window for the next Saturday (inclusive of today).
 * If today is Saturday and the draw has already been made (after 07:45),
 * rolls over to next Saturday.
 */
export function getCurrentDrawWindow(now: Date = new Date()): DrawWindow {
  const drawDate = new Date(now);
  drawDate.setHours(12, 0, 0, 0);

  // Move forward to Saturday (day 6)
  while (drawDate.getDay() !== 6) {
    drawDate.setDate(drawDate.getDate() + 1);
  }

  let drawTime = atTime(drawDate, 7, 45);

  // Today is Saturday and the draw is done — next window is next Saturday
  if (now.getDay() === 6 && now >= drawTime) {
    drawDate.setDate(drawDate.getDate() + 7);
    drawTime = atTime(drawDate, 7, 45);
  }

  const previousDay = new Date(drawDate);
  previousDay.setDate(previousDay.getDate() - 1);

  return {
    drawDate,
    windowStart: atTime(previousDay, 7, 45),
    windowEnd: atTime(drawDate, 7, 44),
    drawTime,
  };
}

export function getWindowStatus(
  window: DrawWindow,
  now: Date = new Date()
): WindowStatus {
  if (now < window.windowStart) return "not_yet_open";
  if (now > window.windowEnd) return "closed";
  return "open";
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

export function formatDrawDate(date: Date): string {
  return date.toLocaleDateString("en-GB", DATE_FORMAT);
}

export function formatWindowLine(date: Date): string {
  const day = date.toLocaleDateString("en-GB", DATE_FORMAT);
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} at ${time}`;
}
