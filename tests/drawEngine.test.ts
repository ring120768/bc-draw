import { describe, it, expect } from "vitest";
import {
  calculateGroupSizes,
  generateDraw,
  type PlayerForDraw,
} from "../lib/drawEngine";
import { buildWhatsAppMessage } from "../lib/whatsappMessage";

function makePlayers(
  n: number,
  overrides: Partial<PlayerForDraw>[] = []
): PlayerForDraw[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    playerPreference: "none" as const,
    adminOverride: "none" as const,
    ...(overrides[i] ?? {}),
  }));
}

// --- 1. Group size calculation (TEST_CASES.md table) --------------------------

describe("calculateGroupSizes", () => {
  const table: Record<number, number[]> = {
    3: [3],
    4: [4],
    6: [3, 3],
    7: [4, 3],
    8: [4, 4],
    9: [3, 3, 3],
    10: [4, 3, 3],
    11: [4, 4, 3],
    12: [4, 4, 4],
    13: [4, 3, 3, 3],
    14: [4, 4, 3, 3],
    15: [4, 4, 4, 3],
    16: [4, 4, 4, 4],
    17: [4, 4, 3, 3, 3],
    18: [4, 4, 4, 3, 3],
    19: [4, 4, 4, 4, 3],
    20: [4, 4, 4, 4, 4],
    21: [4, 4, 4, 3, 3, 3],
    22: [4, 4, 4, 4, 3, 3],
    23: [4, 4, 4, 4, 4, 3],
    24: [4, 4, 4, 4, 4, 4],
  };

  for (const [n, expected] of Object.entries(table)) {
    it(`${n} players -> [${expected}]`, () => {
      expect(calculateGroupSizes(Number(n))).toEqual(expected);
    });
  }

  it("1 player -> error", () => {
    expect(() => calculateGroupSizes(1)).toThrow();
  });

  it("2 players -> error without 2-ball override", () => {
    expect(() => calculateGroupSizes(2)).toThrow();
  });

  it("2 players -> [2] with 2-ball override", () => {
    expect(calculateGroupSizes(2, { allowTwoBall: true })).toEqual([2]);
  });

  it("5 players -> error without 2-ball override", () => {
    expect(() => calculateGroupSizes(5)).toThrow();
  });

  it("5 players -> [3, 2] with 2-ball override", () => {
    expect(calculateGroupSizes(5, { allowTwoBall: true })).toEqual([3, 2]);
  });
});

// --- 2. Hard override tests -----------------------------------------------------

describe("hard overrides", () => {
  it("a 4th must-first player spills into the next spot (Group 2)", () => {
    const players = makePlayers(18, [
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
    ]);
    const result = generateDraw(players);
    expect(result.ok).toBe(true);
    // 18 players = 3+3+4+4+4: three must-firsts fill Group 1,
    // the fourth takes the next slot in Group 2.
    expect(result.groups[0].players.length).toBe(3);
    const group1Ids = result.groups[0].players.map((p) => p.id);
    const group2Ids = result.groups[1].players.map((p) => p.id);
    const mustFirstIds = ["p1", "p2", "p3", "p4"];
    expect(group1Ids.every((id) => mustFirstIds.includes(id))).toBe(true);
    const spilled = mustFirstIds.filter((id) => !group1Ids.includes(id));
    expect(spilled.length).toBe(1);
    expect(group2Ids).toContain(spilled[0]);
    expect(result.warnings.join(" ")).toMatch(/next spot/);
  });

  it("up to 3 must-first players stay in Group 1 (a 3-ball)", () => {
    const players = makePlayers(18, [
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
    ]);
    const result = generateDraw(players);
    expect(result.ok).toBe(true);
    const ids = result.groups[0].players.map((p) => p.id).sort();
    expect(ids).toEqual(["p1", "p2", "p3"]);
  });

  it("5 must-first players -> error", () => {
    const players = makePlayers(18, [
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
    ]);
    const result = generateDraw(players);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/4/);
  });

  it("4 must-last players all land in the final group", () => {
    const players = makePlayers(18, [
      { adminOverride: "must_last" },
      { adminOverride: "must_last" },
      { adminOverride: "must_last" },
      { adminOverride: "must_last" },
    ]);
    const result = generateDraw(players);
    expect(result.ok).toBe(true);
    const lastGroup = result.groups[result.groups.length - 1];
    const lastIds = lastGroup.players.map((p) => p.id);
    expect(lastIds.sort()).toEqual(["p1", "p2", "p3", "p4"]);
  });

  it("5 must-last players -> error", () => {
    const players = makePlayers(18, [
      { adminOverride: "must_last" },
      { adminOverride: "must_last" },
      { adminOverride: "must_last" },
      { adminOverride: "must_last" },
      { adminOverride: "must_last" },
    ]);
    const result = generateDraw(players);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/4/);
  });
});

// --- 3. Soft preference tests -----------------------------------------------------

