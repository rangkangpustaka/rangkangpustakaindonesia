// src/components/DaftarPeminjaman.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from "firebase/firestore";

export default function DaftarPeminjaman() {
  const [sirkulasi, setSirkulasi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "sirkulasi"), orderBy("tanggalPinjam", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSirkulasi(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fungsi saat buku dikembalikan
  const handleKembalikan = async (idSirkulasi, idBuku) => {
    const konfirmasi = window.confirm("Terima pengembalian buku ini?");
    if (konfirmasi) {
      try {
        // 1. Update status sirkulasi
        await updateDoc(doc(db, "sirkulasi", idSirkulasi), {
          status: "Dikembalikan",
          tanggalKembali: new Date()
        });

        // 2. Kembalikan stok buku (+1)
        await updateDoc(doc(db, "buku", idBuku), {
          stok: increment(1)
        });

        alert("Berhasil! Buku dikembalikan dan stok bertambah.");
      } catch (error) {
        alert("Error: " + error.message);
      }
    }
  };

  if (loading) return <div className="p-4 text-center animate-pulse">Memuat data sirkulasi...</div>;

  return (
    <div className="mt-8 max-w-4xl w-full px-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Riwayat Sirkulasi</h2>
      
      {sirkulasi.length === 0 ? (
        <p className="text-center py-10 text-gray-500 italic">Belum ada transaksi peminjaman.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {sirkulasi.map((item) => {
            // Format Tanggal Firebase
            const tglPinjam = item.tanggalPinjam?.toDate ? item.tanggalPinjam.toDate().toLocaleDateString('id-ID') : "Baru saja";
            const tglKembali = item.tanggalKembali?.toDate ? item.tanggalKembali.toDate().toLocaleDateString('id-ID') : "-";
            
            return (
              <div key={item.id} className="p-4 border rounded-xl shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{item.namaAnggota}</h3>
                  <p className="text-sm font-semibold text-purple-700">📖 {item.judulBuku}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Dipinjam: {tglPinjam}</p>
                    {item.status === "Dikembalikan" && <p>Dikembalikan: {tglKembali}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${item.status === 'Dipinjam' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {item.status}
                  </span>
                  
                  {item.status === "Dipinjam" && (
                    <button 
                      onClick={() => handleKembalikan(item.id, item.idBuku)}
                      className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded font-bold text-sm transition-colors mt-2"
                    >
                      Terima Pengembalian
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}