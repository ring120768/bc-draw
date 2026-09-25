// Draw Engine — The Breakfast Club Draw
// Pure logic module: no React, no storage. Fully unit-testable.

export type PlayerPreference = "none" | "prefer_early" | "prefer_late";
export type AdminOverride = "none" | "must_first" | "must_last";

export type PlayerForDraw = {
  id: string;
  name: string;
  playerPreference: PlayerPreference;
  adminOverride: AdminOverride;
};

export type DrawGroup = {
  groupNumber: number;
  label?: "Early group" | "Late group";
  players: PlayerForDraw[];
};

export type DrawResult = {
  ok: boolean;
  groups: DrawGroup[];
  warnings: string[];
  errors: string[];
};

export type DrawOptions = {
  allowTwoBall?: boolean;
};

/**
 * Calculate valid group sizes using only 3s and 4s.
 * Prefers fewer groups, then more 4-balls.
 * Throws for player counts that cannot form a clean draw.
 */
export function calculateGroupSizes(
  n: number,
  options: DrawOptions = {}
): number[] {
  const allowedSizes = options.allowTwoBall ? [4, 3, 2] : [4, 3];
  const solutions: number[][] = [];

  function search(remaining: number, current: number[]) {
    if (remaining === 0) {
      solutions.push([...current]);
      return;
    }
    if (remaining < 0) return;
    for (const size of allowedSizes) {
      // Only add sizes in non-increasing order to avoid duplicate permutations
      const last = current[current.length - 1];
      if (last !== undefined && size > last) continue;
      search(remaining - size, [...current, size]);
    }
  }

  search(n, []);

  if (solutions.length === 0) {
    if (n < 3) {
      throw new Error(
        `Not enough players (${n}). Minimum is 3, or 2 with an admin 2-ball override.`
      );
    }
    throw new Error(
      `Cannot create a clean 3/4-ball draw for ${n} players. An admin 2-ball override would allow it.`
    );
  }

  return solutions.sort((a, b) => {
    // Prefer fewer groups
    if (a.length !== b.length) return a.length - b.length;
    // Prefer more 4-balls
    const aFours = a.filter((s) => s === 4).length;
    const bFours = b.filter((s) => s === 4).length;
    if (aFours !== bFours) return bFours - aFours;
    // Prefer fewer 2-balls (only relevant with override)
    const aTwos = a.filter((s) => s === 2).length;
    const bTwos = b.filter((s) => s === 2).length;
    return aTwos - bTwos;
  })[0];
}

/** Fisher-Yates shuffle. Accepts an injectable random fn for testability. */
export function shuffle<T>(array: T[], random: () => number = Math.random): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generate the draw.
 * 1. Validate hard overrides.
 * 2. Calculate group sizes (4s preferred, sorted so Group 1 is largest).
 * 3. Place must_first in Group 1, must_last in final group.
 * 4. Fill prefer_early into earliest space, prefer_late into latest space.
 * 5. Fill everything else randomly.
 */
