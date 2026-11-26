import "reflect-metadata";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MasterService } from "./master.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { CreateFundingSourceDto } from "./dto/create-funding-source.dto";
import { ProcurementItemInputDto } from "../procurements/dto/create-procurement.dto";

const UUID_1 = "11111111-1111-4111-8111-111111111111";
const UUID_2 = "22222222-2222-4222-8222-222222222222";

function createMockPrisma() {
  return {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subCategory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    item: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    room: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    fundingSource: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };
}

describe("Master & Procurement DTO Validation", () => {
  it("allows CreateItemDto without brand or with empty brand string", async () => {
    const omitted = plainToInstance(CreateItemDto, {
      subCategoryId: UUID_1,
      name: "Tanah Lapangan Upacara",
      unit: "m2",
    });
    expect(await validate(omitted)).toHaveLength(0);
    expect(omitted.brand).toBeUndefined();

    const emptyBrand = plainToInstance(CreateItemDto, {
      subCategoryId: UUID_1,
      name: "Kertas HVS A4",
      brand: "   ",
      unit: "rim",
    });
    expect(await validate(emptyBrand)).toHaveLength(0);
    expect(emptyBrand.brand).toBeUndefined();
  });

  it("allows UpdateItemDto to clear brand with empty string or null", async () => {
    const cleared = plainToInstance(UpdateItemDto, { brand: "" });
    expect(await validate(cleared)).toHaveLength(0);
    expect(cleared.brand).toBeNull();

    const nulled = plainToInstance(UpdateItemDto, { brand: null });
    expect(await validate(nulled)).toHaveLength(0);
    expect(nulled.brand).toBeNull();
  });

  it("normalizes uppercase code on Category and FundingSource DTOs", async () => {
    const cat = plainToInstance(CreateCategoryDto, { code: " h ", name: "Lainnya" });
    expect(await validate(cat)).toHaveLength(0);
    expect(cat.code).toBe("H");

    const fs = plainToInstance(CreateFundingSourceDto, { code: " dak ", name: "DAK Pendidikan" });
    expect(await validate(fs)).toHaveLength(0);
    expect(fs.code).toBe("DAK");
  });

  it("allows ProcurementItemInputDto with omitted, empty, or null targetRoomId and rejects invalid UUID", async () => {
    for (const targetRoomId of [undefined, "", "   ", null]) {
      const dto = plainToInstance(ProcurementItemInputDto, {
        itemId: UUID_1,
        quantity: 1,
        unitPrice: 500000000,
        targetRoomId,
      });
      expect(await validate(dto)).toHaveLength(0);
      expect(dto.targetRoomId).toBeUndefined();
    }

    const invalid = plainToInstance(ProcurementItemInputDto, {
      itemId: UUID_1,
      quantity: 1,
      unitPrice: 100000,
      targetRoomId: "not-a-uuid",
    });
    const errors = await validate(invalid);
    expect(errors.some((e) => e.property === "targetRoomId")).toBe(true);
  });
});

