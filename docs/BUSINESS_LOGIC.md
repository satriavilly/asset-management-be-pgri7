# BUSINESS LOGIC & ALGORITHM SPECIFICATIONS
# Project: Sistem Informasi Manajemen Aset SMP PGRI 7 Bandung — Backend

---

## 1. Algoritma Auto-Generator Kode Inventaris

### Formula Baku:
```text
[Kategori].[SubKategori].[NoUrut].PGRI7.[Tahun]
```
Contoh: `C.02.010.PGRI7.2025`

### Langkah Eksekusi Backend:
1. Saat transaksi pengadaan (`procurement`) disubmit dengan item `item_id`:
   - Ambil kode kategori huruf dari `categories.code` (contoh: `C` untuk Elektronik).
   - Ambil kode sub-kategori dari `sub_categories.code` (contoh: `02` untuk Laptop).
   - Ambil tahun pengadaan dari `procurement_date` (contoh: `2025`).
2. Cari nilai urutan terakhir (*last sequence number*) di tabel `asset_items` yang memiliki prefix `[Kategori].[SubKategori].` dan suffix `.PGRI7.[Tahun]`:
   ```sql
   SELECT inventory_code FROM asset_items 
   WHERE inventory_code LIKE 'C.02.%.PGRI7.2025' 
   ORDER BY created_at DESC LIMIT 1;
   ```
3. Ekstrak 3-digit nomor urut (contoh `009`), tambahkan `+ 1` menjadi `010` (format 3 digit dengan padding nol di depan: `String(seq).padStart(3, '0')`).
4. Gabungkan string kode: `C.02.010.PGRI7.2025`.
5. Buat entitas fisik aset baru dan pasang data payload QR Code:
   ```json
   {
     "code": "C.02.010.PGRI7.2025",
     "item": "Laptop ThinkPad V14",
     "school": "SMP PGRI 7 Bandung",
     "url": "https://aset.smppgri7bdg.sch.id/scan/C.02.010.PGRI7.2025"
   }
   ```

---

## 2. Validasi Jadwal Peminjaman & Deteksi Bentrok (Overlap Conflict)

Aset tidak dapat dipinjam jika:
1. Status fisik aset `status != 'AVAILABLE'` (misal: sedang `UNDER_MAINTENANCE` atau `DISPOSED`).
2. Terdapat peminjaman lain pada aset yang sama dengan status `APPROVED` atau `ON_LOAN` yang tanggalnya bertubrukan:
   ```text
   (NewStartDate <= ExistingExpectedReturnDate) AND (NewExpectedReturnDate >= ExistingStartDate)
   ```

Jika kondisi di atas terpenuhi, endpoint `/loans` mengembalikan status `409 ConflictException`:
`"Asset is already booked or currently on loan for the requested dates"`.

---

## 3. Logika Rekonsiliasi Stock Opname Fisik vs Sistem

Saat sesi audit berlangsung (`audit_sessions`), Sarpras melakukan scanning barcode QR barang di ruangan tertentu (`scanned_room_id`).

### Klasifikasi Status Hasil Audit:
1. **`MATCH` (Sesuai):**  
   Fisik aset ditemukan, dan `scanned_room_id == asset_items.current_room_id`.
2. **`MISPLACED` (Salah Tempat / Terpindah Tanpa Mutasi):**  
   Fisik aset ditemukan di ruangan `scanned_room_id`, tetapi di database tercatat di ruangan lain (`scanned_room_id != asset_items.current_room_id`). Sistem menandai catatan rekomendasi mutasi ruangan otomatis.
3. **`MISSING` (Hilang / Belum Ditemukan):**  
   Aset yang tercatat di database seharusnya berada di ruangan tersebut, namun hingga sesi audit ditutup, tidak pernah terpindai oleh auditor.

---

## 4. Alur Input Manual Penyusutan Nilai (Manual Valuation)

Sesuai kesepakatan notulensi teknis dengan pihak sekolah:
- **TIDAK MENGGUNAKAN RUMUS DEPRESIASI OTOMATIS** (seperti garis lurus / saldo menurun).
- Nilai penyusutan dicatat secara langsung (*ad-hoc / manual*) oleh Wakasek Sarpras saat kondisi barang mengalami degradasi fisik atau pasca-servis.
- Saat Sarpras memanggil endpoint `PATCH /assets/:id/valuation`:
  - Request body memuat `current_value: number` dan `reason: string`.
  - Sistem meng-update kolom `asset_items.current_value`.
  - Sistem mencatat riwayat valuasi ke audit log agar histori perubahan nilai dapat ditelusuri di Buku Induk Inventaris.
