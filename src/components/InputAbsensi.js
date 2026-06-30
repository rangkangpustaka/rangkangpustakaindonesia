// src/components/InputAbsensi.js
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import ScannerModal from "./ScannerModal"; // IMPOR KAMERA

export default function InputAbsensi() {
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [keperluan, setKeperluan] = useState("Membaca Buku");
  const [keperluanLainnya, setKeperluanLainnya] = useState("");
  const [kategori, setKategori] = useState("Anak-anak (SD/SMP)");
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);
  
  const [tampilkanKamera, setTampilkanKamera] = useState(false);

  // KETIKA KARTU BERHASIL DI-SCAN
  const handleScanBerhasil = (dataQR) => {
    setTampilkanKamera(false);
    if (dataQR.startsWith("ANGGOTA|")) {
      const dataPisah = dataQR.split("|");
      setNama(dataPisah[2]);    // Mengambil Nama dari QR
      setAlamat(dataPisah[3]);  // Mengambil Alamat dari QR
      // Opsional: Langsung mainkan suara "BIP" di sini jika ada
    } else {
      alert("⚠️ QR Code tidak valid! Pastikan ini adalah Kartu Anggota Rangkang Pustaka.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const finalKeperluan = keperluan === "Lainnya" ? keperluanLainnya : keperluan;

    try {
      await addDoc(collection(db, "absensi"), {
        nama, alamat, keperluan: finalKeperluan, kategori,
        tanggal: new Date().toLocaleDateString("id-ID"),
        waktu: new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp(),
      });
      setNama(""); setAlamat(""); setKeperluan("Membaca Buku"); setKeperluanLainnya(""); setKategori("Anak-anak (SD/SMP)");
      setSukses(true); setTimeout(() => setSukses(false), 4000); 
    } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl border-t-8 border-[#fec700]">
      {tampilkanKamera && <ScannerModal title="Scan Kartu Anggota" onScan={handleScanBerhasil} onClose={() => setTampilkanKamera(false)} />}
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-[#8e0004] uppercase tracking-wider">Buku Tamu</h2>
        <button type="button" onClick={() => setTampilkanKamera(true)} className="mt-3 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md">
          📷 Scan Kartu Anggota
        </button>
      </div>

      {sukses && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 flex gap-3"><span className="text-2xl">🎉</span><div><p className="font-bold text-green-800">Terima Kasih, {nama}!</p></div></div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-gray-700">Nama Lengkap</label>
          <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full p-3 mt-1 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004]" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-700">Asal Sekolah / Desa</label>
          <input type="text" required value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full p-3 mt-1 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004]">
            <option value="Anak-anak (SD/SMP)">Anak-anak</option><option value="Remaja (SMA/Kuliah)">Remaja</option><option value="Dewasa / Umum">Dewasa</option>
          </select>
          <select value={keperluan} onChange={(e) => setKeperluan(e.target.value)} className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004]">
            <option value="Membaca Buku">Membaca</option><option value="Meminjam Buku">Meminjam</option><option value="Lainnya">Lainnya...</option>
          </select>
        </div>
        {keperluan === "Lainnya" && (<input type="text" required value={keperluanLainnya} onChange={(e) => setKeperluanLainnya(e.target.value)} placeholder="Tuliskan..." className="w-full p-3 mt-1 border-2 rounded-xl bg-gray-50" />)}
        <button type="submit" disabled={loading} className="w-full py-4 bg-[#8e0004] text-white font-black rounded-xl hover:bg-red-900 shadow-lg">
          {loading ? "Menyimpan..." : "✔️ Hadir"}
        </button>
      </form>
    </div>
  );
}