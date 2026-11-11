# AGENTS.md — Backend Engineering Directives
# Project: Sistem Informasi Manajemen Aset SMP PGRI 7 Bandung (Backend API)
# Stack: NestJS (TypeScript) + PostgreSQL + Prisma ORM + JWT RBAC

---

## 1. Project Context & Purpose
Repository ini adalah layanan **Backend REST API** untuk Sistem Informasi Pengelolaan Aset & Sarana Prasarana **SMP PGRI 7 Bandung** (Program Pengabdian kepada Masyarakat / TPLM Telkom University).
Tujuan utama sistem adalah mendigitalkan Buku Induk Sarana dan Prasarana (Sapras) sekolah yang sebelumnya manual berbasis spreadsheet, mencakup siklus hidup aset lengkap: inventarisasi, pengadaan, pencetakan stiker QR label, peminjaman barang, pelaporan kerusakan & pemeliharaan, mutasi ruangan, stock opname fisik berkala, hingga penghapusan aset.

Sistem dirancang mandiri untuk tahap 1, namun arsitektur autentikasi & datanya disiapkan untuk terhubung ke **Single Portal** sekolah di masa mendatang bersama modul Keuangan.

---

## 2. Core Constraints & Golden Rules (STRICT — DO NOT VIOLATE)

