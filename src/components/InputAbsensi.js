// src/components/InputAbsensi.js
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function InputAbsensi() {
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [keperluan, setKeperluan] = useState("Membaca Buku");
  const [kategori, setKategori] = useState("Anak-anak (SD/SMP)");
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "absensi"), {
        nama,
        alamat,
        keperluan,
        kategori,
        tanggal: new Date().toLocaleDateString("id-ID"),
        waktu: new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp(),
      });
      setNama(""); setAlamat(""); setKeperluan("Membaca Buku"); setKategori("Anak-anak (SD/SMP)");
      setSukses(true);
      setTimeout(() => setSukses(false), 4000); // Notif sukses hilang dalam 4 detik
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl border-t-8 border-[#fec700] animate-in slide-in-from-bottom duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-[#8e0004] uppercase tracking-wider">Buku Tamu</h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">Silakan isi data kunjungan Anda hari ini</p>
      </div>

      {sukses && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-bold text-green-800">Terima Kasih, {nama || "Kakak"}!</p>
            <p className="text-xs text-green-600">Kehadiran Anda sudah tercatat di sistem.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Lengkap</label>
          <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Ahmad Maulidin" className="w-full p-3 mt-1 border-2 border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-[#8e0004] focus:ring-0 transition-all outline-none text-sm font-medium" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Asal Sekolah / Desa</label>
          <input type="text" required value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Contoh: SDN 1 Nisam / Desa XYZ" className="w-full p-3 mt-1 border-2 border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-[#8e0004] focus:ring-0 transition-all outline-none text-sm font-medium" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Kategori Usia</label>
            <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full p-3 mt-1 border-2 border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-[#8e0004] outline-none text-sm font-medium">
              <option value="Anak-anak (SD/SMP)">Anak-anak (SD/SMP)</option>
              <option value="Remaja (SMA/Kuliah)">Remaja (SMA/Kuliah)</option>
              <option value="Dewasa / Umum">Dewasa / Umum</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Keperluan</label>
            <select value={keperluan} onChange={(e) => setKeperluan(e.target.value)} className="w-full p-3 mt-1 border-2 border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-[#8e0004] outline-none text-sm font-medium">
              <option value="Membaca Buku">Membaca Buku</option>
              <option value="Meminjam Buku">Meminjam Buku</option>
              <option value="Mengerjakan Tugas">Mengerjakan Tugas</option>
              <option value="Mengikuti Kelas">Mengikuti Kelas</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-[#8e0004] text-white font-black rounded-xl hover:bg-red-900 transition-all uppercase tracking-widest shadow-lg border-b-4 border-red-950 active:border-b-0 active:translate-y-1">
          {loading ? "Menyimpan Data..." : "✔️ Hadir"}
        </button>
      </form>
    </div>
  );
}