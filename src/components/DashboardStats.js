// src/components/DashboardStats.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function DashboardStats() {
  const [totalBuku, setTotalBuku] = useState(0);
  const [totalAnggota, setTotalAnggota] = useState(0);
  const [bukuDipinjam, setBukuDipinjam] = useState(0);

  useEffect(() => {
    // 1. Hitung Total Judul Buku
    const unsubBuku = onSnapshot(collection(db, "buku"), (snapshot) => {
      setTotalBuku(snapshot.size);
    });

    // 2. Hitung Total Anggota
    const unsubAnggota = onSnapshot(collection(db, "anggota"), (snapshot) => {
      setTotalAnggota(snapshot.size);
    });

    // 3. Hitung Buku yang Sedang Dipinjam
    const qPinjam = query(collection(db, "sirkulasi"), where("status", "==", "Dipinjam"));
    const unsubPinjam = onSnapshot(qPinjam, (snapshot) => {
      setBukuDipinjam(snapshot.size);
    });

    return () => {
      unsubBuku();
      unsubAnggota();
      unsubPinjam();
    };
  }, []);

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Kartu Statistik Buku */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-blue-500 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1">Total Judul Buku</p>
          <h3 className="text-3xl font-extrabold text-gray-900">{totalBuku}</h3>
        </div>
        <div className="text-blue-500 text-4xl">📚</div>
      </div>

      {/* Kartu Statistik Anggota */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-green-500 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1">Total Anggota</p>
          <h3 className="text-3xl font-extrabold text-gray-900">{totalAnggota}</h3>
        </div>
        <div className="text-green-500 text-4xl">👥</div>
      </div>

      {/* Kartu Statistik Sirkulasi */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-amber-500 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-semibold mb-1">Sedang Dipinjam</p>
          <h3 className="text-3xl font-extrabold text-gray-900">{bukuDipinjam}</h3>
        </div>
        <div className="text-amber-500 text-4xl">🔄</div>
      </div>
    </div>
  );
}