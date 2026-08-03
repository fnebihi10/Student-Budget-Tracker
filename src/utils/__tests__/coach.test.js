import { calculateHealth } from "../coach";

describe("financial health", () => {
  test("counts bill status for the evaluated month", () => {
    const date = new Date();
    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const base = {
      transactions: [],
      settings: { monthlyBudget: 1000 },
      subscriptions: [],
      goals: [],
    };

    expect(
      calculateHealth({
        ...base,
        bills: [{ paidMonth: currentMonth }],
      }).openBills
    ).toBe(0);
    expect(
      calculateHealth({
        ...base,
        bills: [{ paidMonth: null }],
      }).openBills
    ).toBe(1);
  });
});
