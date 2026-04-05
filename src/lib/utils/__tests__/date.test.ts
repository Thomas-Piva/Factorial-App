import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateShort,
  getWeekRange,
  getMonthRange,
  toISODate,
  addDays,
  eachDayOfInterval,
} from "../date";

describe("formatDate", () => {
  it("formats a date in Italian long format", () => {
    // 2026-04-04 is a Saturday
    const date = new Date("2026-04-04");
    expect(formatDate(date)).toBe("Sab 04/04");
  });

  it("formats a Monday correctly", () => {
    const date = new Date("2026-04-06");
    expect(formatDate(date)).toBe("Lun 06/04");
  });
});

describe("formatDateShort", () => {
  it("formats as DD/MM/YYYY", () => {
    const date = new Date("2026-04-04");
    expect(formatDateShort(date)).toBe("04/04/2026");
  });
});

describe("getWeekRange", () => {
  it("returns Monday as start of week", () => {
    // 2026-04-04 is a Saturday, week start should be 2026-03-30 (Mon)
    const range = getWeekRange(new Date("2026-04-04"));
    expect(toISODate(range.start)).toBe("2026-03-30");
    expect(toISODate(range.end)).toBe("2026-04-05");
  });

  it("returns correct week number", () => {
    // 2026-04-04 is in ISO week 14
    const range = getWeekRange(new Date("2026-04-04"));
    expect(range.weekNumber).toBe(14);
  });

  it("week starting on Monday stays in same week", () => {
    const range = getWeekRange(new Date("2026-03-30"));
    expect(toISODate(range.start)).toBe("2026-03-30");
  });
});

describe("getMonthRange", () => {
  it("returns correct start and end of month", () => {
    const range = getMonthRange(2026, 3); // April (0-indexed)
    expect(toISODate(range.start)).toBe("2026-04-01");
    expect(toISODate(range.end)).toBe("2026-04-30");
  });

  it("handles February in a leap year", () => {
    const range = getMonthRange(2024, 1); // February
    expect(toISODate(range.end)).toBe("2024-02-29");
  });
});

describe("toISODate", () => {
  it("converts Date to YYYY-MM-DD string", () => {
    expect(toISODate(new Date("2026-04-04"))).toBe("2026-04-04");
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    const result = addDays(new Date("2026-04-01"), 5);
    expect(toISODate(result)).toBe("2026-04-06");
  });

  it("subtracts days with negative value", () => {
    const result = addDays(new Date("2026-04-06"), -5);
    expect(toISODate(result)).toBe("2026-04-01");
  });
});

describe("eachDayOfInterval", () => {
  it("returns all days in the interval inclusive", () => {
    const days = eachDayOfInterval(
      new Date("2026-04-01"),
      new Date("2026-04-03"),
    );
    expect(days.map(toISODate)).toEqual([
      "2026-04-01",
      "2026-04-02",
      "2026-04-03",
    ]);
  });

  it("returns single day when start equals end", () => {
    const days = eachDayOfInterval(
      new Date("2026-04-01"),
      new Date("2026-04-01"),
    );
    expect(days.map(toISODate)).toEqual(["2026-04-01"]);
  });
});
