import { describe, expect, it } from "vitest";

describe("Loan Scheduling Conflict Logic", () => {
  function isScheduleOverlapping(
    newStart: Date,
    newEnd: Date,
    existingStart: Date,
    existingEnd: Date,
  ): boolean {
    return newStart <= existingEnd && newEnd >= existingStart;
  }

  it("should detect conflict when dates directly overlap", () => {
    const existingStart = new Date("2026-11-10");
    const existingEnd = new Date("2026-11-15");

    const newStart = new Date("2026-11-12");
    const newEnd = new Date("2026-11-14");

    expect(isScheduleOverlapping(newStart, newEnd, existingStart, existingEnd)).toBe(true);
  });

  it("should detect conflict when new booking engulfs existing booking", () => {
    const existingStart = new Date("2026-11-10");
    const existingEnd = new Date("2026-11-12");

    const newStart = new Date("2026-11-08");
    const newEnd = new Date("2026-11-15");

    expect(isScheduleOverlapping(newStart, newEnd, existingStart, existingEnd)).toBe(true);
  });

  it("should detect conflict when overlapping on exact boundary day", () => {
    const existingStart = new Date("2026-11-10");
    const existingEnd = new Date("2026-11-15");

    const newStart = new Date("2026-11-15");
    const newEnd = new Date("2026-11-18");

    expect(isScheduleOverlapping(newStart, newEnd, existingStart, existingEnd)).toBe(true);
  });

  it("should allow booking when schedule is completely distinct and in the future", () => {
    const existingStart = new Date("2026-11-10");
    const existingEnd = new Date("2026-11-12");

    const newStart = new Date("2026-11-13");
    const newEnd = new Date("2026-11-16");

    expect(isScheduleOverlapping(newStart, newEnd, existingStart, existingEnd)).toBe(false);
  });
});
