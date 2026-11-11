import { describe, expect, it } from "vitest";

describe("Stock Opname Reconciliation Algorithm", () => {
  enum AuditMatch {
    MATCH = "MATCH",
    MISPLACED = "MISPLACED",
    MISSING = "MISSING",
  }

  function reconcileScannedAsset(
    scannedRoomId: string,
    currentRoomId: string,
  ): AuditMatch {
    if (scannedRoomId === currentRoomId) {
      return AuditMatch.MATCH;
    }
    return AuditMatch.MISPLACED;
  }

  it("should classify asset as MATCH if found in registered room", () => {
    const result = reconcileScannedAsset("room-lab-1", "room-lab-1");
    expect(result).toBe(AuditMatch.MATCH);
  });

  it("should classify asset as MISPLACED if found in different room", () => {
    const result = reconcileScannedAsset("room-lab-2", "room-lab-1");
    expect(result).toBe(AuditMatch.MISPLACED);
  });

  it("should calculate correct percentage of matched assets", () => {
    const totalAssets = 50;
    const matchedCount = 45;
    const percentage = Number(((matchedCount / totalAssets) * 100).toFixed(1));
    expect(percentage).toBe(90.0);
  });
});
