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
    const august = new Date("2026-08-03T12:00:00Z");
    expect(monthKey(august)).toBe("2026-08");
    expect(isBillPaidForMonth({ paidMonth: "2026-08" }, august)).toBe(true);
    expect(isBillPaidForMonth({ paidMonth: "2026-07" }, august)).toBe(false);
  });

  test("clamps repeated dates to the last day of shorter months", () => {
    expect(sameDayInMonth("2026-01-31T12:00:00Z", 2026, 1))
      .toBe("2026-02-28T12:00:00.000Z");
  });

  test("uses the UTC ledger month when an explicit offset crosses a boundary", () => {
    const instant = new Date("2026-08-01T00:30:00+14:00");
    expect(monthKey(instant)).toBe("2026-07");
    expect(isBillPaidForMonth({ paidMonth: "2026-07" }, instant)).toBe(true);
    expect(sameDayInMonth("2026-02-01T00:30:00+14:00", 2026, 1))
      .toBe("2026-02-28T12:00:00.000Z");
  });
});