### A. Database Rules (PostgreSQL)
1. **Primary Key Wajib UUID:**  
   Setiap tabel **WAJIB** menggunakan `UUID` sebagai Primary Key (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`).
2. **Kode Inventaris BUKAN Primary Key:**  
   Kode barang (`inventory_code`) **DILARANG KERAS** dijadikan Primary Key. Kolom `inventory_code` disimpan tersendiri dengan tipe `VARCHAR` dan diberi indeks `UNIQUE / BTREE` untuk performa query pencarian.
3. **Konvensi Bahasa & Naming Case:**  
   Seluruh nama tabel dan kolom **WAJIB** menggunakan Bahasa Inggris, huruf kecil semua (`lowercase`), dan pemisah garis bawah (`snake_case`). Contoh: `procurement_date`, `acquisition_price`, `funding_sources`, `asset_mutations`.
4. **Pemisahan Entitas Master vs Transaksi:**  
   - Master Barang (`items`): Menyimpan atribut bawaan barang seperti nama, merek (`brand`), satuan (`unit`), dan spesifikasi umum.  
   - Transaksi Pengadaan (`procurements`): Menyimpan harga perolehan (`acquisition_price`), tanggal pengadaan (`procurement_date`), jumlah barang (`quantity`), sumber dana (`funding_source_id`), dan nomor faktur/BAST.

### B. Role-Based Access Control (RBAC) Rules
Sistem memiliki 5 peran pengguna (*roles*) dengan batasan otoritas yang tegas:
- **`ADMIN` (Staff TU / IT):** Manajemen pengguna (CRUD user & role), konfigurasi master data (kategori, ruangan, sumber dana), dan audit logs.
- **`SARPRAS` (Wakasek Bidang Sarpras):** **Aktor Operasional Utama.** Berhak menginput pengadaan terpusat, memvalidasi peminjaman internal/eksternal, mengeksekusi mutasi ruangan, menindaklanjuti kerusakan, input manual penyusutan nilai, melakukan audit fisik (stock opname), dan memproses pemusnahan aset (BAST & saksi).
- **`KEPSEK` (Kepala Sekolah):** **MURNI MONITORING (READ-ONLY).**  
  ⚠️ **PENTING:** Kepsek **TIDAK MEMILIKI** tombol aksi *approval* atau *rejection* di dalam aplikasi. Akses Kepsek murni HTTP `GET` untuk membaca metrik dashboard eksekutif (total aset, nilai aset, kondisi fisik) dan mengunduh laporan Buku Induk / DIR.
- **`GURU` / Penanggung Jawab Ruangan (`PJ_RUANGAN`):** Mengajukan peminjaman aset, mengajukan mutasi barang antar ruangan, melaporkan kerusakan fisik (scan QR + upload foto), dan melihat Daftar Inventaris Ruangan (DIR).
- **`EKSTERNAL` (Publik / Pihak Luar):** Mengajukan permohonan peminjaman aset sekolah (contoh: pengurus RT/RW setempat) dan melihat info publik saat scan QR Code.

### C. Out of Scope / Forbidden Features (Ditiadakan)
- ❌ **TIDAK ADA notifikasi WhatsApp atau Email** (biaya dieliminasi, gunakan notifikasi in-app / status polling).
- ❌ **TIDAK ADA pengajuan pengadaan mandiri oleh guru/unit** (semua kebutuhan dikoleksi manual dan diinput terpusat oleh Wakasek Sarpras).
- ❌ **TIDAK ADA integrasi otomatis ke sistem anggaran / RKAS sekolah.**
- ❌ **TIDAK ADA rumus depresiasi otomatis akuntansi** (penyusutan nilai barang diinput secara **manual** oleh pihak sekolah sesuai kondisi riil).

---

## 3. Business Logic Specifications

### A. Formula Kode Inventaris Otomatis
Setiap kali fisik aset dicatat, backend wajib men-generate kode unik dengan format baku:
```text
[Kategori].[SubKategori].[NoUrut].PGRI7.[Tahun]
```
Contoh:
- Laptop Lenovo V14 pengadaan tahun 2025: `C.02.010.PGRI7.2025`
- Kursi Siswa kayu pengadaan tahun 2026: `B.02.045.PGRI7.2026`
- Kategori A-G mengacu pada Klasifikasi Buku Induk SMP PGRI 7 Bandung. Nomor urut di-reset per kombinasi sub-kategori dan tahun.

### B. Transaksi Peminjaman (Loan Scheduling Conflict)
- Endpoint peminjaman harus memvalidasi tanggal mulai (`start_date`) dan tanggal selesai (`end_date`).
- Sistem wajib mengecek apakah aset sedang dalam status `BORROWED` atau sudah memiliki jadwal peminjaman aktif yang saling tumpang tindih (*overlapping schedule check*).
- Saat pengembalian, Sarpras mencatat kondisi barang. Jika rusak/hilang, sistem menyediakan field `penalty_notes` (catatan ganti rugi/sanksi).

### C. Mutasi Aset Antar Ruangan (Asset Mutation Flow)
- PJ Ruangan mengajukan perpindahan aset dari `from_room_id` ke `to_room_id` dengan menyertakan alasan.
- Status mutasi: `PENDING` -> Sarpras verifikasi (`APPROVED` / `REJECTED`).
- Ketika disetujui:
  1. Kolom `current_room_id` pada entitas aset di-update otomatis.
  2. Record mutasi tercatat pada histori audit mutasi.
  3. Dokumen BAST Mutasi dapat di-generate otomatis.

### D. Triase Pelaporan Kerusakan (Maintenance Triage)
- Laporan kerusakan masuk dengan status `REPORTED` disertai URL foto bukti kerusakan.
- Wakasek Sarpras melakukan inspeksi fisik dan memilih salah satu dari 3 tindakan:
  1. `REPAIR_INTERNAL`: Perbaikan mandiri oleh Sarpras -> status aset kembali `GOOD`.
  2. `REPAIR_VENDOR`: Servis pihak ketiga -> catat estimasi/realisasi biaya (`cost`) dan nama vendor -> status kembali `GOOD`.
  3. `HEAVY_DAMAGE`: Rusak berat / tidak ekonomis diperbaiki -> status aset dialihkan ke `ESCALATED_DISPOSAL` untuk proses pemusnahan aset.

### E. Stock Opname & Kalkulasi Selisih (Discrepancy Reconciliation)
- Sarpras membuka sesi audit berkala (`audit_sessions`).
- Sarpras keliling memindai QR Code aset per ruangan via HP dan menginput kondisi fisik riil (`GOOD`, `DAMAGED`, `LOST`).
- Backend membandingkan data scan fisik terhadap database:
  - `MATCH`: Aset ada dan berada di ruangan yang sesuai.
  - `MISPLACED`: Aset ada tetapi fisiknya ditemukan di ruangan lain (rekomendasikan mutasi).
  - `MISSING`: Aset terdaftar di sistem namun tidak ditemukan saat pemindaian fisik.
- Menghasilkan rekapitulasi Berita Acara Audit Fisik.

### F. Pemusnahan Aset (Asset Disposal)
- Perekaman aset yang dihapus **wajib** menyertakan nomor Berita Acara Penghapusan (`disposal_letter_no`), tanggal pemusnahan, alasan (`DAMAGED_BEYOND_REPAIR`, `LOST`, `SOLD`, `DONATED`), serta identitas 2 orang saksi pemusnahan (`witness_1_name`, `witness_2_name`).
- Data fisik aset diarsipkan (*soft-delete* dengan flag `is_disposed = true` atau `deleted_at`) agar histori nomor registrasi tidak hilang dari Buku Induk.

---

## 4. Architecture & Coding Conventions (NestJS)

```text
src/
├── common/                 # Guards, Interceptors, Filters, Decorators, Constants
│   ├── decorators/         # @Roles(), @CurrentUser()
│   ├── filters/            # Global HttpExceptionsFilter
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   └── interceptors/       # TransformResponseInterceptor, LoggingInterceptor
├── config/                 # Environment validation via Joi / Zod
├── database/               # PrismaService, PrismaModule, Seeders
├── modules/
│   ├── auth/               # Login, Register, JWT, Password Hashing (Argon2 / Bcrypt)
│   ├── users/              # User management & RBAC
│   ├── master/             # Categories, Sub-categories, Items, Rooms, Funding Sources
│   ├── procurements/       # Pengadaan & auto-generation barcode/kode inventaris
│   ├── assets/             # Master item fisik, status, print label QR
│   ├── loans/              # Peminjaman & pengembalian aset
│   ├── maintenances/       # Kerusakan & pemeliharaan (internal/vendor)
│   ├── mutations/          # Mutasi ruangan & BAST
│   ├── audits/             # Sesi stock opname & kalkulasi selisih
│   ├── disposals/          # Penghapusan aset, Berita Acara, & saksi
│   └── reports/            # Export Buku Induk & DIR ke Excel (.xlsx) dan PDF
├── app.module.ts
└── main.ts
```

### Directives for Writing NestJS Code:
1. **Validation & DTOs:** Setiap request body **wajib** memiliki kelas DTO dengan dekorator `class-validator` (`@IsString()`, `@IsUUID()`, `@IsEnum()`, dll.) dan `class-transformer`.
2. **Standardized API Response:** Semua respons sukses dibungkus dengan format terpadu:
   ```json
   {
     "success": true,
     "data": { ... },
     "message": "Resource successfully retrieved",
     "timestamp": "2026-11-10T12:00:00.000Z"
   }
   ```
3. **Swagger / OpenAPI:** Dokumentasikan setiap endpoint dengan `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`, dan `@ApiBearerAuth()`.
4. **Error Handling:** Jangan pernah melempar string biasa. Gunakan `HttpException` resmi (`NotFoundException`, `BadRequestException`, `ForbiddenException`, `ConflictException`).

---

## 5. Git & Collaboration Workflow
1. Kembangkan fitur di repository pribadi atau branch fitur lokal: `feat/<nama-fitur>` atau `fix/<nama-bug>`.
2. Lakukan Pull Request ke branch **`staging`** pada repository upstream:  
   `https://github.com/satriavilly/asset-management-be-pgri7.git`
3. Branch `staging` akan di-test oleh tim QA (Naufal & Raka) sebelum dirilis ke `main/production`.
4. Pastikan pesan commit mengikuti standar Conventional Commits:  
   `feat(procurements): implement auto-generator inventory code formula`  
   `fix(loans): prevent scheduling overlap on asset borrowing`
