import {
  dateInputToIso,
  isBillPaidForMonth,
  isValidDateInput,
  monthKey,
  sameDayInMonth,
} from "../dates";

describe("date utilities", () => {
  test.each([
    ["2024-02-29", true],
    ["2025-02-29", false],
    ["2026-02-31", false],
    ["2026-13-01", false],
    ["03/01/2026", false],
    ["", false],
  ])("validates %s", (value, expected) => {
    expect(isValidDateInput(value)).toBe(expected);
  });

  test("converts valid input and rejects invalid input", () => {
    expect(dateInputToIso("2026-08-03")).toContain("2026-08-03");
    expect(dateInputToIso("2026-02-31")).toBeNull();
  });

  test("uses a stable monthly key for bill status", () => {
    const august = new Date(2026, 7, 3, 12);
    expect(monthKey(august)).toBe("2026-08");
    expect(isBillPaidForMonth({ paidMonth: "2026-08" }, august)).toBe(true);
    expect(isBillPaidForMonth({ paidMonth: "2026-07" }, august)).toBe(false);
  });

  test("clamps repeated dates to the last day of shorter months", () => {
    const result = new Date(sameDayInMonth("2026-01-31T12:00:00", 2026, 1));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });
});
