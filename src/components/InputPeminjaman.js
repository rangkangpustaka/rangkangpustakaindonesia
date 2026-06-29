// src/components/InputPeminjaman.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
// PERHATIKAN: Kita mengimpor 'increment' dan 'where' di sini
import { collection, addDoc, onSnapshot, doc, updateDoc, increment, query, where } from "firebase/firestore";

export default function InputPeminjaman() {
  const [buku, setBuku] = useState([]);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedBuku, setSelectedBuku] = useState("");
  const [selectedAnggota, setSelectedAnggota] = useState("");

  useEffect(() => {
    // 1. Ambil Buku yang STOKNYA MASIH ADA (> 0)
    const qBuku = query(collection(db, "buku"), where("stok", ">", 0));
    const unsubBuku = onSnapshot(qBuku, (snapshot) => {
      setBuku(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Ambil Anggota yang STATUSNYA AKTIF
    const qAnggota = query(collection(db, "anggota"), where("status", "==", "Aktif"));
    const unsubAnggota = onSnapshot(qAnggota, (snapshot) => {
      setAnggota(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubBuku(); unsubAnggota(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBuku || !selectedAnggota) {
      alert("Harap pilih Buku dan Anggota!");
      return;
    }

    setLoading(true);
    try {
      const bukuPilihan = buku.find(b => b.id === selectedBuku);
      const anggotaPilihan = anggota.find(a => a.id === selectedAnggota);

      // PROSES A: Mencatat ke tabel Sirkulasi
      await addDoc(collection(db, "sirkulasi"), {
        idBuku: selectedBuku,
        judulBuku: bukuPilihan.judul,
        idAnggota: selectedAnggota,
        namaAnggota: anggotaPilihan.nama,
        tanggalPinjam: new Date(),
        status: "Dipinjam",
      });

      // PROSES B: Mengurangi stok buku secara otomatis (-1)
      await updateDoc(doc(db, "buku", selectedBuku), {
        stok: increment(-1)
      });

      alert("Berhasil! Buku dicatat sebagai dipinjam dan stok telah dikurangi.");
      setSelectedBuku("");
      setSelectedAnggota("");
    } catch (error) {
      console.error("Gagal mencatat peminjaman:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-xl shadow-lg bg-white w-full flex flex-col gap-4 border-t-4 border-t-purple-600">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Sirkulasi: Peminjaman Buku</h2>
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Anggota Peminjam *</label>
        <select 
          className="block w-full p-3 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none"
          value={selectedAnggota} 
          onChange={(e) => setSelectedAnggota(e.target.value)} 
          disabled={loading}
        >
          <option value="">-- Pilih Anggota --</option>
          {anggota.map(a => (
            <option key={a.id} value={a.id}>{a.noAnggota} - {a.nama}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Buku yang Dipinjam *</label>
        <select 
          className="block w-full p-3 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none"
          value={selectedBuku} 
          onChange={(e) => setSelectedBuku(e.target.value)} 
          disabled={loading}
        >
          <option value="">-- Pilih Buku (Hanya yang tersedia) --</option>
          {buku.map(b => (
            <option key={b.id} value={b.id}>{b.judul} (Sisa Stok: {b.stok})</option>
          ))}
        </select>
      </div>
      
      <button 
        type="submit" disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-bold transition-all shadow-md mt-2 ${loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700 shadow-purple-100"}`}
      >
        {loading ? "Memproses..." : "Catat Peminjaman"}
      </button>
    </form>
  );
}