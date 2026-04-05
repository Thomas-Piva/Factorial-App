import { describe, it, expect } from "vitest";
import {
  SHIFT_TYPES,
  SHIFT_TYPE_LABELS,
  SHIFT_TYPE_COLORS,
  SHIFT_TYPE_HAS_TIME,
  ALL_SHIFT_TYPES,
} from "../shift-types";

describe("SHIFT_TYPES", () => {
  it("exports all five shift type codes", () => {
    expect(SHIFT_TYPES.WORK_SHIFT).toBe("work_shift");
    expect(SHIFT_TYPES.REST_DAY).toBe("rest_day");
    expect(SHIFT_TYPES.HOLIDAY).toBe("holiday");
    expect(SHIFT_TYPES.TRANSFER).toBe("transfer");
    expect(SHIFT_TYPES.PERMISSION).toBe("permission");
  });
});

describe("SHIFT_TYPE_LABELS", () => {
  it("has an Italian label for every shift type", () => {
    for (const type of ALL_SHIFT_TYPES) {
      expect(SHIFT_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});

describe("SHIFT_TYPE_COLORS", () => {
  it("has a hex color for every shift type", () => {
    for (const type of ALL_SHIFT_TYPES) {
      expect(SHIFT_TYPE_COLORS[type]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("SHIFT_TYPE_HAS_TIME", () => {
  it("work_shift has time", () => {
    expect(SHIFT_TYPE_HAS_TIME["work_shift"]).toBe(true);
  });

  it("rest_day does not have time", () => {
    expect(SHIFT_TYPE_HAS_TIME["rest_day"]).toBe(false);
  });

  it("holiday does not have time", () => {
    expect(SHIFT_TYPE_HAS_TIME["holiday"]).toBe(false);
  });

  it("permission does not have time", () => {
    expect(SHIFT_TYPE_HAS_TIME["permission"]).toBe(false);
  });
});
