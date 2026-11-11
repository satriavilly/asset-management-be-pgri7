import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting SMP PGRI 7 Bandung Master Data Seeding...");

  // 1. Funding Sources
  const fundingSources = [
    { code: "SWADAYA", name: "Swadaya Sekolah", description: "Dana Mandiri / SPP / Komite Sekolah" },
    { code: "RMP", name: "Bantuan RMP", description: "Bantuan Rawat Mandiri Pendidikan (Pemerintah Kota Bandung)" },
    { code: "BOS", name: "BOS Reguler", description: "Bantuan Operasional Sekolah (Pemerintah Pusat)" },
    { code: "HIBAH", name: "Bantuan Hibah", description: "Hibah / Bantuan Khusus Pemerintah atau Alumni" },
  ];

  for (const fs of fundingSources) {
    await prisma.fundingSource.upsert({
      where: { code: fs.code },
      update: {},
      create: fs,
    });
  }
  console.log("✅ Funding sources seeded.");

  // 2. Categories & Sub-Categories (Buku Induk PGRI 7 Standard)
  const categoryCatalog = [
    {
      code: "A",
      name: "Tanah dan Bangunan",
      description: "Aset tetap berupa lahan, gedung, dan prasarana fisik dasar",
      subCategories: [
        { code: "01", name: "Tanah" },
        { code: "02", name: "Bangunan" },
        { code: "03", name: "Lain-lain" },
      ],
    },
    {
      code: "B",
      name: "Meubelair",
      description: "Perabotan mebel kelas, kantor, dan ruang rapat",
      subCategories: [
        { code: "01", name: "Meja Siswa" },
        { code: "02", name: "Kursi Siswa" },
        { code: "03", name: "Meja Guru" },
        { code: "04", name: "Kursi Guru" },
        { code: "05", name: "Kursi Stainless" },
        { code: "06", name: "Kursi Meeting" },
        { code: "07", name: "Kursi Lipat" },
        { code: "08", name: "Kursi Plastik" },
        { code: "09", name: "Lemari" },
        { code: "10", name: "File Kabinet" },
        { code: "11", name: "Loker" },
        { code: "12", name: "Brankas" },
        { code: "13", name: "Bufet" },
        { code: "14", name: "Papan Tulis" },
        { code: "15", name: "Meja Rapat" },
        { code: "16", name: "Mading" },
        { code: "17", name: "Lain-lain" },
      ],
    },
    {
      code: "C",
      name: "Elektronik",
      description: "Peralatan komputasi, multimedia, audio visual, dan elektronik",
      subCategories: [
        { code: "01", name: "Komputer" },
        { code: "02", name: "Laptop" },
        { code: "03", name: "Printer" },
        { code: "04", name: "Scanner" },
        { code: "05", name: "Radio" },
        { code: "06", name: "Proyektor" },
        { code: "07", name: "Kamera Foto" },
        { code: "08", name: "Handycam" },
        { code: "09", name: "Televisi" },
        { code: "10", name: "Speaker" },
        { code: "11", name: "Amplifier" },
        { code: "12", name: "Telpon/HP" },
        { code: "13", name: "UPS/Stabilizer" },
        { code: "14", name: "CCTV" },
        { code: "15", name: "AC" },
        { code: "16", name: "Dispenser" },
        { code: "17", name: "Megaphone" },
        { code: "18", name: "Kipas Angin" },
        { code: "19", name: "Mesin Fotocopy" },
        { code: "20", name: "Lain-lain" },
      ],
    },
    {
      code: "D",
      name: "Mekanik",
      description: "Peralatan mekanik dan pertukangan mesin",
      subCategories: [
        { code: "01", name: "Bor" },
        { code: "02", name: "Lain-lain" },
      ],
    },
    {
      code: "E",
      name: "Alat Rumah Tangga",
      description: "Perlengkapan kebersihan, sanitasi, dan tangga",
      subCategories: [
        { code: "01", name: "Tangga" },
        { code: "02", name: "Kompor Gas" },
        { code: "03", name: "Tabung Gas" },
        { code: "04", name: "Alat Makan Minum" },
        { code: "05", name: "Alat Pertukangan" },
        { code: "06", name: "Alat Kebersihan" },
        { code: "07", name: "Lain-lain" },
      ],
    },
    {
      code: "F",
      name: "Pendukung KBM",
      description: "Alat peraga edukasi, laboratorium, kesenian, dan olahraga",
      subCategories: [
        { code: "01", name: "Pramuka/Paskibra" },
        { code: "02", name: "Alat Seni" },
        { code: "03", name: "Alat Musik" },
        { code: "04", name: "Alat UKS" },
        { code: "05", name: "Alat Olahraga" },
        { code: "06", name: "Buku Perpustakaan" },
        { code: "07", name: "Alat Peraga Matematika" },
        { code: "08", name: "Alat Peraga IPA" },
        { code: "09", name: "Alat Peraga IPS" },
        { code: "10", name: "Lain-lain" },
      ],
    },
    {
      code: "G",
      name: "ATK (Habis Pakai)",
      description: "Alat tulis kantor dan bahan habis pakai operasional",
      subCategories: [
        { code: "01", name: "Kertas A4" },
        { code: "02", name: "Kertas F4" },
        { code: "03", name: "Pulpen" },
        { code: "04", name: "Pensil" },
        { code: "05", name: "Spidol" },
        { code: "06", name: "Penghapus Papan Tulis" },
        { code: "07", name: "Tinta Printer" },
        { code: "08", name: "Bak Stempel" },
        { code: "09", name: "Isi Hekter" },
        { code: "10", name: "Lakban Bening" },
        { code: "11", name: "Lakban Hitam" },
        { code: "12", name: "Kertas Jilid" },
        { code: "13", name: "Amplop" },
        { code: "14", name: "Map" },
        { code: "15", name: "Tinta Spidol" },
        { code: "16", name: "Double Tape" },
        { code: "17", name: "Lain-lain" },
      ],
    },
  ];

  for (const cat of categoryCatalog) {
    const createdCat = await prisma.category.upsert({
      where: { code: cat.code },
      update: { name: cat.name, description: cat.description },
      create: {
        code: cat.code,
        name: cat.name,
        description: cat.description,
      },
    });

    for (const sub of cat.subCategories) {
      await prisma.subCategory.upsert({
        where: {
          categoryId_code: {
            categoryId: createdCat.id,
            code: sub.code,
          },
        },
        update: { name: sub.name },
        create: {
          categoryId: createdCat.id,
          code: sub.code,
          name: sub.name,
        },
      });
    }
  }
  console.log("✅ Categories (A-G) and sub-categories seeded.");

  // 3. Default Users with secure hashed password
  const defaultPassword = await bcrypt.hash("Pgri7Bdg#2026!", 10);
  const defaultUsers = [
    {
      username: "admin",
      email: "admin@smppgri7bdg.sch.id",
      fullName: "Administrator TU",
      role: UserRole.ADMIN,
      phoneNumber: "081234567801",
    },
    {
      username: "sarpras",
      email: "sarpras@smppgri7bdg.sch.id",
      fullName: "Wakasek Bidang Sarpras",
      role: UserRole.SARPRAS,
      phoneNumber: "081234567802",
    },
    {
      username: "kepsek",
      email: "kepsek@smppgri7bdg.sch.id",
      fullName: "Kepala Sekolah SMP PGRI 7",
      role: UserRole.KEPSEK,
      phoneNumber: "081234567803",
    },
    {
      username: "guru_lab",
      email: "gurulab@smppgri7bdg.sch.id",
      fullName: "Drs. Ahmad Hidayat (PJ Lab Komputer)",
      role: UserRole.GURU,
      nipNuptk: "197805122005011002",
      phoneNumber: "081234567804",
    },
    {
      username: "eksternal_rt",
      email: "rt04@kencanawangi.net",
      fullName: "Ketua RT 04 Kencanawangi (Warga Mitra)",
      role: UserRole.EKSTERNAL,
      phoneNumber: "081234567805",
    },
  ];

  for (const u of defaultUsers) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { role: u.role, fullName: u.fullName },
      create: {
        username: u.username,
        email: u.email,
        passwordHash: defaultPassword,
        fullName: u.fullName,
        role: u.role,
        nipNuptk: u.nipNuptk,
        phoneNumber: u.phoneNumber,
      },
    });
  }
  console.log("✅ Default users (ADMIN, SARPRAS, KEPSEK, GURU, EKSTERNAL) seeded.");

  // 4. Default Rooms
  const guruUser = await prisma.user.findUnique({ where: { username: "guru_lab" } });

  const defaultRooms = [
    { code: "R-KEPSEK", name: "Ruang Kepala Sekolah", buildingName: "Gedung Utama", floor: 1 },
    { code: "R-TU", name: "Ruang Tata Usaha", buildingName: "Gedung Utama", floor: 1 },
    { code: "R-GURU", name: "Ruang Guru", buildingName: "Gedung Utama", floor: 1 },
    { code: "LAB-KOMP-1", name: "Laboratorium Komputer 1", buildingName: "Gedung B", floor: 2, picUserId: guruUser?.id },
    { code: "LAB-IPA", name: "Laboratorium IPA", buildingName: "Gedung B", floor: 2 },
    { code: "PERPUS", name: "Perpustakaan Sekolah", buildingName: "Gedung Utama", floor: 2 },
    { code: "KELAS-7A", name: "Ruang Kelas 7A", buildingName: "Gedung A", floor: 1 },
    { code: "KELAS-8A", name: "Ruang Kelas 8A", buildingName: "Gedung A", floor: 2 },
    { code: "KELAS-9A", name: "Ruang Kelas 9A", buildingName: "Gedung A", floor: 2 },
  ];

  for (const r of defaultRooms) {
    await prisma.room.upsert({
      where: { code: r.code },
      update: { name: r.name, buildingName: r.buildingName, floor: r.floor },
      create: r,
    });
  }
  console.log("✅ Default rooms seeded.");

  console.log("✨ Master data seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
