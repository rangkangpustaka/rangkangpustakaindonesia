"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Cukup satu import db saja

export default function InputBuku() {
  const [judul, setJudul] = useState("");
  const [penulis, setPenulis] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Tombol ditekan!"); // Tambahan 1
    
    if (!judul || !penulis) {
        alert("Judul atau Penulis kosong!");
        return;
    }

    try {
      console.log("Mulai kirim ke Firebase..."); // Tambahan 2
      await addDoc(collection(db, "buku"), {
        judul: judul,
        penulis: penulis,
        createdAt: new Date(),
      });
      console.log("Data sukses terkirim!"); // Tambahan 3
      alert("Buku berhasil disimpan!");
      setJudul("");
      setPenulis("");
    } catch (error) {
      console.error("Gagal menyimpan:", error); // Penting!
      alert("Terjadi kesalahan: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded shadow-md">
      <h2 className="text-xl mb-4 font-bold">Tambah Buku Baru</h2>
      <input 
        className="block w-full mb-2 p-2 border"
        placeholder="Judul Buku" 
        value={judul} 
        onChange={(e) => setJudul(e.target.value)} 
      />
      <input 
        className="block w-full mb-2 p-2 border"
        placeholder="Nama Penulis" 
        value={penulis} 
        onChange={(e) => setPenulis(e.target.value)} 
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
        Simpan Buku
      </button>
    </form>
  );
}