// src/components/InputAnggota.js
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function InputAnggota() {
  const [tipeAnggota, setTipeAnggota] = useState("Umum");
  const [jenisKelamin, setJenisKelamin] = useState("Laki-laki");
  const [kategoriUsia, setKategoriUsia] = useState("Anak-anak"); // State Kategori Usia Baru
  
  const [nomorAnggota, setNomorAnggota] = useState("");
  const [nama, setNama] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kontak, setKontak] = useState("");
  const [namaWali, setNamaWali] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "anggota"), {
        tipeAnggota,
        kategoriUsia, // Menyimpan Anak/Remaja/Dewasa
        jenisKelamin: tipeAnggota === "Peserta Didik" ? jenisKelamin : "-",
        nomorAnggota: nomorAnggota || `NIA-${Math.floor(Math.random() * 10000)}`,
        nama,
        tempatLahir: tempatLahir || "-",
        tanggalLahir: tanggalLahir || "-",
        alamat,
        kontak: kontak || "-",
        namaWali: tipeAnggota === "Peserta Didik" ? namaWali : "-",
        fotoUrl: fotoUrl || "", 
        tanggalDaftar: new Date().toLocaleDateString("id-ID"),
        createdAt: serverTimestamp(),
      });
      
      setNomorAnggota(""); setNama(""); setTempatLahir(""); setTanggalLahir(""); 
      setAlamat(""); setKontak(""); setNamaWali(""); setFotoUrl(""); setKategoriUsia("Anak-anak");
      
      setSukses(true);
      setTimeout(() => setSukses(false), 4000);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
        <span>👥</span> Registrasi Anggota & Peserta Didik
      </h2>

      {sukses && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl animate-in slide-in-from-top duration-300">
          <p className="font-bold text-green-800">✅ Data berhasil didaftarkan ke sistem!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* PILIHAN TIPE ANGGOTA */}
        <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 mb-2">
          <label className="text-xs font-black text-gray-800 mb-2 block uppercase tracking-wider">Daftar Sebagai:</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tipe" value="Umum" checked={tipeAnggota === "Umum"} onChange={(e) => setTipeAnggota(e.target.value)} className="w-5 h-5 accent-[#8e0004]" />
              <span className="text-sm font-bold text-gray-700">Anggota Umum</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tipe" value="Peserta Didik" checked={tipeAnggota === "Peserta Didik"} onChange={(e) => setTipeAnggota(e.target.value)} className="w-5 h-5 accent-[#8e0004]" />
              <span className="text-sm font-bold text-[#8e0004]">Peserta Didik Rangkang</span>
            </label>
          </div>
        </div>

        {/* IDENTITAS UTAMA & KATEGORI USIA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">No. Induk (NIA)</label>
            <input type="text" value={nomorAnggota} onChange={(e) => setNomorAnggota(e.target.value)} placeholder="Otomatis..." className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm font-bold text-blue-700" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Nama Lengkap *</label>
            <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Lengkap" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm font-black text-gray-900" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Kategori Usia</label>
            <select value={kategoriUsia} onChange={(e) => setKategoriUsia(e.target.value)} className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm font-bold text-gray-900 cursor-pointer">
              <option value="Anak-anak">👦 Anak-anak</option>
              <option value="Remaja">🧑 Remaja</option>
              <option value="Dewasa">👨 Dewasa</option>
            </select>
          </div>
        </div>

        {/* KHUSUS PESERTA DIDIK: GENDER & TTL */}
        {tipeAnggota === "Peserta Didik" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <div>
              <label className="text-xs font-bold text-indigo-900 mb-1 block">Jenis Kelamin</label>
              <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className="w-full p-3 border-2 border-white rounded-xl bg-white focus:border-indigo-600 outline-none text-sm font-bold text-gray-900 cursor-pointer shadow-sm">
                <option value="Laki-laki">Laki-laki (Putra)</option>
                <option value="Perempuan">Perempuan (Putri)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-indigo-900 mb-1 block">Tempat Lahir</label>
              <input type="text" value={tempatLahir} onChange={(e) => setTempatLahir(e.target.value)} placeholder="Contoh: Nisam" className="w-full p-3 border-2 border-white rounded-xl bg-white focus:border-indigo-600 outline-none text-sm font-bold transition-all shadow-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-indigo-900 mb-1 block">Tanggal Lahir</label>
              <input type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} className="w-full p-3 border-2 border-white rounded-xl bg-white focus:border-indigo-600 outline-none text-sm font-bold transition-all cursor-pointer shadow-sm" />
            </div>
          </div>
        )}

        {/* ALAMAT & KONTAK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Alamat / Asal Desa</label>
            <input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Contoh: Desa Meunasah Meucat" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Kontak / No. HP</label>
              <input type="text" value={kontak} onChange={(e) => setKontak(e.target.value)} placeholder="0852..." className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
            </div>
            {tipeAnggota === "Peserta Didik" && (
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Nama Wali</label>
                <input type="text" value={namaWali} onChange={(e) => setNamaWali(e.target.value)} placeholder="Nama Ayah/Ibu" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
              </div>
            )}
          </div>
        </div>

        {/* INPUT FOTO */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 mt-2">
          <label className="text-xs font-black text-amber-900 mb-1 block uppercase tracking-wider">Link Foto Google Drive (Wajib Untuk ID Card Vertikal)</label>
          <input type="text" value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)} placeholder="Paste link Google Drive yang sudah di-share (Anyone with link)..." className="w-full p-3 border-2 rounded-xl bg-white focus:border-amber-600 outline-none text-sm transition-all" />
        </div>

        <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-[#8e0004] text-white font-black tracking-widest rounded-xl hover:bg-red-800 transition-all shadow-md text-sm sm:text-base uppercase">
          {loading ? "Menyimpan Data..." : "Daftarkan Ke Sistem"}
        </button>
      </form>
    </div>
  );
}