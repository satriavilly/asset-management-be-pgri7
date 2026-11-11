# Sistem Informasi Manajemen Aset SMP PGRI 7 Bandung — Arsitektur & Alur Sistem

Dokumen ini menyajikan pemetaan arsitektur perangkat lunak, skema relasi database relasional, mesin alur bisnis (*state machines*), dan strategi kolaborasi Git yang telah diimplementasikan pada repositori Backend REST API (`asset-management-be-pgri7`).

---

## 🏛️ Arsitektur Aplikasi & Komposisi Modul (NestJS)

Arsitektur backend dibangun dengan pola modular NestJS yang memisahkan tanggung jawab (*separation of concerns*) antara lapisan HTTP Controller, Business Logic Service, Data Access (Prisma ORM), dan Middleware Keamanan (Guards, Interceptors, Filters).

```mermaid
flowchart TD
    accTitle: Arsitektur Modular Backend NestJS
    accDescr: Diagram blok struktur aplikasi backend NestJS yang menghubungkan lapisan client HTTP ke modul bisnis dan database PostgreSQL melalui Prisma ORM.

    subgraph CLIENT["🌐 Client Applications"]
        FE_ADMIN["Web Desktop (Admin TU)"]
        FE_SARPRAS["Mobile PWA (Sarpras)"]
        FE_KEPSEK["Mobile PWA (Kepsek - Read Only)"]
        FE_GURU["Mobile PWA (Guru / PJ Ruangan)"]
    end

    subgraph GATEWAY["🛡️ Security & Interceptor Layer"]
        GLOBAL_FILTER["GlobalHttpExceptionFilter"]
        GLOBAL_INTERCEPT["TransformResponseInterceptor<br/>{ success, data, message, timestamp }"]
        JWT_GUARD["JwtAuthGuard (Passport JWT)"]
        ROLES_GUARD["RolesGuard (RBAC 5 Peran)"]
    end

    subgraph MODULES["📦 Core Business Modules"]
        M_AUTH["AuthModule<br/>(Login, JWT, Bcrypt)"]
        M_USERS["UsersModule<br/>(User Management)"]
        M_MASTER["MasterModule<br/>(Kategori A-G, Items, Rooms, Dana)"]
        M_PROC["ProcurementsModule<br/>(Auto Code & QR Generator)"]
        M_ASSETS["AssetsModule<br/>(Valuasi Manual, Label 10x5 cm)"]
        M_LOANS["LoansModule<br/>(Cek Bentrok Jadwal, Denda)"]
        M_MUT["MutationsModule<br/>(Mutasi Antar Ruang & BAST)"]
        M_MAINT["MaintenancesModule<br/>(Triase: Self / Vendor / Hapus)"]
        M_AUDIT["AuditsModule<br/>(Stock Opname & Rekonsiliasi)"]
        M_DISP["DisposalsModule<br/>(BAST Hapus & 2 Saksi)"]
        M_REP["ReportsModule<br/>(Eksekutif Dashboard & ExcelJS)"]
    end

    subgraph DATA_LAYER["🗄️ Persistence Layer"]
        PRISMA["PrismaModule / PrismaClient<br/>(Global Connection Pooling)"]
        POSTGRES[("PostgreSQL 16 Database<br/>(UUID PKs, snake_case)")]
    end

    CLIENT -->|HTTPS JSON Request| GATEWAY
    GATEWAY --> MODULES
    MODULES --> PRISMA
    PRISMA --> POSTGRES

    classDef clientStyle fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1
    classDef gateStyle fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e
    classDef modStyle fill:#f1f5f9,stroke:#475569,stroke-width:1.5px,color:#0f172a
    classDef dbStyle fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#14532d

    class FE_ADMIN,FE_SARPRAS,FE_KEPSEK,FE_GURU clientStyle
    class GLOBAL_FILTER,GLOBAL_INTERCEPT,JWT_GUARD,ROLES_GUARD gateStyle
    class M_AUTH,M_USERS,M_MASTER,M_PROC,M_ASSETS,M_LOANS,M_MUT,M_MAINT,M_AUDIT,M_DISP,M_REP modStyle
    class PRISMA,POSTGRES dbStyle
```

