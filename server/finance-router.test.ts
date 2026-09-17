import { describe, expect, it } from "vitest";
import {
  calculateCommission,
  ensureRange,
  parseMoney,
  rangesOverlap,
} from "./finance-router";

describe("finance calculation rules", () => {
  it("parses valid decimal strings and rejects missing values", () => {
    expect(parseMoney("100.250000")).toBe(100.25);
    expect(parseMoney(null)).toBeNull();
    expect(parseMoney("not-a-number")).toBeNull();
  });

  it("calculates percentage commission", () => {
    expect(
      calculateCommission({
        amount: 100,
        commissionType: "percentage",
        commissionValue: "2.500000",
      }),
    ).toBe(2.5);
  });

  it("calculates fixed commission", () => {
    expect(
      calculateCommission({
        amount: 1000,
        commissionType: "fixed",
        commissionValue: "15.000000",
      }),
    ).toBe(15);
  });

  it("allows adjacent non-overlapping ranges", () => {
    expect(
      rangesOverlap({
        existingMinimum: "1.000000",
        existingMaximum: "100.000000",
        nextMinimum: "101.000000",
        nextMaximum: "500.000000",
      }),
    ).toBe(false);
  });

  it("detects overlapping ranges", () => {
    expect(
      rangesOverlap({
        existingMinimum: "1.000000",
        existingMaximum: "100.000000",
        nextMinimum: "50.000000",
        nextMaximum: "200.000000",
      }),
    ).toBe(true);
  });

  it("rejects maximum amounts below minimum amounts", () => {
    expect(() => ensureRange("100.000000", "99.000000")).toThrow();
  });
});
