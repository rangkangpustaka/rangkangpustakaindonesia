// src/components/DaftarAbsensi.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";

export default function DaftarAbsensi({ hakAksesAdmin }) {
  const [absensi, setAbsensi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "absensi"), orderBy("waktuKunjungan", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setAbsensi(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus data kunjungan ini?")) {
      await deleteDoc(doc(db, "absensi", id));
    }
  };

  if (loading) return <div className="p-4 text-center font-bold animate-pulse text-gray-500">Memuat Buku Tamu...</div>;

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-black text-gray-800 mb-4 border-b pb-4 flex items-center gap-2">
        <span>📝</span> Log Buku Tamu / Kunjungan
      </h2>

      {absensi.length === 0 ? (
        <p className="text-center py-6 text-gray-500 italic text-sm">Belum ada data pengunjung.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Waktu</th>
                <th className="p-3">Nama Pengunjung</th>
                <th className="p-3">Asal / Instansi</th>
                <th className="p-3">Tujuan</th>
                
                {/* GEMBOK HEADER AKSI (Hanya Super Admin yang melihat kolom Aksi Hapus) */}
                {hakAksesAdmin === "Akses Besar" && <th className="p-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {absensi.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition-all">
                  <td className="p-3 whitespace-nowrap text-xs text-gray-500 font-medium">
                    {item.waktuKunjungan ? new Date(item.waktuKunjungan.seconds * 1000).toLocaleString("id-ID") : "-"}
                  </td>
                  <td className="p-3 font-bold text-gray-800 text-sm">
                    {item.nama}
                    <span className="block text-[10px] text-indigo-500 font-extrabold uppercase mt-0.5">{item.kategori || "UMUM"}</span>
                  </td>
                  <td className="p-3 text-gray-600 text-xs font-semibold">{item.asalInstansi || "-"}</td>
                  <td className="p-3 text-gray-600 text-xs italic">{item.tujuan}</td>
                  
                  {/* GEMBOK TOMBOL HAPUS ABSENSI */}
                  {hakAksesAdmin === "Akses Besar" && (
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-all text-xs font-bold border border-transparent hover:border-red-200">
                        🗑️ Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}