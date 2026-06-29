// src/components/DaftarAbsensi.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";

export default function DaftarAbsensi() {
  const [absensi, setAbsensi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState("");

  useEffect(() => {
    const q = query(collection(db, "absensi"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dataAbsensi = [];
      querySnapshot.forEach((document) => {
        dataAbsensi.push({ id: document.id, ...document.data() });
      });
      setAbsensi(dataAbsensi);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus data kunjungan "${nama}"?`)) {
      await deleteDoc(doc(db, "absensi", id));
    }
  };

  const handleExportExcel = () => {
    if (absensi.length === 0) return alert("Tidak ada data untuk diekspor.");
    const headers = ["No", "Tanggal", "Waktu", "Nama Pengunjung", "Kategori Usia", "Asal/Instansi", "Keperluan"];
    const csvData = absensiDifilter.map((item, index) => [
      index + 1, `"${item.tanggal}"`, `"${item.waktu}"`, `"${item.nama}"`, `"${item.kategori}"`, `"${item.alamat}"`, `"${item.keperluan}"`
    ]);
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Data_Buku_Tamu_Rangkang_Pustaka.csv";
    link.click();
  };

  const absensiDifilter = absensi.filter((item) => {
    const keyword = kataKunci.toLowerCase();
    return (item.nama?.toLowerCase().includes(keyword) || item.tanggal?.includes(keyword));
  });

  if (loading) return <div className="p-4 text-center animate-pulse">Memuat riwayat kunjungan...</div>;

  return (
    <div className="w-full mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Riwayat Kunjungan</h2>
          <p className="text-sm text-gray-500">Total: {absensi.length} Pengunjung Tercatat</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input type="text" placeholder="Cari nama / tanggal..." value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} className="w-full sm:w-56 p-2 border rounded-lg text-sm bg-gray-50 outline-none" />
          <button onClick={handleExportExcel} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-sm whitespace-nowrap">📊 Export</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider">
              <th className="p-3 border-b font-bold">Waktu</th>
              <th className="p-3 border-b font-bold">Pengunjung</th>
              <th className="p-3 border-b font-bold">Kategori</th>
              <th className="p-3 border-b font-bold">Keperluan</th>
              <th className="p-3 border-b font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {absensiDifilter.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 text-sm text-gray-800">
                <td className="p-3"><p className="font-bold">{item.tanggal}</p><p className="text-xs text-gray-500">{item.waktu}</p></td>
                <td className="p-3"><p className="font-bold">{item.nama}</p><p className="text-xs text-gray-500">{item.alamat}</p></td>
                <td className="p-3"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{item.kategori}</span></td>
                <td className="p-3">{item.keperluan}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleDelete(item.id, item.nama)} className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200 text-xs font-bold">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {absensiDifilter.length === 0 && <p className="text-center py-6 text-gray-500 italic">Belum ada riwayat kunjungan.</p>}
      </div>
    </div>
  );
}