// src/components/DaftarPeminjaman.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import ScannerModal from "./ScannerModal";

export default function DaftarPeminjaman({ hakAksesAdmin }) {
  const [pinjaman, setPinjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bukaKameraMundur, setBukaKameraMundur] = useState(false);
  const [scannedMember, setScannedMember] = useState(null); 

  // Pengecekan Akses Global (Memperbolehkan Full Akses atau Akses Besar)
  const aksesPenuh = hakAksesAdmin === "Full Akses" || hakAksesAdmin === "Akses Besar";

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

  const handleDeleteLog = async (id, nama) => {
    if(window.confirm(`🚨 PERINGATAN: Yakin ingin menghapus seluruh riwayat transaksi peminjaman atas nama ${nama}? Tindakan ini tidak bisa dibatalkan!`)) {
       try {
         await deleteDoc(doc(db, "peminjaman", id));
       } catch(e) {
         alert("Gagal menghapus log: " + e.message);
       }
    }
  };

  const eksekusiKembaliBukuTunggal = async (transaksiId, bukuIdRaib) => {
    const txRef = doc(db, "peminjaman", transaksiId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) return alert("Transaksi tidak ditemukan!");
    
    const dataTx = txSnap.data();
    let tarifDenda = 1000;
    const aturanSnap = await getDoc(doc(db, "settings", "sirkulasi"));
    if (aturanSnap.exists()) tarifDenda = aturanSnap.data().dendaPerHari || 1000;

    const hariIni = new Date(); hariIni.setHours(0,0,0,0);
    let jatuhTempoTanggal = new Date();
    if (dataTx.rawJatuhTempo) jatuhTempoTanggal = new Date(dataTx.rawJatuhTempo.seconds * 1000);
    else { const parts = dataTx.tanggalJatuhTempo.split("/"); jatuhTempoTanggal = new Date(parts[2], parts[1] - 1, parts[0]); }
    jatuhTempoTanggal.setHours(0,0,0,0);

    const selisihWaktu = hariIni.getTime() - jatuhTempoTanggal.getTime();
    const selisihHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));
    const totalDendaBukuIni = selisihHari > 0 ? selisihHari * tarifDenda : 0;

    let namaBukuTerproses = "";
    const listBukuDiperbarui = dataTx.buku.map((b) => {
      if (b.id === bukuIdRaib && (b.status === "Dipinjam" || !b.status)) {
        namaBukuTerproses = b.judul;
        return { ...b, status: "Kembali", tanggalDikembalikan: new Date().toLocaleDateString("id-ID"), denda: totalDendaBukuIni, terlambatHari: selisihHari > 0 ? selisihHari : 0 };
      }
      if (!b.status) b.status = "Dipinjam"; return b;
    });

    const masihAdaBukuDipinjam = listBukuDiperbarui.some(b => b.status === "Dipinjam");
    const statusTransaksiBaru = masihAdaBukuDipinjam ? "Dipinjam" : "Kembali";

    await updateDoc(txRef, { status: statusTransaksiBaru, buku: listBukuDiperbarui });

    if (totalDendaBukuIni > 0) {
      await addDoc(collection(db, "kas"), {
        tipe: "Pemasukan", kategori: "Infaq Keterlambatan", nominal: totalDendaBukuIni,
        keterangan: `Denda telat ${selisihHari} hari buku [${namaBukuTerproses}] oleh ${dataTx.namaPeminjam}`, createdAt: serverTimestamp()
      });
      alert(`↩️ Buku Kembali!\nTerlambat: ${selisihHari} Hari\nDenda Rp${totalDendaBukuIni.toLocaleString("id-ID")} otomatis masuk Kas Keuangan!`);
    } else alert(`🎉 Sukses! Buku [${namaBukuTerproses}] dikembalikan tepat waktu!`);
  };

  const handleScanPengembalian = async (dataQR) => {
    if (dataQR.startsWith("ANGGOTA|")) {
      const parts = dataQR.split("|"); setScannedMember({ nia: parts[1], nama: parts[2] });
      alert(`🎯 Kamera Terkunci untuk ${parts[2]}. Silakan scan QR buku.`);
      return; 
    }
    if (dataQR.startsWith("BUKU|")) {
      const idBukuDitemukan = dataQR.split("|")[1];
      setBukaKameraMundur(false); 
      let transaksiTarget = null;

      if (scannedMember) {
        transaksiTarget = pinjaman.find(tx => tx.nomorAnggota === scannedMember.nia && tx.status === "Dipinjam" && tx.buku.some(b => b.id === idBukuDitemukan && (b.status === "Dipinjam" || !b.status)));
        if (!transaksiTarget) { alert(`⚠️ Anggota [${scannedMember.nama}] tidak meminjam buku ini.`); setScannedMember(null); return; }
      } else {
        const semuaTransaksi = pinjaman.filter(tx => tx.status === "Dipinjam" && tx.buku.some(b => b.id === idBukuDitemukan && (b.status === "Dipinjam" || !b.status)));
        if (semuaTransaksi.length === 0) return alert("ℹ️ Buku tidak terdeteksi dalam daftar pinjam aktif.");
        if (semuaTransaksi.length > 1) return alert(`🚨 QR KEMBAR DETECTED! Scan KARTU ANGGOTA terlebih dahulu.`);
        transaksiTarget = semuaTransaksi[0];
      }
      await eksekusiKembaliBukuTunggal(transaksiTarget.id, idBukuDitemukan);
      setScannedMember(null); 
    } else alert("⚠️ Barcode salah!");
  };

  if (loading) return <div className="p-4 text-center text-xs font-bold text-gray-500 animate-pulse">Memuat log sirkulasi...</div>;

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
      {bukaKameraMundur && <ScannerModal title={scannedMember ? `Kamera Terkunci: ${scannedMember.nama}` : "Scan Kartu / Buku"} onScan={handleScanPengembalian} onClose={() => { setBukaKameraMundur(false); setScannedMember(null); }} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4 gap-3">
        <div><h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><span>📋</span> Log Sirkulasi Buku</h2></div>
        <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
          <button onClick={() => setBukaKameraMundur(true)} className="w-full sm:w-auto px-5 py-3 bg-emerald-600 text-white font-black text-xs rounded-xl hover:bg-emerald-700 shadow-md">📷 SCAN PENGEMBALIAN</button>
          {scannedMember && <div className="text-[11px] bg-amber-50 text-amber-800 px-3 py-1 rounded-lg font-bold flex gap-2 animate-pulse"><span>🔒 Terkunci: {scannedMember.nama}</span><button onClick={() => setScannedMember(null)} className="text-red-600 hover:bg-red-100 px-1 rounded">✕</button></div>}
        </div>
      </div>

      {pinjaman.length === 0 ? <p className="text-center py-6 text-gray-500 italic text-sm">Belum ada riwayat peminjaman.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Peminjam</th><th className="p-3">Buku & Status</th><th className="p-3">Tanggal</th><th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {pinjaman.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50/80 transition-all">
                  <td className="p-3">
                    <p className="font-black text-gray-900 text-sm">{item.namaPeminjam}</p>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border">{item.nomorAnggota}</span>
                  </td>
                  <td className="p-3 min-w-[280px]">
                    <div className="flex flex-col gap-2">
                      {item.buku?.map((b, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border gap-2">
                          <div className="max-w-[180px] sm:max-w-[240px]">
                            <p className="truncate font-bold text-gray-800 text-xs">🔹 {b.judul}</p>
                            {(b.status === "Kembali") && <p className="text-[9px] text-gray-400">Balik: {b.tanggalDikembalikan} {b.denda > 0 && `(Denda: Rp${b.denda})`}</p>}
                          </div>
                          <div>
                            {(!b.status || b.status === "Dipinjam") ? (
                              <button onClick={() => { if(window.confirm(`Kembalikan "${b.judul}"?`)) eksekusiKembaliBukuTunggal(item.id, b.id); }} className="px-2 py-1 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[10px] font-black rounded-md">↩️ Kembalikan</button>
                            ) : <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[9px] font-black rounded border border-green-200">✓ KEMBALI</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <p className="text-gray-500 font-semibold text-xs">Pinjam: {item.tanggalPinjam}</p>
                    <p className="text-red-600 font-bold text-xs">Batas: {item.tanggalJatuhTempo}</p>
                  </td>
                  <td className="p-3 text-center flex flex-col gap-2 items-center justify-center">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${item.status === 'Dipinjam' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
                      {item.status === 'Dipinjam' ? '🚚 Proses' : '✅ Selesai'}
                    </span>
                    {/* TOMBOL HAPUS LOG (KHUSUS FULL AKSES) */}
                    {aksesPenuh && (
                      <button onClick={() => handleDeleteLog(item.id, item.namaPeminjam)} className="text-[9px] text-red-500 font-black underline hover:text-red-700 transition-all mt-1">
                        🗑️ Hapus Log
                      </button>
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