---

## 🗄️ Diagram Relasi Entitas Database (Entity Relationship Diagram)

Skema database PostgreSQL mematuhi konvensi baku: seluruh Primary Key bertipe `UUID`, kode inventaris bukan PK, dan penamaan tabel/kolom konsisten menggunakan `lowercase snake_case`.

```mermaid
erDiagram
    accTitle: Entity Relationship Diagram SMP PGRI 7 Asset Management
    accDescr: Pemetaan relasi antar tabel database PostgreSQL mencakup pengguna, master data, transaksi pengadaan, fisik aset, peminjaman, mutasi, pemeliharaan, audit fisik, dan pemusnahan.

    users ||--o{ rooms : "menjadi PIC"
    users ||--o{ procurements : "mencatat"
    users ||--o{ asset_loans : "meminjam"
    users ||--o{ asset_mutations : "mengajukan"
    users ||--o{ asset_maintenances : "melaporkan"
    users ||--o{ audit_sessions : "mengaudit"
    users ||--o{ asset_disposals : "mengeksekusi"

    categories ||--o{ sub_categories : "memiliki"
    sub_categories ||--o{ items : "mengelompokkan"
    funding_sources ||--o{ procurements : "mendanai"
    procurements ||--o{ procurement_items : "merinci"
    items ||--o{ procurement_items : "dipesan"
    items ||--o{ asset_items : "katalog master"
    procurements ||--o{ asset_items : "asal perolehan"
    rooms ||--o{ asset_items : "tempat fisik"

    asset_items ||--o{ asset_loan_items : "dipinjamkan"
    asset_loans ||--o{ asset_loan_items : "memuat item"
    asset_items ||--o{ asset_mutations : "dipindahkan"
    rooms ||--o{ asset_mutations : "ruangan asal"
    rooms ||--o{ asset_mutations : "ruangan tujuan"

    asset_items ||--o{ asset_maintenances : "diperbaiki"
    audit_sessions ||--o{ audit_items : "berisi record"
    asset_items ||--o{ audit_items : "diverifikasi fisik"
    rooms ||--o{ audit_items : "ruangan scan"
    asset_items ||--o| asset_disposals : "dimusnahkan"

    users {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar full_name
        enum role
        boolean is_active
    }

    categories {
        uuid id PK
        varchar code UK "A s.d G"
        varchar name
    }

    sub_categories {
        uuid id PK
        uuid category_id FK
        varchar code "01 s.d 20"
        varchar name
    }

    items {
        uuid id PK
        uuid sub_category_id FK
        varchar name
        varchar brand
        varchar unit
    }

    rooms {
        uuid id PK
        varchar code UK
        varchar name
        uuid pic_user_id FK
    }

    procurements {
        uuid id PK
        varchar procurement_no UK
        uuid funding_source_id FK
        date procurement_date
        decimal total_amount
    }

    asset_items {
        uuid id PK
        varchar inventory_code UK "C.02.010.PGRI7.2025"
        uuid item_id FK
        uuid procurement_id FK
        uuid current_room_id FK
        decimal acquisition_price
        decimal current_value
        enum condition "GOOD, SLIGHTLY_DAMAGED, etc"
        enum status "AVAILABLE, BORROWED, etc"
        boolean is_disposed
    }
```

---

## ⚙️ Logika Algoritma Auto-Generator Kode Inventaris

Formula: `[Kategori].[SubKategori].[NoUrut].PGRI7.[Tahun]` *(Contoh: `C.02.010.PGRI7.2025`)*