export function generateDraw(
  players: PlayerForDraw[],
  options: DrawOptions = {},
  random: () => number = Math.random
): DrawResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // --- Override validation -------------------------------------------------
  const mustFirst = players.filter((p) => p.adminOverride === "must_first");
  const mustLast = players.filter((p) => p.adminOverride === "must_last");

  if (mustFirst.length > 4) {
    errors.push(
      `${mustFirst.length} players are marked "Must be first group". Maximum group size is 4.`
    );
  }
  if (mustLast.length > 4) {
    errors.push(
      `${mustLast.length} players are marked "Must be last group". Maximum group size is 4.`
    );
  }

  // --- Group size calculation ----------------------------------------------
  let sizes: number[] = [];
  try {
    sizes = calculateGroupSizes(players.length, options);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  if (errors.length === 0 && sizes.length > 0) {
    // Group 1 gets the largest size so must_first players have maximum room.
    // Club rule: 3-balls always tee off at the top of the draw,
    // so sort ascending (smaller groups first, 4-balls at the end).
    sizes = [...sizes].sort((a, b) => a - b);

    // Exception: if must-first players won't fit in the top group,
    // move the first group that is big enough to the front.
    if (mustFirst.length > sizes[0]) {
      const bigIdx = sizes.findIndex((s) => s >= mustFirst.length);
      if (bigIdx > 0) {
        const [big] = sizes.splice(bigIdx, 1);
        sizes.unshift(big);
        warnings.push(
          `A ${big}-ball was moved to the top of the draw to fit ${mustFirst.length} "Must be first group" players.`
        );
      } else if (bigIdx === -1) {
        errors.push(
          `${mustFirst.length} players are marked "Must be first group" but no group has that many places.`
        );
      }
    }
    // With ascending order the last group is the largest, so must-last
    // players (max 4) always fit unless no group is big enough.
    if (mustLast.length > sizes[sizes.length - 1]) {
      errors.push(
        `${mustLast.length} players are marked "Must be last group" but the last group only has ${sizes[sizes.length - 1]} places.`
      );
    }

    if (sizes.length === 1 && mustFirst.length > 0 && mustLast.length > 0) {
      warnings.push(
        "Only one group exists, so first-group and last-group overrides both point to the same group."
      );
    }
  }

  if (errors.length > 0) {
    return { ok: false, groups: [], warnings, errors };
  }

  // --- Placement -------------------------------------------------------------
  const groups: DrawGroup[] = sizes.map((_, i) => ({
    groupNumber: i + 1,
    players: [],
  }));
  const capacity = [...sizes];
  const lastIdx = groups.length - 1;

  const place = (player: PlayerForDraw, idx: number) => {
    groups[idx].players.push(player);
    capacity[idx]--;
  };

  // 1. Hard overrides
  shuffle(mustFirst, random).forEach((p) => place(p, 0));
  shuffle(mustLast, random).forEach((p) => place(p, lastIdx));

  // 2. Soft preferences
  const remaining = players.filter((p) => p.adminOverride === "none");
  const preferEarly = shuffle(
    remaining.filter((p) => p.playerPreference === "prefer_early"),
    random
  );
  const preferLate = shuffle(
    remaining.filter((p) => p.playerPreference === "prefer_late"),
    random
  );
  const noPreference = shuffle(
    remaining.filter((p) => p.playerPreference === "none"),
    random
  );

  // Earliest available space for early preferences
  let earlyUnhonoured = 0;
  for (const p of preferEarly) {
    const idx = capacity.findIndex((c) => c > 0);
    if (idx === -1) {
      errors.push("Internal error: no space left while placing early preferences.");
      return { ok: false, groups: [], warnings, errors };
    }
    if (idx > 0) earlyUnhonoured++;
    place(p, idx);
  }

  // Latest available space for late preferences
  let lateUnhonoured = 0;
  for (const p of preferLate) {
    let idx = -1;
    for (let i = capacity.length - 1; i >= 0; i--) {
      if (capacity[i] > 0) {
        idx = i;
        break;
      }
    }
    if (idx === -1) {
      errors.push("Internal error: no space left while placing late preferences.");
      return { ok: false, groups: [], warnings, errors };
    }
    if (idx < lastIdx) lateUnhonoured++;
    place(p, idx);
  }

  if (earlyUnhonoured > 0) {
    warnings.push(
      `${earlyUnhonoured} early preference${earlyUnhonoured > 1 ? "s" : ""} could not be placed in Group 1 (placed as early as possible).`
    );
  }
  if (lateUnhonoured > 0) {
    warnings.push(
      `${lateUnhonoured} late preference${lateUnhonoured > 1 ? "s" : ""} could not be placed in the last group (placed as late as possible).`
    );
  }

  // 3. Fill remaining spaces randomly
  for (const p of noPreference) {
    const openIdxs = capacity
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c > 0)
      .map(({ i }) => i);
    if (openIdxs.length === 0) {
      errors.push("Internal error: no space left while filling remaining players.");
      return { ok: false, groups: [], warnings, errors };
    }
    const idx = openIdxs[Math.floor(random() * openIdxs.length)];
    place(p, idx);
  }

  // --- Validation ------------------------------------------------------------
  const placed = groups.flatMap((g) => g.players);
  if (placed.length !== players.length) {
    errors.push("Internal error: player count mismatch after placement.");
    return { ok: false, groups: [], warnings, errors };
  }
  if (capacity.some((c) => c !== 0)) {
    errors.push("Internal error: groups not filled to planned sizes.");
    return { ok: false, groups: [], warnings, errors };
  }
  const ids = new Set(placed.map((p) => p.id));
  if (ids.size !== players.length) {
    errors.push("Internal error: duplicate player detected in draw.");
    return { ok: false, groups: [], warnings, errors };
  }

  // --- Labels ------------------------------------------------------------------
  const anyEarly =
    mustFirst.length > 0 ||
    groups[0].players.some((p) => p.playerPreference === "prefer_early");
  const anyLate =
    mustLast.length > 0 ||
    groups[lastIdx].players.some((p) => p.playerPreference === "prefer_late");

  if (anyEarly) groups[0].label = "Early group";
  if (anyLate && lastIdx > 0) groups[lastIdx].label = "Late group";

  return { ok: true, groups, warnings, errors };
}
