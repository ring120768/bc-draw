import { describe, it, expect } from "vitest";
import {
  isWindowOpen,
  targetDrawDate,
  windowInfo,
} from "../lib/serverWindow";

// October 2026 dates (BST, UTC+1): 07:30 London = 06:30 UTC.
// Fri 2 Oct, Sat 3 Oct, Sun 4 Oct 2026.
const t = (iso: string) => new Date(iso);

describe("standard Saturday window (Fri 07:30 → Sat 07:30)", () => {
  it("closed Friday 07:29", () => {
    expect(isWindowOpen(t("2026-10-02T06:29:00Z"))).toBe(false);
  });
  it("open Friday 07:30", () => {
    expect(isWindowOpen(t("2026-10-02T06:30:00Z"))).toBe(true);
  });
  it("open Saturday 07:29", () => {
    expect(isWindowOpen(t("2026-10-03T06:29:00Z"))).toBe(true);
  });
  it("closed Saturday 07:30", () => {
    expect(isWindowOpen(t("2026-10-03T06:30:00Z"))).toBe(false);
  });
  it("closed midweek (Wednesday)", () => {
    expect(isWindowOpen(t("2026-09-30T12:00:00Z"))).toBe(false);
  });
  it("closed Sunday with no special draw", () => {
    expect(isWindowOpen(t("2026-10-04T06:00:00Z"))).toBe(false);
  });
  it("target stays Saturday all of Saturday (for the 07:45 draw)", () => {
    expect(targetDrawDate(t("2026-10-03T07:00:00Z"))).toBe("2026-10-03");
    expect(targetDrawDate(t("2026-10-03T20:00:00Z"))).toBe("2026-10-03");
  });
  it("midweek target is the coming Saturday", () => {
    expect(targetDrawDate(t("2026-09-30T12:00:00Z"))).toBe("2026-10-03");
  });
});

describe("special draw (admin-opened Sunday), same 24-hour rule", () => {
  const special = "2026-10-04"; // Sunday
  it("Saturday 07:29: Saturday window still open, target Saturday", () => {
    expect(isWindowOpen(t("2026-10-03T06:29:00Z"), special)).toBe(true);
    expect(targetDrawDate(t("2026-10-03T06:29:00Z"), special)).toBe(
      "2026-10-03"
    );
  });
  it("Saturday 07:45 draw still targets Saturday", () => {
    expect(targetDrawDate(t("2026-10-03T06:45:00Z"), special)).toBe(
      "2026-10-03"
    );
  });
  it("Sunday sign-up opens Saturday 07:30", () => {
    const info = windowInfo(t("2026-10-03T06:30:00Z"), special);
    // Saturday itself remains the target all Saturday; Sunday window state
    // becomes the target from Sunday 00:00 — but entries are already accepted
    // because SOME window is open:
    expect(isWindowOpen(t("2026-10-03T10:00:00Z"), special)).toBe(true);
    expect(info.specialDate).toBe(special);
  });
  it("open Sunday 07:29, target Sunday", () => {
    expect(isWindowOpen(t("2026-10-04T06:29:00Z"), special)).toBe(true);
    expect(targetDrawDate(t("2026-10-04T06:29:00Z"), special)).toBe(special);
  });
  it("closed Sunday 07:30, target still Sunday for the draw", () => {
    expect(isWindowOpen(t("2026-10-04T06:30:00Z"), special)).toBe(false);
    expect(targetDrawDate(t("2026-10-04T06:45:00Z"), special)).toBe(special);
  });
  it("expired special date is ignored", () => {
    expect(isWindowOpen(t("2026-10-07T12:00:00Z"), special)).toBe(false);
    expect(targetDrawDate(t("2026-10-07T12:00:00Z"), special)).toBe(
      "2026-10-10"
    );
  });
});
