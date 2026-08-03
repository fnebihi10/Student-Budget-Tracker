import {
  categorySpend,
  getTotals,
  safePercent,
  totalCategoryBudget,
} from "../calculations";

const august = new Date(2026, 7, 15, 12);
const transactions = [
  { type: "income", amount: 1000, date: "2026-08-01T12:00:00", category: "salary" },
  { type: "expense", amount: 125.5, date: "2026-08-02T12:00:00", category: "food" },
  { type: "expense", amount: 20, date: "2026-08-03T12:00:00", category: "food" },
  { type: "expense", amount: 70, date: "2026-07-03T12:00:00", category: "study" },
  { type: "expense", amount: "invalid", date: "2026-08-04T12:00:00", category: "other" },
];

describe("financial calculations", () => {
  test("totals only the selected month and ignores invalid numbers", () => {
    expect(getTotals(transactions, august)).toEqual({
      income: 1000,
      expenses: 145.5,
      balance: 854.5,
    });
  });

  test("groups current-month expenses by category", () => {
    expect(categorySpend(transactions, august)).toEqual({ food: 145.5, other: 0 });
  });

  test("caps percentages and sums category limits safely", () => {
    expect(safePercent(120, 100)).toBe(100);
    expect(safePercent(10, 0)).toBe(0);
    expect(totalCategoryBudget({ food: 100, housing: 400, bad: "x" })).toBe(500);
  });
});
