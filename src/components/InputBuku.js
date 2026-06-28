// src/components/InputBuku.js
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function InputBuku() {
  const [judul, setJudul] = useState("");
  const [penulis, setPenulis] = useState("");
  const [isbn, setIsbn] = useState("");
  const [penerbit, setPenerbit] = useState("");
  const [tahun, setTahun] = useState("");
  const [stok, setStok] = useState("");
  const [sampul, setSampul] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!judul || !penulis || !stok) {
      alert("Harap isi Judul, Penulis, dan Jumlah Stok!");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "buku"), {
        judul: judul,
        penulis: penulis,
        isbn: isbn || "-",
        penerbit: penerbit || "-",
        tahun: tahun || "-",
        stok: Number(stok),
        // Gunakan placeholder gambar jika kosong
        sampul: sampul || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60",
        createdAt: new Date(),
      });
      
      alert("Mantap! Buku berhasil masuk katalog.");
      
      // Reset form
      setJudul("");
      setPenulis("");
      setIsbn("");
      setPenerbit("");
      setTahun("");
      setStok("");
      setSampul("");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-xl shadow-lg max-w-2xl bg-white w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      <h2 className="text-2xl font-bold text-gray-800 col-span-1 md:col-span-2 mb-2">Tambah Koleksi Baru (Katalog Modern)</h2>
      
      <div className="col-span-1 md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Buku *</label>
        <input 
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: Laskar Pelangi" 
          value={judul} 
          onChange={(e) => setJudul(e.target.value)} 
          disabled={loading}
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Penulis *</label>
        <input 
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: Andrea Hirata" 
          value={penulis} 
          onChange={(e) => setPenulis(e.target.value)} 
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor ISBN</label>
        <input 
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: 978-602-291-662-7" 
          value={isbn} 
          onChange={(e) => setIsbn(e.target.value)} 
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Penerbit</label>
        <input 
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: Bentang Pustaka" 
          value={penerbit} 
          onChange={(e) => setPenerbit(e.target.value)} 
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Tahun Terbit</label>
        <input 
          type="number"
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: 2005" 
          value={tahun} 
          onChange={(e) => setTahun(e.target.value)} 
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Stok *</label>
        <input 
          type="number"
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: 5" 
          value={stok} 
          onChange={(e) => setStok(e.target.value)} 
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">URL Sampul Gambar</label>
        <input 
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          placeholder="https://link-gambar.com/sampul.jpg" 
          value={sampul} 
          onChange={(e) => setSampul(e.target.value)} 
          disabled={loading}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-bold col-span-1 md:col-span-2 mt-2 transition-all shadow-md ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"}`}
      >
        {loading ? "Memproses..." : "Masukkan ke Katalog"}
      </button>
    </form>
  );
}