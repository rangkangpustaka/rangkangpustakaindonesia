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

  const handleKembalikan = async (idSirkulasi, idBuku) => {
    const konfirmasi = window.confirm("Terima pengembalian buku ini?");
    if (konfirmasi) {
      try {
        await updateDoc(doc(db, "sirkulasi", idSirkulasi), {
          status: "Dikembalikan",
          tanggalKembali: new Date()
        });
        await updateDoc(doc(db, "buku", idBuku), {
          stok: increment(1)
        });
        alert("Berhasil! Buku dikembalikan dan stok bertambah.");
      } catch (error) {
        alert("Error: " + error.message);
      }
    }
  };

  // FUNGSI BARU: Untuk mencetak halaman
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-4 text-center animate-pulse">Memuat data sirkulasi...</div>;

  return (
    <div className="mt-8 max-w-4xl w-full px-4 print:mt-0 print:max-w-full print:px-0">
      
      {/* HEADER DENGAN TOMBOL CETAK (Tombol ini akan hilang saat dicetak berkat 'print:hidden') */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Riwayat Sirkulasi</h2>
          <p className="text-sm text-gray-500 mt-1 print:hidden">Kelola peminjaman dan pengembalian</p>
        </div>
        <button 
          onClick={handlePrint}
          className="print:hidden px-4 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 shadow-sm flex items-center gap-2 transition-colors"
        >
          🖨️ Cetak PDF / Laporan
        </button>
      </div>
      
      {/* HEADER KHUSUS CETAK (Hanya muncul di kertas/PDF) */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-black">Laporan Sirkulasi Rangkang Pustaka</h1>
        <p className="text-gray-600">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
        <hr className="mt-4 border-black border-t-2" />
      </div>

      {sirkulasi.length === 0 ? (
        <p className="text-center py-10 text-gray-500 italic">Belum ada transaksi peminjaman.</p>
      ) : (
        <div className="flex flex-col gap-4 print:gap-2">
          {sirkulasi.map((item) => {
            const tglPinjam = item.tanggalPinjam?.toDate ? item.tanggalPinjam.toDate().toLocaleDateString('id-ID') : "Baru saja";
            const tglKembali = item.tanggalKembali?.toDate ? item.tanggalKembali.toDate().toLocaleDateString('id-ID') : "-";
            
            return (
              <div key={item.id} className="p-4 border rounded-xl shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:border-b print:border-gray-300 print:shadow-none print:rounded-none print:p-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{item.namaAnggota}</h3>
                  <p className="text-sm font-semibold text-purple-700 print:text-black">📖 {item.judulBuku}</p>
                  <div className="text-xs text-gray-500 mt-2 print:text-black">
                    <p>Dipinjam: {tglPinjam}</p>
                    {item.status === "Dikembalikan" && <p>Dikembalikan: {tglKembali}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Status warna-warni di web, tapi hitam putih rapi di hasil cetak */}
                  <span className={`text-xs px-3 py-1 rounded-full font-bold print:border print:bg-transparent print:text-black ${item.status === 'Dipinjam' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {item.status}
                  </span>
                  
                  {/* Tombol ini wajib disembunyikan saat dicetak menggunakan print:hidden */}
                  {item.status === "Dipinjam" && (
                    <button 
                      onClick={() => handleKembalikan(item.id, item.idBuku)}
                      className="print:hidden px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded font-bold text-sm transition-colors mt-2"
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