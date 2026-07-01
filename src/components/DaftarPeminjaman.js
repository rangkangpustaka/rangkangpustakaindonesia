// src/components/DaftarPeminjaman.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function DaftarPeminjaman() {
  const [pinjaman, setPinjaman] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "peminjaman"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setPinjaman(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // PROSES PENGEMBALIAN + HITUNG DENDA OTOMATIS MASUK KAS KEUANGAN
  const handleKembalikanBuku = async (item) => {
    if (!window.confirm(`Konfirmasi pengembalian buku untuk peminjam "${item.namaPeminjam}"?`)) return;

    try {
      // 1. Ambil tarif denda aktif dari dokumen pengaturan aturan global
      let tarifDenda = 1000;
      const aturanSnap = await getDoc(doc(db, "settings", "sirkulasi"));
      if (aturanSnap.exists()) {
        tarifDenda = aturanSnap.data().dendaPerHari || 1000;
      }

      // 2. Hitung Selisih Hari Keterlambatan
      const hariIni = new Date();
      hariIni.setHours(0,0,0,0); // Reset jam agar murni menghitung tanggal kalender
      
      let jatuhTempoTanggal = new Date();
      if (item.rawJatuhTempo) {
        jatuhTempoTanggal = new Date(item.rawJatuhTempo.seconds * 1000);
      } else {
        // Fallback jika format lama memakai string text
        const parts = item.tanggalJatuhTempo.split("/");
        jatuhTempoTanggal = new Date(parts[2], parts[1] - 1, parts[0]);
      }
      jatuhTempoTanggal.setHours(0,0,0,0);

      const selisihWaktu = hariIni.getTime() - jatuhTempoTanggal.getTime();
      const selisihHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));

      let totalDenda = 0;
      if (selisihHari > 0) {
        totalDenda = selisihHari * tarifDenda;
      }

      // 3. Update Status Peminjaman di Database
      await updateDoc(doc(db, "peminjaman", item.id), {
        status: "Kembali",
        tanggalDikembalikan: new Date().toLocaleDateString("id-ID"),
        dendaKeterlambatan: totalDenda,
        lamaTerlambatHari: selisihHari > 0 ? selisihHari : 0
      });

      // 4. INTEGRASI UTAMA KAS KEUANGAN: Jika ada denda, otomatis masukkan data kas uang masuk!
      if (totalDenda > 0) {
        await addDoc(collection(db, "kas"), {
          tipe: "Pemasukan",
          kategori: "Infaq Keterlambatan",
          nominal: totalDenda,
          keterangan: `Otomatis: Denda telat ${selisihHari} hari oleh ${item.namaPeminjam} (${item.buku.map(b => b.judul).join(", ")})`,
          createdAt: serverTimestamp()
        });
        alert(`Buku Kembali!\n⚠️ Terlambat: ${selisihHari} Hari.\n💰 Uang denda sebesar Rp${totalDenda.toLocaleString("id-ID")} telah otomatis dibukukan ke dalam Kas Keuangan!`);
      } else {
        alert("🎉 Buku dikembalikan tepat waktu! Sirkulasi sukses selesai.");
      }

    } catch (error) {
      alert("Gagal memproses pengembalian: " + error.message);
    }
  };

  if (loading) return <div className="p-4 text-center text-xs font-bold text-gray-500 animate-pulse">Memuat log sirkulasi...</div>;

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-black text-gray-800 mb-4 border-b pb-4 flex items-center gap-2">
        <span>📋</span> Log Sirkulasi Buku
      </h2>

      {pinjaman.length === 0 ? (
        <p className="text-center py-6 text-gray-500 italic text-sm">Belum ada riwayat peminjaman.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Peminjam</th>
                <th className="p-3">Daftar Buku</th>
                <th className="p-3">Pinjam / Batas</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pinjaman.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-black text-gray-900">{item.namaPeminjam}</p>
                    <span className="text-[10px] font-bold text-gray-400 font-mono">{item.nomorAnggota}</span>
                  </td>
                  <td className="p-3 max-w-[200px]">
                    <div className="flex flex-col gap-0.5">
                      {item.buku?.map((b, i) => (
                        <p key={i} className="truncate font-medium text-gray-700">🔹 {b.judul}</p>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="text-gray-600 font-semibold">📆 {item.tanggalPinjam}</p>
                    <p className="text-red-600 font-bold">🚨 {item.tanggalJatuhTempo}</p>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${item.status === 'Dipinjam' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                      {item.status === 'Dipinjam' ? '🚚 DIPINJAM' : '✅ KEMBALI'}
                    </span>
                    {item.dendaKeterlambatan > 0 && (
                      <p className="text-[9px] text-red-600 font-black mt-1">Denda: Rp{item.dendaKeterlambatan.toLocaleString("id-ID")}</p>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.status === "Dipinjam" ? (
                      <button onClick={() => handleKembalikanBuku(item)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all">
                        ↩️ Kembalikan
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 font-semibold">Selesai pada {item.tanggalDikembalikan}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}