import { describe, expect, it } from "vitest";

describe("Procurement Auto-Generator Formula", () => {
  function generateInventoryCode(
    categoryCode: string,
    subCategoryCode: string,
    sequence: number,
    year: number,
  ): string {
    const seqStr = String(sequence).padStart(3, "0");
    return `${categoryCode}.${subCategoryCode}.${seqStr}.PGRI7.${year}`;
  }

  it("should generate standard inventory code for Lenovo Laptop", () => {
    const code = generateInventoryCode("C", "02", 10, 2025);
    expect(code).toBe("C.02.010.PGRI7.2025");
  });

  it("should pad single digit sequence correctly to 3 digits", () => {
    const code = generateInventoryCode("B", "01", 1, 2026);
    expect(code).toBe("B.01.001.PGRI7.2026");
  });

  it("should format large sequence numbers properly", () => {
    const code = generateInventoryCode("B", "02", 145, 2026);
    expect(code).toBe("B.02.145.PGRI7.2026");
  });

  it("should parse sequence number from existing code correctly", () => {
    const sampleCode = "C.02.042.PGRI7.2026";
    const parts = sampleCode.split(".");
    expect(parts.length).toBe(5);
    expect(parts[0]).toBe("C");
    expect(parts[1]).toBe("02");
    expect(parseInt(parts[2], 10)).toBe(42);
    expect(parts[3]).toBe("PGRI7");
    expect(parts[4]).toBe("2026");
  });
});
