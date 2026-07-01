// src/components/InputBuku.js
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function InputBuku() {
  const [noBuku, setNoBuku] = useState("");
  const [kategori, setKategori] = useState("");
  const [judul, setJudul] = useState("");
  const [penulis, setPenulis] = useState("");
  const [isbn, setIsbn] = useState("");
  const [penerbit, setPenerbit] = useState("");
  const [tempatTerbit, setTempatTerbit] = useState(""); 
  const [tahun, setTahun] = useState("");
  const [edisi, setEdisi] = useState(""); 
  const [sumber, setSumber] = useState(""); // State untuk Asal/Sumber
  const [stok, setStok] = useState("");
  const [sampul, setSampul] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "buku"), {
        noBuku: noBuku || "-",
        kategori: kategori || "-",
        judul,
        penulis,
        isbn: isbn || "-",
        penerbit: penerbit || "-",
        tempatTerbit: tempatTerbit || "-",
        tahun: tahun || "-",
        edisi: edisi || "-", 
        sumber: sumber || "-", // Menyimpan Asal/Sumber ke database
        stok: Number(stok) || 1,
        sampul: sampul || "",
        createdAt: serverTimestamp(),
      });
      
      // Kosongkan form setelah sukses
      setNoBuku(""); setKategori(""); setJudul(""); setPenulis("");
      setIsbn(""); setPenerbit(""); setTempatTerbit(""); setTahun("");
      setEdisi(""); setSumber(""); setStok(""); setSampul("");
      
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
        <span>📖</span> Tambah Koleksi Baru
      </h2>

      {sukses && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl animate-in slide-in-from-top duration-300">
          <p className="font-bold text-green-800">✅ Buku berhasil ditambahkan ke dalam katalog!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* BARIS 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">No. Registrasi (Stiker)</label>
            <input type="text" value={noBuku} onChange={(e) => setNoBuku(e.target.value)} placeholder="Contoh: 813" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all font-bold text-blue-700" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Kategori / Klasifikasi</label>
            <input type="text" value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="Contoh: Buku Anak / Fiksi" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
        </div>

        {/* BARIS 2 */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1 block">Judul Buku *</label>
          <input type="text" required value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Laskar Pelangi" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm font-black text-gray-900 transition-all" />
        </div>

        {/* BARIS 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Nama Penulis *</label>
            <input type="text" required value={penulis} onChange={(e) => setPenulis(e.target.value)} placeholder="Contoh: Andrea Hirata" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Nomor ISBN</label>
            <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="Contoh: 978-602-291" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
        </div>

        {/* BARIS 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Penerbit</label>
            <input type="text" value={penerbit} onChange={(e) => setPenerbit(e.target.value)} placeholder="Contoh: Bentang Pustaka" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Kota Tempat Terbit</label>
            <input type="text" value={tempatTerbit} onChange={(e) => setTempatTerbit(e.target.value)} placeholder="Contoh: Yogyakarta" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
        </div>

        {/* BARIS 5: TAHUN, EDISI, DAN ASAL/SUMBER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-2 border-indigo-50 bg-indigo-50/30 p-3 rounded-xl">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Tahun Terbit</label>
            <input type="text" value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="Contoh: 2024" className="w-full p-3 border-2 rounded-xl bg-white focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Edisi / Cetakan</label>
            <input type="text" value={edisi} onChange={(e) => setEdisi(e.target.value)} placeholder="Contoh: Cetakan Ke-3" className="w-full p-3 border-2 rounded-xl bg-white focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-indigo-700 mb-1 block">Asal / Sumber Buku</label>
            <input type="text" value={sumber} onChange={(e) => setSumber(e.target.value)} placeholder="Contoh: Donasi, Dana Desa" className="w-full p-3 border-2 border-indigo-200 rounded-xl bg-white focus:border-indigo-600 outline-none text-sm transition-all font-bold" />
          </div>
        </div>

        {/* BARIS 6 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">Jumlah Stok *</label>
            <input type="number" required value={stok} onChange={(e) => setStok(e.target.value)} placeholder="Contoh: 5" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1 block">URL Sampul Gambar (Opsional)</label>
            <input type="text" value={sampul} onChange={(e) => setSampul(e.target.value)} placeholder="https://link.com/gambar.jpg" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-blue-600 outline-none text-sm transition-all" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-[#8e0004] text-white font-black tracking-widest rounded-xl hover:bg-red-800 transition-all shadow-md text-sm sm:text-base uppercase">
          {loading ? "Menyimpan Data..." : "Masukkan ke Katalog"}
        </button>
      </form>
    </div>
  );
}