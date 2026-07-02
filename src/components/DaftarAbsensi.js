// src/components/DaftarAbsensi.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";

export default function DaftarAbsensi({ hakAksesAdmin }) {
  const [absensi, setAbsensi] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [tabAbsensi, setTabAbsensi] = useState("Umum"); 

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

  // =========================================================================
  // LOGIKA PEMISAHAN KETAT ANTI-DUPLIKAT (MUTLAK)
  // =========================================================================
  // Data Peserta Didik Rangkang (Yang kategorinya mengandung kata "Rangkang")
  const dataPesertaDidik = absensi.filter(a => 
    a.kategori === "Peserta Didik Rangkang" || 
    String(a.kategori).toLowerCase().includes("rangkang")
  );

  // Data Umum (Murni yang BUKAN anak Rangkang) -> Anti ganda/bocor!
  const dataUmum = absensi.filter(a => 
    a.kategori !== "Peserta Didik Rangkang" && 
    !String(a.kategori).toLowerCase().includes("rangkang")
  );

  // MENGELOMPOKKAN DATA PESERTA DIDIK PER MINGGU/TANGGAL
  const rekapMingguan = dataPesertaDidik.reduce((acc, curr) => {
    const dateObj = curr.waktuKunjungan ? new Date(curr.waktuKunjungan.seconds * 1000) : new Date();
    const dateKey = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(curr);
    return acc;
  }, {});

  if (loading) return <div className="p-4 text-center font-bold animate-pulse text-gray-500">Memuat Buku Tamu...</div>;

  const aksesPenuh = hakAksesAdmin === "Full Akses" || hakAksesAdmin === "Akses Besar";

  return (
    <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <span>📝</span> Log Buku Tamu
        </h2>
        
        {/* NAVIGASI TAB ABSENSI TERPISAH */}
        <div className="flex gap-2 w-full sm:w-auto bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setTabAbsensi("Umum")} 
            className={`flex-1 sm:px-6 py-2.5 text-xs font-bold rounded-lg transition-all ${tabAbsensi === "Umum" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
          >
            🏘️ Kunjungan Umum ({dataUmum.length})
          </button>
          <button 
            onClick={() => setTabAbsensi("KelasMingguan")} 
            className={`flex-1 sm:px-6 py-2.5 text-xs font-bold rounded-lg transition-all ${tabAbsensi === "KelasMingguan" ? "bg-[#8e0004] text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
          >
            🎓 Kelas Mingguan Rangkang ({dataPesertaDidik.length})
          </button>
        </div>
      </div>

      {/* ============================================== */}
      {/* TAB 1: TABEL KUNJUNGAN UMUM                    */}
      {/* ============================================== */}
      {tabAbsensi === "Umum" && (
        <>
          {dataUmum.length === 0 ? (
            <p className="text-center py-8 text-gray-500 italic text-sm">Belum ada data kunjungan umum.</p>
          ) : (
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Waktu</th><th className="p-3.5">Nama Pengunjung</th>
                    <th className="p-3.5">Asal / Instansi</th><th className="p-3.5">Tujuan</th>
                    {aksesPenuh && <th className="p-3.5 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {dataUmum.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition-all">
                      <td className="p-3.5 whitespace-nowrap text-[11px] text-gray-500 font-medium">
                        {item.waktuKunjungan ? new Date(item.waktuKunjungan.seconds * 1000).toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="p-3.5 font-bold text-gray-800 text-sm">
                        {item.nama}
                        <span className="block text-[9px] text-indigo-500 font-extrabold uppercase mt-0.5">{item.kategori || "UMUM"}</span>
                      </td>
                      <td className="p-3.5 text-gray-600 text-xs font-semibold">{item.asalInstansi || "-"}</td>
                      <td className="p-3.5 text-gray-600 text-xs italic">{item.tujuan}</td>
                      {aksesPenuh && (
                        <td className="p-3.5 text-center">
                          <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-100 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all">
                            Hapus
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ============================================== */}
      {/* TAB 2: REKAP KELAS MINGGUAN ANAK RANGKANG    */}
      {/* ============================================== */}
      {tabAbsensi === "KelasMingguan" && (
        <div className="flex flex-col gap-6">
          {Object.keys(rekapMingguan).length === 0 ? (
            <p className="text-center py-8 text-gray-500 italic text-sm">Belum ada catatan kelas mingguan Rangkang.</p>
          ) : (
            Object.keys(rekapMingguan).map((tanggal) => (
              <div key={tanggal} className="border-2 border-indigo-100 rounded-2xl overflow-hidden shadow-sm">
                
                <div className="bg-indigo-50 px-4 py-3.5 border-b-2 border-indigo-100 flex justify-between items-center flex-wrap gap-2">
                  <h3 className="font-black text-indigo-900 flex items-center gap-2 text-sm sm:text-base">
                    <span>📅</span> Pertemuan: {tanggal}
                  </h3>
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    Hadir: {rekapMingguan[tanggal].length} Siswa
                  </span>
                </div>

                <div className="bg-white p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rekapMingguan[tanggal].map((siswa, index) => (
                      <div key={siswa.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center text-xs flex-shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800 line-clamp-1">{siswa.nama}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{siswa.waktuKunjungan ? new Date(siswa.waktuKunjungan.seconds * 1000).toLocaleTimeString("id-ID") : "-"}</p>
                          </div>
                        </div>
                        {aksesPenuh && (
                          <button onClick={() => handleDelete(siswa.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all" title="Hapus Data">
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}