describe("soft preferences", () => {
  it("prefer-early players appear as early as possible", () => {
    const players = makePlayers(16, [
      { playerPreference: "prefer_early" },
      { playerPreference: "prefer_early" },
      { playerPreference: "prefer_early" },
    ]);
    const result = generateDraw(players);
    expect(result.ok).toBe(true);
    // All three should be in Group 1 (4 spaces, no hard overrides)
    const group1Ids = result.groups[0].players.map((p) => p.id);
    expect(group1Ids).toContain("p1");
    expect(group1Ids).toContain("p2");
    expect(group1Ids).toContain("p3");
  });

  it("prefer-late players appear as late as possible", () => {
    const players = makePlayers(16, [
      { playerPreference: "prefer_late" },
      { playerPreference: "prefer_late" },
      { playerPreference: "prefer_late" },
    ]);
    const result = generateDraw(players);
    expect(result.ok).toBe(true);
    const lastGroup = result.groups[result.groups.length - 1];
    const lastIds = lastGroup.players.map((p) => p.id);
    expect(lastIds).toContain("p1");
    expect(lastIds).toContain("p2");
    expect(lastIds).toContain("p3");
  });
});

// --- 4. Mixed override tests --------------------------------------------------------

describe("mixed overrides", () => {
  it("first and last overrides together", () => {
    const players = makePlayers(20, [
      { adminOverride: "must_first" },
      { adminOverride: "must_first" },
      { adminOverride: "must_last" },
      { adminOverride: "must_last" },
    ]);
    const result = generateDraw(players);
    expect(result.ok).toBe(true);
    expect(result.groups.length).toBe(5);
    const group1Ids = result.groups[0].players.map((p) => p.id);
    const lastIds = result.groups[4].players.map((p) => p.id);
    expect(group1Ids).toContain("p1");
    expect(group1Ids).toContain("p2");
    expect(lastIds).toContain("p3");
    expect(lastIds).toContain("p4");
  });

  it("must-first beats prefer-late", () => {
    const players = makePlayers(16, [
      { adminOverride: "must_first", playerPreference: "prefer_late" },
    ]);
    const result = generateDraw(players);
    expect(result.ok).toBe(true);
    expect(result.groups[0].players.map((p) => p.id)).toContain("p1");
  });
});

// --- 5. Draw validity tests ------------------------------------------------------------

describe("draw validity", () => {
  const counts = [3, 4, 6, 7, 12, 13, 14, 17, 18, 20, 24];

  for (const n of counts) {
    it(`${n}-player draw is valid`, () => {
      const players = makePlayers(n);
      const result = generateDraw(players);
      expect(result.ok).toBe(true);

      const placed = result.groups.flatMap((g) => g.players);
      // Total matches
      expect(placed.length).toBe(n);
      // No duplicates / missing
      expect(new Set(placed.map((p) => p.id)).size).toBe(n);
      // Size limits
      for (const g of result.groups) {
        expect(g.players.length).toBeLessThanOrEqual(4);
        expect(g.players.length).toBeGreaterThanOrEqual(3);
      }
    });
  }

  it("3-balls always come before 4-balls in the draw (no overrides)", () => {
    for (const n of [7, 10, 11, 14, 15, 18, 19, 22, 23]) {
      const result = generateDraw(makePlayers(n));
      const groupSizes = result.groups.map((g) => g.players.length);
      const sorted = [...groupSizes].sort((a, b) => a - b);
      expect(groupSizes).toEqual(sorted);
      expect(groupSizes[0]).toBe(3);
    }
  });

  it("labels: Group 1 is Early group when must-first applied", () => {
    const players = makePlayers(18, [{ adminOverride: "must_first" }]);
    const result = generateDraw(players);
    expect(result.groups[0].label).toBe("Early group");
  });

  it("labels: last group is Late group when must-last applied", () => {
    const players = makePlayers(18, [{ adminOverride: "must_last" }]);
    const result = generateDraw(players);
    expect(result.groups[result.groups.length - 1].label).toBe("Late group");
  });
});

// --- 6. WhatsApp message tests ------------------------------------------------------------

describe("WhatsApp message", () => {
  it("contains required content and no technical output", () => {
    const players = makePlayers(18, [
      { adminOverride: "must_first" },
      { adminOverride: "must_last" },
    ]);
    const result = generateDraw(players);
    const msg = buildWhatsAppMessage(result, "07:45");

    expect(msg).toContain("The Breakfast Club Draw");
    expect(msg).toContain("18 players confirmed.");
    expect(msg).toContain("Drawn at 07:45.");
    expect(msg).toContain("Group 1 — Early group");
    expect(msg).toContain("Late group");
    expect(msg).toContain("Player 1");

    // Must not leak internals
    expect(msg).not.toMatch(/p\d+"/);
    expect(msg).not.toContain("{");
    expect(msg).not.toContain("id:");
  });
});
