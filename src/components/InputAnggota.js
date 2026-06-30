// src/components/InputAnggota.js
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function InputAnggota() {
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");
  const [alamat, setAlamat] = useState("");
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // LOGIKA CERDAS: Membuat Nomor Induk Anggota (NIA) Otomatis
      // Format: RP-[Tahun]-[4 Huruf/Angka Acak] -> Contoh: RP-2026-X7B9
      const tahun = new Date().getFullYear();
      const acak = Math.random().toString(36).substring(2, 6).toUpperCase();
      const nomorAnggota = `RP-${tahun}-${acak}`;

      await addDoc(collection(db, "anggota"), {
        nomorAnggota, // Menyimpan NIA ke database
        nama,
        kontak: kontak || "-",
        alamat: alamat || "-",
        tanggalDaftar: new Date().toLocaleDateString("id-ID"),
        createdAt: serverTimestamp(),
      });

      setNama(""); setKontak(""); setAlamat("");
      setSukses(true);
      setTimeout(() => setSukses(false), 4000);
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-black text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
        <span>👥</span> Pendaftaran Anggota Baru
      </h2>

      {sukses && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
          <span>✅</span> Anggota berhasil didaftarkan! (NIA dibuat otomatis)
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Lengkap</label>
          <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Kayla" className="w-full p-3 mt-1 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#8e0004] outline-none text-sm font-medium transition-all" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Asal Sekolah / Desa / Alamat</label>
          <input type="text" required value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Contoh: Desa Nisam / SDN 1" className="w-full p-3 mt-1 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#8e0004] outline-none text-sm font-medium transition-all" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">No. WA / Telepon (Opsional)</label>
          <input type="text" value={kontak} onChange={(e) => setKontak(e.target.value)} placeholder="Contoh: 08123456..." className="w-full p-3 mt-1 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#8e0004] outline-none text-sm font-medium transition-all" />
        </div>

        <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-[#8e0004] text-white font-black rounded-xl hover:bg-red-900 transition-all uppercase tracking-widest shadow-md active:translate-y-1">
          {loading ? "Memproses..." : "➕ Simpan Anggota"}
        </button>
      </form>
    </div>
  );
}