import { describe, expect, it, vi } from "vitest";
import { ProcurementsService } from "./procurements.service";

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

describe("ProcurementsService optional targetRoomId & brand", () => {
  it("allows procuring Category A assets without targetRoomId and without brand", async () => {
    const tx = {
      procurement: { create: vi.fn().mockResolvedValue({ id: "proc-1", procurementNo: "PROC/2026/001" }) },
      item: {
        findUnique: vi.fn().mockResolvedValue({
          id: "item-land",
          name: "Tanah Lapangan Sekolah",
          brand: null,
          modelType: null,
          subCategory: { code: "01", category: { code: "A" } },
        }),
      },
      room: { findUnique: vi.fn() },
      procurementItem: { create: vi.fn().mockResolvedValue({ id: "pi-1" }) },
      assetItem: {
        findFirst: vi.fn().mockResolvedValue(null),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      procurement: { findUnique: vi.fn().mockResolvedValue(null) },
      fundingSource: { findUnique: vi.fn().mockResolvedValue({ id: "fs-1" }) },
      $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) => cb(tx)),
    };

    const service = new ProcurementsService(prisma as never);
    const result = await service.createProcurement(
      {
        procurementNo: "PROC/2026/001",
        fundingSourceId: "fs-1",
        procurementDate: "2026-11-26",
        items: [
          {
            itemId: "item-land",
            quantity: 1,
            unitPrice: 500000000,
          },
        ],
      },
      "user-1",
    );

    expect(tx.room.findUnique).not.toHaveBeenCalled();
    expect(tx.assetItem.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          inventoryCode: "A.01.001.PGRI7.2026",
          currentRoomId: null,
        }),
      ],
    });
    expect(result.generatedCodes).toEqual(["A.01.001.PGRI7.2026"]);
  });
});
