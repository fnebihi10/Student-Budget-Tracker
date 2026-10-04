import {
  activeSubscriptionTotal,
  getNextRenewal,
  monthlyEquivalent,
} from "../subscriptions";

describe("subscription calculations", () => {
  test("normalizes weekly, monthly, and yearly prices", () => {
    expect(monthlyEquivalent({ amount: 12, frequency: "yearly" })).toBe(1);
    expect(monthlyEquivalent({ amount: 10, frequency: "monthly" })).toBe(10);
    expect(monthlyEquivalent({ amount: 3, frequency: "weekly" })).toBe(13);
  });

  test("only totals active subscriptions", () => {
    expect(
      activeSubscriptionTotal([
        { amount: 12, frequency: "monthly", status: "active" },
        { amount: 120, frequency: "yearly", status: "paused" },
      ])
    ).toBe(12);
  });

  test("preserves end-of-month renewal intent", () => {
    const renewal = getNextRenewal(
      { nextBillingDate: "2026-01-31T12:00:00Z", frequency: "monthly" },
      new Date("2026-02-10T12:00:00Z")
    );
    expect(renewal.toISOString()).toBe("2026-02-28T12:00:00.000Z");
  });
});
