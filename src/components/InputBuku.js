"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function InputBuku() {
  const [judul, setJudul] = useState("");
  const [penulis, setPenulis] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!judul || !penulis) {
      alert("Harap isi judul dan penulis!");
      return;
    }

    setLoading(true);

    try {
      console.log("Mulai menyimpan data...");
      
      const docRef = await addDoc(collection(db, "buku"), {
        judul: judul,
        penulis: penulis,
        createdAt: new Date(),
      });
      
      console.log("Sukses tersimpan dengan ID:", docRef.id);
      alert("Mantap! Buku berhasil disimpan.");
      
      setJudul("");
      setPenulis("");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-lg shadow-md max-w-md bg-white">
      <h2 className="text-xl mb-4 font-bold text-gray-800">Tambah Buku Baru</h2>
      
      <input 
        className="block w-full mb-3 p-2 border rounded text-black"
        placeholder="Judul Buku" 
        value={judul} 
        onChange={(e) => setJudul(e.target.value)} 
        disabled={loading}
      />
      
      <input 
        className="block w-full mb-4 p-2 border rounded text-black"
        placeholder="Nama Penulis" 
        value={penulis} 
        onChange={(e) => setPenulis(e.target.value)} 
        disabled={loading}
      />
      
      <button 
        type="submit" 
        disabled={loading}
        className={`w-full py-2 rounded text-white font-semibold ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {loading ? "Menyimpan..." : "Simpan Buku"}
      </button>
    </form>
  );
}