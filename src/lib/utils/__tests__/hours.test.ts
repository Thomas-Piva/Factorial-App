import { describe, it, expect } from "vitest";
import {
  calculateDurationMinutes,
  formatMinutesToHHMM,
  isSaturday,
  isSunday,
} from "../hours";

describe("calculateDurationMinutes", () => {
  it("calculates duration for a standard shift", () => {
    expect(calculateDurationMinutes("14:00", "20:00")).toBe(360);
  });

  it("calculates duration for a morning shift", () => {
    expect(calculateDurationMinutes("08:30", "14:30")).toBe(360);
  });

  it("calculates duration with minutes", () => {
    expect(calculateDurationMinutes("09:15", "17:45")).toBe(510);
  });

  it("returns 0 for same start and end time", () => {
    expect(calculateDurationMinutes("10:00", "10:00")).toBe(0);
  });

  it("returns 0 for null start time", () => {
    expect(calculateDurationMinutes(null, "20:00")).toBe(0);
  });

  it("returns 0 for null end time", () => {
    expect(calculateDurationMinutes("14:00", null)).toBe(0);
  });
});

describe("formatMinutesToHHMM", () => {
  it("formats 360 minutes as 6:00", () => {
    expect(formatMinutesToHHMM(360)).toBe("6:00");
  });

  it("formats 0 minutes as 0:00", () => {
    expect(formatMinutesToHHMM(0)).toBe("0:00");
  });

  it("formats 90 minutes as 1:30", () => {
    expect(formatMinutesToHHMM(90)).toBe("1:30");
  });

  it("formats 510 minutes as 8:30", () => {
    expect(formatMinutesToHHMM(510)).toBe("8:30");
  });

  it("formats 7560 minutes (126h) as 126:00", () => {
    expect(formatMinutesToHHMM(7560)).toBe("126:00");
  });

  it("pads single-digit minutes with leading zero", () => {
    expect(formatMinutesToHHMM(61)).toBe("1:01");
  });
});

describe("isSaturday", () => {
  it("returns true for a Saturday", () => {
    // 2026-04-04 is a Saturday
    expect(isSaturday(new Date("2026-04-04"))).toBe(true);
  });

  it("returns false for a non-Saturday", () => {
    // 2026-04-05 is a Sunday
    expect(isSaturday(new Date("2026-04-05"))).toBe(false);
  });
});

describe("isSunday", () => {
  it("returns true for a Sunday", () => {
    // 2026-04-05 is a Sunday
    expect(isSunday(new Date("2026-04-05"))).toBe(true);
  });

  it("returns false for a non-Sunday", () => {
    // 2026-04-06 is a Monday
    expect(isSunday(new Date("2026-04-06"))).toBe(false);
  });
});
