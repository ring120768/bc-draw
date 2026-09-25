import type { DrawResult } from "./drawEngine";

/**
 * Build the WhatsApp-ready plain-text message.
 * No markdown, no IDs, no technical output.
 */
export function buildWhatsAppMessage(
  result: DrawResult,
  drawTime: string = "07:45"
): string {
  const playerCount = result.groups.reduce(
    (sum, g) => sum + g.players.length,
    0
  );

  const lines: string[] = [
    "The Breakfast Club Draw",
    "",
    `${playerCount} players confirmed.`,
    `Drawn at ${drawTime}.`,
  ];

  for (const group of result.groups) {
    lines.push("");
    lines.push(
      group.label
        ? `Group ${group.groupNumber} — ${group.label}`
        : `Group ${group.groupNumber}`
    );
    for (const player of group.players) {
      lines.push(player.name);
    }
  }

  return lines.join("\n");
}
