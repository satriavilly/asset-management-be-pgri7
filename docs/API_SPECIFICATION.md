# API SPECIFICATION (RESTful API)
# Project: Sistem Informasi Manajemen Aset SMP PGRI 7 Bandung — Backend
# Base URL: `/api/v1`

---

## 1. Standar Request & Response

### Format Response Sukses
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2026-11-10T14:00:00.000Z"
}
```

### Format Response Error
```json
{
  "success": false,
  "error": "ConflictException",
  "message": "Asset has an overlapping borrowing schedule on the requested dates",
  "statusCode": 409,
  "timestamp": "2026-11-10T14:00:00.000Z"
}
```

---

## 2. Ringkasan Endpoint per Modul

### A. Autentikasi (`/auth`)
| Method | Endpoint | Role Akses | Keterangan |
|---|---|---|---|
| `POST` | `/auth/login` | Publik | Login dengan identifier email/username & password |
| `GET` | `/auth/me` | Authenticated | Ambil profil user login saat ini & info role |
| `POST` | `/auth/refresh` | Authenticated | Refresh token sesi JWT |
| `POST` | `/auth/logout` | Authenticated | Invalidate token sesi |

### B. Master Data (`/master`)
| Method | Endpoint | Role Akses | Keterangan |
|---|---|---|---|
| `GET` | `/master/categories` | All | Ambil daftar kategori utama (A s.d G) |
| `POST` | `/master/categories` | Admin | Tambah kategori |
| `GET` | `/master/sub-categories`| All | Ambil daftar sub-kategori (filter by `category_id`) |
| `POST` | `/master/sub-categories`| Admin | Tambah sub-kategori |
| `GET` | `/master/items` | All | Ambil katalog barang (pencarian nama, merek, satuan) |
| `POST` | `/master/items` | Admin, Sarpras | Tambah jenis katalog barang |
| `GET` | `/master/rooms` | All | Ambil daftar ruangan, gedung, dan nama PJ Ruangan |
| `POST` | `/master/rooms` | Admin | Tambah ruangan baru |
| `GET` | `/master/funding-sources`| All | Ambil daftar sumber dana (Swadaya, BOS, RMP, Hibah) |

### C. Pengadaan & Registrasi Fisik Aset (`/procurements` & `/assets`)
| Method | Endpoint | Role Akses | Keterangan |
|---|---|---|---|
| `POST` | `/procurements` | Sarpras | Buat transaksi pengadaan baru + auto-generate fisik aset |
| `GET` | `/procurements` | All | Daftar histori pengadaan |
| `GET` | `/procurements/:id` | All | Detail pengadaan, nomor faktur, dan rincian item |
| `GET` | `/assets` | All | Daftar seluruh aset (filter: ruangan, kategori, kondisi, status) |
| `GET` | `/assets/:id` | All | Detail fisik aset, riwayat servis, riwayat mutasi |
| `GET` | `/assets/code/:inventoryCode` | All | Lookup aset via Kode Inventaris (hasil scan QR Code) |
| `PATCH` | `/assets/:id/valuation` | Sarpras | **Input manual nilai penyusutan aset terkini (`current_value`)** |
| `GET` | `/assets/:id/label` | Sarpras, Admin | Payload data stiker label cetak QR ukuran 10 cm x 5 cm |

### D. Peminjaman Aset (`/loans`)
| Method | Endpoint | Role Akses | Keterangan |
|---|---|---|---|
| `POST` | `/loans` | Guru, Eksternal, Sarpras | Ajukan permohonan peminjaman aset |
| `GET` | `/loans` | All | Daftar transaksi peminjaman |
| `GET` | `/loans/check-availability` | All | Cek ketersediaan aset & deteksi bentrok jadwal |
| `PATCH` | `/loans/:id/verify` | Sarpras | Persetujuan Sarpras (`APPROVED` / `REJECTED`) & penyerahan |
| `PATCH` | `/loans/:id/return` | Sarpras | Pengembalian barang, catat kondisi fisik & denda sanksi |

### E. Mutasi Antar Ruangan (`/mutations`)
| Method | Endpoint | Role Akses | Keterangan |
|---|---|---|---|
| `POST` | `/mutations` | Guru (PJ Ruangan), Sarpras | Ajukan permohonan mutasi aset antar ruangan |
| `GET` | `/mutations` | All | Daftar histori pengajuan mutasi |
| `PATCH` | `/mutations/:id/review`| Sarpras | Persetujuan mutasi (`APPROVED` / `REJECTED`) |
| `POST` | `/mutations/:id/execute`| Sarpras | Konfirmasi pemindahan fisik tuntas + update lokasi & DIR |
| `GET` | `/mutations/:id/bast` | All | Ambil payload siap cetak Berita Acara Mutasi (BAST) |

### F. Pelaporan Kerusakan & Pemeliharaan (`/maintenances`)
| Method | Endpoint | Role Akses | Keterangan |
|---|---|---|---|
| `POST` | `/maintenances/report` | Guru, Staf, Sarpras | Lapor kerusakan aset (+ upload foto via HP) |
| `GET` | `/maintenances` | All | Daftar laporan kerusakan & servis |
| `PATCH` | `/maintenances/:id/triage` | Sarpras | Triase perbaikan: `SELF` / `VENDOR` / `ESCALATED_DISPOSAL` |
| `PATCH` | `/maintenances/:id/complete`| Sarpras | Konfirmasi perbaikan selesai + input realisasi biaya servis |

### G. Stock Opname & Audit Fisik (`/audits`)
| Method | Endpoint | Role Akses | Keterangan |
|---|---|---|---|
| `POST` | `/audits/sessions` | Sarpras | Buka sesi jadwal audit stock opname baru |
| `GET` | `/audits/sessions` | All | Daftar sesi audit tahunan/semester |
| `POST` | `/audits/sessions/:id/scan`| Sarpras | Kirim data hasil scan QR fisik ruangan (realtime) |
| `GET` | `/audits/sessions/:id/reconciliation` | All | Kalkulasi selisih aset (Cocok, Beda Ruang, Hilang) |
| `POST` | `/audits/sessions/:id/close`| Sarpras | Tutup sesi audit & terbitkan Berita Acara Audit |

### H. Pemusnahan / Penghapusan Aset (`/disposals`)
| Method | Endpoint | Role Akses | Keterangan |
|---|---|---|---|
| `POST` | `/disposals` | Sarpras | Ajukan & catat pemusnahan aset (Berita Acara & 2 saksi) |
| `GET` | `/disposals` | All | Histori arsip aset yang dimusnahkan |
| `GET` | `/disposals/:id/bast` | All | Unduh file Berita Acara Pemusnahan (BAST) PDF |

### I. Dashboard & Ekspor Laporan (`/reports` & `/dashboard`)
| Method | Endpoint | Role Akses | Keterangan |
|---|---|---|---|
| `GET` | `/dashboard/executive` | All (Kepsek View) | Metrik ringkasan KPI aset + monitoring pengadaan, biaya servis, stock opname, & penghapusan |
| `GET` | `/reports/buku-induk/excel`| Kepsek, Sarpras, Admin| Download Buku Induk Inventaris format Excel (`.xlsx`) |
| `GET` | `/reports/buku-induk/pdf` | Kepsek, Sarpras, Admin| Download Buku Induk format PDF |
| `GET` | `/reports/dir/:roomId` | All | Download lembar Daftar Inventaris Ruangan (DIR) |