```mermaid
sequenceDiagram
    accTitle: Alur Eksekusi Auto Generator Kode Inventaris
    accDescr: Diagram sequence interaksi sistem saat transaksi pengadaan baru diinput oleh Sarpras hingga fisik aset dan QR Code terbuat otomatis.

    autonumber
    actor Sarpras as Wakasek Sarpras
    participant Controller as ProcurementsController
    participant Service as ProcurementsService
    participant DB as PostgreSQL (Transaction)
    participant QR as QRCode Engine

    Sarpras->>Controller: POST /api/v1/procurements (item_id, qty=10, harga, ruangan)
    Controller->>Service: createProcurement(dto, userId)
    Service->>DB: BEGIN TRANSACTION
    Service->>DB: INSERT INTO procurements (faktur, dana, tanggal, total)
    Service->>DB: INSERT INTO procurement_items (qty, unit_price, total_price)
    
    loop Setiap Unit Barang (1 s.d 10)
        Service->>DB: SELECT inventory_code FROM asset_items WHERE code LIKE 'C.02.%.PGRI7.2025' ORDER BY code DESC LIMIT 1
        DB-->>Service: 'C.02.009.PGRI7.2025' (sequence terakhir = 9)
        Service->>Service: Hitung sequence baru: 9 + 1 = 10 -> padStart(3, '0') -> '010'
        Service->>Service: Susun kode: 'C.02.010.PGRI7.2025'
        Service->>QR: Generate payload JSON & Base64 Data URL
        QR-->>Service: data:image/png;base64,...
        Service->>DB: INSERT INTO asset_items (inventory_code, item_id, room_id, acquisition_price, currentValue, status=AVAILABLE, qr_code_url)
    end
    
    Service->>DB: COMMIT TRANSACTION
    DB-->>Controller: Transaksi & 10 Aset Selesai Dibuat
    Controller-->>Sarpras: HTTP 201 Created (procurement, list kode, status sukses)
```

---

## 🔄 Mesin Status & Alur Transaksi Utama (State Machines)

### 1. Peminjaman Aset & Deteksi Bentrok Jadwal
Peminjaman memvalidasi rentang tanggal agar tidak terjadi bentrok pemakaian aset di hari yang sama.

```mermaid
stateDiagram-v2
    accTitle: Mesin Status Peminjaman Aset
    accDescr: Siklus hidup status peminjaman dari pengajuan, pengecekan ketersediaan, persetujuan Sarpras, pemakaian barang, hingga pengembalian dan sanksi.

    [*] --> PENDING: Form Pengajuan Disubmit (Guru / Eksternal)
    PENDING --> REJECTED: Sarpras Tolak / Jadwal Bentrok
    PENDING --> ON_LOAN: Sarpras Setujui & Serah Terima Fisik (Aset -> BORROWED)
    ON_LOAN --> RETURNED: Fisik Barang Dikembalikan
    RETURNED --> [*]: Catat Kondisi Fisik & Denda Sanksi (Aset -> AVAILABLE)
    REJECTED --> [*]
```

### 2. Triase Kerusakan & Siklus Pemeliharaan
Laporan kerusakan diverifikasi langsung di lapangan oleh Wakasek Sarpras dengan 3 opsi penanganan:

