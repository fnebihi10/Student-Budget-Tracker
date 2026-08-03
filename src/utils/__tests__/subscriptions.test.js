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
      { nextBillingDate: "2026-01-31T12:00:00", frequency: "monthly" },
      new Date(2026, 1, 10, 12)
    );
    expect(renewal.getMonth()).toBe(1);
    expect(renewal.getDate()).toBe(28);
  });
});
