// src/components/DaftarPeminjaman.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";

export default function DaftarPeminjaman() {
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState(""); 

  // STATE BARU: Untuk mode edit pengembalian manual
  const [kembaliId, setKembaliId] = useState(null);
  const [inputTanggalKembali, setInputTanggalKembali] = useState("");
  const [inputDenda, setInputDenda] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "peminjaman"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dataSirkulasi = [];
      querySnapshot.forEach((document) => {
        dataSirkulasi.push({ id: document.id, ...document.data() });
      });
      setPeminjaman(dataSirkulasi);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus data sirkulasi ini?")) {
      await deleteDoc(doc(db, "peminjaman", id));
    }
  };

  // 1. KLIK SELESAI: Membuka panel dan menghitung denda sementara
  const handleKlikSelesai = (item) => {
    const hariIni = new Date();
    
    // Format tanggal ke YYYY-MM-DD agar bisa masuk ke <input type="date">
    const yyyy = hariIni.getFullYear();
    const mm = String(hariIni.getMonth() + 1).padStart(2, '0');
    const dd = String(hariIni.getDate()).padStart(2, '0');
    const formatTanggalInput = `${yyyy}-${mm}-${dd}`;
    
    let saranDenda = 0;
    const TARIF_DENDA_PER_HARI = 1000; 

    // Kalkulasi otomatis (hanya sebagai saran awal)
    if (item.timestampTenggat) {
      const selisihWaktu = hariIni.getTime() - item.timestampTenggat;
      const selisihHari = Math.ceil(selisihWaktu / (1000 * 3600 * 24));
      if (selisihHari > 0) {
        saranDenda = selisihHari * TARIF_DENDA_PER_HARI;
      }
    }

    // Masukkan data ke form edit
    setInputTanggalKembali(formatTanggalInput);
    setInputDenda(saranDenda);
    setKembaliId(item.id);
  };

  // 2. SIMPAN PENGEMBALIAN: Menyimpan data yang sudah diedit manual
  const handleSimpanKembali = async (item) => {
    // Ubah format YYYY-MM-DD kembali ke DD/MM/YYYY untuk ditampilkan di tabel
    const [thn, bln, tgl] = inputTanggalKembali.split("-");
    const formatTanggalTampil = `${tgl}/${bln}/${thn}`;

    try {
      await updateDoc(doc(db, "peminjaman", item.id), {
        status: "Dikembalikan",
        tanggalDikembalikan: formatTanggalTampil,
        denda: Number(inputDenda)
      });
      setKembaliId(null); // Tutup panel setelah berhasil
    } catch (error) {
      alert("Terjadi kesalahan saat mengembalikan buku: " + error.message);
    }
  };

  const peminjamanDifilter = peminjaman.filter((item) => {
    const keyword = kataKunci.toLowerCase();
    return (
      item.namaPeminjam?.toLowerCase().includes(keyword) || 
      item.judulBuku?.toLowerCase().includes(keyword) ||
      item.status?.toLowerCase().includes(keyword)
    );
  });

  if (loading) return <div className="p-4 text-center font-bold">Memuat data sirkulasi...</div>;

  return (
    <div className="w-full mt-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Data Sirkulasi Buku</h2>
          <p className="text-sm text-gray-500">Total: {peminjaman.length} Transaksi</p>
        </div>
        <div className="w-full sm:w-64">
          <input type="text" placeholder="Cari nama peminjam, buku..." value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-[#8e0004]" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider border-b-2">
              <th className="p-3 font-bold">Peminjam</th>
              <th className="p-3 font-bold">Buku & Tanggal</th>
              <th className="p-3 font-bold">Status</th>
              <th className="p-3 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {peminjamanDifilter.map((item) => (
              kembaliId === item.id ? (
                // TAMPILAN PANEL EDIT PENGEMBALIAN
                <tr key={`edit-${item.id}`} className="border-b bg-blue-50/60">
                  <td colSpan="4" className="p-3">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-2 border-blue-200 bg-white p-4 rounded-xl shadow-sm animate-in fade-in">
                      
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">Kembalikan: {item.judulBuku}</p>
                        <p className="text-xs text-gray-500 font-medium">Oleh: {item.namaPeminjam} (Batas: {item.tenggatWaktu})</p>
                      </div>
                      
                      <div className="flex gap-4 flex-wrap">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tgl Dikembalikan</label>
                          <input type="date" value={inputTanggalKembali} onChange={(e) => setInputTanggalKembali(e.target.value)} className="block p-2 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-500 font-medium transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Denda (Rp)</label>
                          <input type="number" value={inputDenda} onChange={(e) => setInputDenda(e.target.value)} placeholder="0" className="block p-2 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-500 w-28 font-bold text-red-600 transition-all" />
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button onClick={() => setKembaliId(null)} className="px-4 py-2 bg-gray-200 font-bold text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition-all">Batal</button>
                        <button onClick={() => handleSimpanKembali(item)} className="px-4 py-2 bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 text-sm shadow-md active:translate-y-0.5 transition-all">Konfirmasi</button>
                      </div>

                    </div>
                  </td>
                </tr>
              ) : (
                // TAMPILAN BARIS TABEL NORMAL
                <tr key={item.id} className="border-b hover:bg-gray-50 text-sm text-gray-800 transition-colors">
                  <td className="p-3"><p className="font-bold text-[#8e0004]">{item.namaPeminjam}</p></td>
                  <td className="p-3">
                    <p className="font-bold">{item.judulBuku}</p>
                    <p className="text-xs text-gray-500 mt-1">Pinjam: <span className="font-semibold">{item.tanggalPinjam}</span></p>
                    {item.tenggatWaktu && item.status === "Dipinjam" && (
                      <p className="text-xs text-red-600 mt-0.5">Batas: <span className="font-bold">{item.tenggatWaktu}</span></p>
                    )}
                  </td>
                  <td className="p-3">
                    {item.status === "Dipinjam" ? (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-extrabold border border-amber-200 animate-pulse">Dipinjam</span>
                    ) : (
                      <div className="flex flex-col items-start gap-1">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-extrabold border border-green-200">
                          Telah Kembali <span className="font-medium">({item.tanggalDikembalikan})</span>
                        </span>
                        {item.denda > 0 && (
                          <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                            Denda: Rp {item.denda.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-center">
                      {item.status === "Dipinjam" && (
                        <button onClick={() => handleKlikSelesai(item)} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-colors">Selesai</button>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors">Hapus</button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
        {peminjamanDifilter.length === 0 && <p className="text-center py-8 text-gray-500 italic font-medium">Tidak ada data sirkulasi yang sesuai.</p>}
      </div>
    </div>
  );
}