```mermaid
flowchart TD
    accTitle: Triase Penanganan Kerusakan Aset
    accDescr: Alur percabangan penanganan kerusakan aset sekolah dari pelaporan guru hingga tindakan perbaikan mandiri, servis pihak luar, atau eskalasi ke penghapusan.

    LAPOR["Guru Lapor Kerusakan<br/>(Scan QR + Upload Foto HP)"] --> STATUS_REPORTED["Status: DILAPORKAN RUSAK<br/>(Kondisi: Rusak Ringan)"]
    STATUS_REPORTED --> INSPEKSI["Inspeksi Fisik Lapangan<br/>oleh Wakasek Sarpras"]
    
    INSPEKSI -->|Kerusakan Ringan| MANDIRI["Perbaikan Mandiri<br/>oleh Tim Sarpras Sekolah"]
    INSPEKSI -->|Perlu Alat Khusus| VENDOR["Panggil Teknisi / Bengkel Luar<br/>(Catat Nama Vendor & Biaya)"]
    INSPEKSI -->|Rusak Parah / Fatal| DISPOSAL_ESC["Alihkan ke Pemusnahan Aset<br/>(Kondisi: Rusak Berat)"]
    
    MANDIRI --> SELESAI["Uji Fungsi Berhasil"]
    VENDOR --> SELESAI
    SELESAI --> RESTORE["Status Aset: TERSEDIA<br/>Kondisi Aset: BAIK"]
    DISPOSAL_ESC --> PENGHAPUSAN["Masuk ke Modul Pemusnahan<br/>(Asset Disposal)"]

    classDef green fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
    classDef yellow fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e
    classDef red fill:#fee2e2,stroke:#dc2626,stroke-width:1.5px,color:#991b1b

    class RESTORE green
    class MANDIRI,VENDOR yellow
    class DISPOSAL_ESC,PENGHAPUSAN red
```

### 3. Rekonsiliasi Stock Opname Fisik vs Sistem
Algoritma pengecekan kecocokan aset saat auditor keliling ruangan memindai QR Code via smartphone:

```mermaid
flowchart TD
    accTitle: Algoritma Rekonsiliasi Audit Fisik
    accDescr: Logika pembandingan data hasil scan QR Code fisik terhadap data ruangan yang terdaftar di database untuk mendeteksi selisih aset.

    SCAN["Scan QR Code Aset di Ruangan (scanned_room_id)"] --> QUERY["Query Database (current_room_id)"]
    QUERY --> CEK{scanned_room_id == current_room_id?}
    
    CEK -->|YA| RES_MATCH["Status: MATCH (Sesuai)<br/>Barang berada di lokasi yang sah"]
    CEK -->|TIDAK| RES_MISPLACED["Status: MISPLACED (Salah Ruang)<br/>Barang ditemukan di lokasi berbeda<br/>(Rekomendasikan Mutasi)"]
    
    AUDIT_CLOSE["Sesi Audit Ditutup"] --> CEK_SISA["Cari Aset Terdaftar yang Tidak Pernah Terpindai"]
    CEK_SISA --> RES_MISSING["Status: MISSING (Belum Ditemukan)<br/>Barang hilang atau tidak ada di ruangan"]

    classDef green fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
    classDef yellow fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e
    classDef red fill:#fee2e2,stroke:#dc2626,stroke-width:1.5px,color:#991b1b

    class RES_MATCH green
    class RES_MISPLACED yellow
    class RES_MISSING red
```

---

## 🌿 Alur Kolaborasi Git & Siklus Rilis (Branching Strategy)

Pengembangan mematuhi alur resmi: kode fitur dikerjakan di branch personal (`dev-rakan`), diajukan melalui Pull Request ke `staging` untuk pengujian QA, sebelum digabung ke `main` untuk rilis.

```mermaid
gitGraph
    accTitle: Alur Branching Git Kolaborasi Tim
    accDescr: Visualisasi alur commit dari branch pengembangan pribadi dev-rakan menuju branch staging untuk pengujian QA hingga rilis ke branch production main.

    commit id: "b9340cd (Update README)"
    branch staging
    checkout staging
    commit id: "Initial Staging"
    
    branch dev-rakan
    checkout dev-rakan
    commit id: "02e0045 (Docs & Guidelines)"
    commit id: "85ade04 (Core NestJS & Prisma)"
    commit id: "c72ca6b (Compatibility Fix)"
    
    checkout staging
    merge dev-rakan id: "PR #1 (dev-rakan -> staging)" tag: "QA-Testing"
    
    checkout main
    merge staging id: "Release 1.0.0" tag: "v1.0.0-prod"
```