describe("MasterService CRUD & Referential Guards", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: MasterService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new MasterService(prisma as never);
  });

  // --- ITEMS ---
  it("creates an item with null brand when omitted", async () => {
    prisma.subCategory.findUnique.mockResolvedValue({ id: UUID_1 });
    prisma.item.create.mockResolvedValue({ id: UUID_2, name: "Gedung A", brand: null });

    const res = await service.createItem({
      subCategoryId: UUID_1,
      name: "Gedung A",
      unit: "unit",
    });

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Gedung A", brand: null }),
      }),
    );
    expect(res.brand).toBeNull();
  });

  it("updates an existing item and rejects non-existent item", async () => {
    prisma.item.findUnique.mockResolvedValueOnce(null);
    await expect(service.updateItem(UUID_1, { name: "Baru" })).rejects.toThrow(NotFoundException);

    prisma.item.findUnique.mockResolvedValueOnce({ id: UUID_1, subCategoryId: UUID_2 });
    prisma.item.update.mockResolvedValueOnce({ id: UUID_1, name: "Baru", brand: null });
    const updated = await service.updateItem(UUID_1, { name: "Baru", brand: null });
    expect(updated.brand).toBeNull();
  });

  it("rejects deleting an item already referenced by assetItems or procurementItems", async () => {
    prisma.item.findUnique.mockResolvedValueOnce({
      id: UUID_1,
      _count: { assetItems: 3, procurementItems: 0 },
    });
    await expect(service.deleteItem(UUID_1)).rejects.toThrow(ConflictException);

    prisma.item.findUnique.mockResolvedValueOnce({
      id: UUID_1,
      _count: { assetItems: 0, procurementItems: 1 },
    });
    await expect(service.deleteItem(UUID_1)).rejects.toThrow(ConflictException);
    expect(prisma.item.delete).not.toHaveBeenCalled();

    prisma.item.findUnique.mockResolvedValueOnce({
      id: UUID_1,
      _count: { assetItems: 0, procurementItems: 0 },
    });
    prisma.item.delete.mockResolvedValueOnce({ id: UUID_1 });
    await expect(service.deleteItem(UUID_1)).resolves.toMatchObject({ id: UUID_1 });
  });

  // --- ROOMS ---
  it("edits a room and prevents deleting rooms with assets, mutations, or audits", async () => {
    prisma.room.findUnique.mockResolvedValueOnce({ id: UUID_1, code: "R-01" });
    prisma.room.findUnique.mockResolvedValueOnce(null);
    prisma.room.update.mockResolvedValueOnce({ id: UUID_1, code: "R-02", name: "Lab Baru" });

    const updated = await service.updateRoom(UUID_1, { code: "R-02", name: "Lab Baru" });
    expect(updated.code).toBe("R-02");

    prisma.room.findUnique.mockResolvedValueOnce({
      id: UUID_1,
      _count: { currentAssets: 2, mutationsFrom: 0, mutationsTo: 0, scannedAudits: 0, systemAudits: 0 },
    });
    await expect(service.deleteRoom(UUID_1)).rejects.toThrow(ConflictException);

    prisma.room.findUnique.mockResolvedValueOnce({
      id: UUID_1,
      _count: { currentAssets: 0, mutationsFrom: 1, mutationsTo: 0, scannedAudits: 0, systemAudits: 0 },
    });
    await expect(service.deleteRoom(UUID_1)).rejects.toThrow(ConflictException);

    prisma.room.findUnique.mockResolvedValueOnce({
      id: UUID_1,
      _count: { currentAssets: 0, mutationsFrom: 0, mutationsTo: 0, scannedAudits: 0, systemAudits: 0 },
    });
    prisma.room.delete.mockResolvedValueOnce({ id: UUID_1 });
    await expect(service.deleteRoom(UUID_1)).resolves.toMatchObject({ id: UUID_1 });
  });

  // --- CATEGORIES ---
  it("supports category create/update and blocks delete when sub-categories exist", async () => {
    prisma.category.findUnique.mockResolvedValueOnce(null);
    prisma.category.create.mockResolvedValueOnce({ id: UUID_1, code: "H", name: "Khusus" });
    await expect(service.createCategory({ code: "H", name: "Khusus" })).resolves.toMatchObject({
      code: "H",
    });

    prisma.category.findUnique.mockResolvedValueOnce({
      id: UUID_1,
      _count: { subCategories: 2 },
    });
    await expect(service.deleteCategory(UUID_1)).rejects.toThrow(ConflictException);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  // --- SUB-CATEGORIES ---
  it("supports sub-category create/update and blocks delete when items exist", async () => {
    prisma.category.findUnique.mockResolvedValueOnce({ id: UUID_1, code: "C" });
    prisma.subCategory.findUnique.mockResolvedValueOnce(null);
    prisma.subCategory.create.mockResolvedValueOnce({ id: UUID_2, categoryId: UUID_1, code: "19", name: "CCTV" });
    await expect(
      service.createSubCategory({ categoryId: UUID_1, code: "19", name: "CCTV" }),
    ).resolves.toMatchObject({ code: "19" });

    prisma.subCategory.findUnique.mockResolvedValueOnce({
      id: UUID_2,
      _count: { items: 4 },
    });
    await expect(service.deleteSubCategory(UUID_2)).rejects.toThrow(ConflictException);
  });

  // --- FUNDING SOURCES ---
  it("supports funding-source create/update and blocks delete when procurements exist", async () => {
    prisma.fundingSource.findUnique.mockResolvedValueOnce(null);
    prisma.fundingSource.create.mockResolvedValueOnce({ id: UUID_1, code: "DAK", name: "DAK" });
    await expect(
      service.createFundingSource({ code: "DAK", name: "DAK" }),
    ).resolves.toMatchObject({ code: "DAK" });

    prisma.fundingSource.findUnique.mockResolvedValueOnce({
      id: UUID_1,
      _count: { procurements: 1 },
    });
    await expect(service.deleteFundingSource(UUID_1)).rejects.toThrow(ConflictException);
  });
});
