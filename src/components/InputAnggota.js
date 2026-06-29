// src/components/InputAnggota.js
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function InputAnggota() {
  const [nama, setNama] = useState("");
  const [noAnggota, setNoAnggota] = useState("");
  const [noHp, setNoHp] = useState("");
  const [instansi, setInstansi] = useState(""); // Bisa sekolah, kampus, atau alamat desa
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nama || !noAnggota) {
      alert("Harap isi Nama dan Nomor Anggota!");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "anggota"), {
        nama: nama,
        noAnggota: noAnggota,
        noHp: noHp || "-",
        instansi: instansi || "-",
        status: "Aktif", // Default anggota baru langsung aktif
        bergabungPada: new Date(),
      });
      
      alert("Sip! Anggota baru berhasil didaftarkan.");
      
      // Reset form
      setNama("");
      setNoAnggota("");
      setNoHp("");
      setInstansi("");
    } catch (error) {
      console.error("Gagal mendaftar anggota:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-xl shadow-lg bg-white w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      <h2 className="text-2xl font-bold text-gray-800 col-span-1 md:col-span-2 mb-2">Pendaftaran Anggota Baru</h2>
      
      <div className="col-span-1 md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap *</label>
        <input 
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: Budi Santoso" 
          value={nama} 
          onChange={(e) => setNama(e.target.value)} 
          disabled={loading}
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Anggota (NIM/NIK) *</label>
        <input 
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: 2024001" 
          value={noAnggota} 
          onChange={(e) => setNoAnggota(e.target.value)} 
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor HP/WA</label>
        <input 
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: 08123456789" 
          value={noHp} 
          onChange={(e) => setNoHp(e.target.value)} 
          disabled={loading}
        />
      </div>

      <div className="col-span-1 md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Instansi / Alamat Lengkap</label>
        <input 
          className="block w-full p-2.5 border rounded-lg text-black bg-gray-50 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all"
          placeholder="Contoh: Univ. Malikussaleh / Desa Nisam" 
          value={instansi} 
          onChange={(e) => setInstansi(e.target.value)} 
          disabled={loading}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-bold col-span-1 md:col-span-2 mt-2 transition-all shadow-md ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 shadow-green-100"}`}
      >
        {loading ? "Mendaftarkan..." : "Daftarkan Anggota"}
      </button>
    </form>
  );
}