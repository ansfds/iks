import { describe, expect, it } from "vitest";
import {
  defaultGiftCardPricingSettings,
  resolveGiftCardPrice,
} from "./gift-card-pricing";

describe("gift card pricing rules", () => {
  it.each([
    [25, "250.000"],
    [50, "500.000"],
    [100, "1000.000"],
    [125, "1212.500"],
    [250, "2425.000"],
    [5, "50.000"],
  ])("calculates regular denominations for $%s", (faceValue, expected) => {
    expect(
      resolveGiftCardPrice(
        { faceValue },
        defaultGiftCardPricingSettings,
      ).sellingPriceLyd,
    ).toBe(expected);
  });

  it.each([
    [100, null, "1000.000"],
    [300, 285, "2764.500"],
    [500, 455, "4413.500"],
    [800, 750, "7275.000"],
    [1000, 905, "8778.500"],
  ])("calculates SHEIN $%s from special USD when present", (
    faceValue,
    specialPriceUsd,
    expected,
  ) => {
    expect(
      resolveGiftCardPrice(
        { faceValue, specialPriceUsd },
        defaultGiftCardPricingSettings,
      ).sellingPriceLyd,
    ).toBe(expected);
  });

  it("keeps manual LYD price as the highest priority", () => {
    expect(
      resolveGiftCardPrice(
        {
          faceValue: 1000,
          manualSellingPriceLyd: 1234.5,
          specialPriceUsd: 905,
        },
        defaultGiftCardPricingSettings,
      ),
    ).toEqual({
      sellingPriceLyd: "1234.500",
      priceSource: "MANUAL",
    });
  });

  it("updates rule-based prices when rates change", () => {
    expect(
      resolveGiftCardPrice(
        { faceValue: 150 },
        { rate10To100: 10.1, rateAbove100: 9.8 },
      ).sellingPriceLyd,
    ).toBe("1470.000");
  });
});
