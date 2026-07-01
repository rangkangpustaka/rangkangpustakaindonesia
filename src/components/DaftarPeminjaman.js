// src/components/DaftarPeminjaman.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, getDoc, serverTimestamp } from "firebase/firestore";
import ScannerModal from "./ScannerModal"; 

export default function DaftarPeminjaman() {
  const [pinjaman, setPinjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bukaKameraMundur, setBukaKameraMundur] = useState(false);
  
  // STATE BARU: Untuk mengunci data anggota saat scan pengembalian
  const [scannedMember, setScannedMember] = useState(null); 

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

  // ==============================================================
  // LOGIKA PENGEMBALIAN BUKU TUNGGAL (ECERAN)
  // ==============================================================
  const eksekusiKembaliBukuTunggal = async (transaksiId, bukuIdRaib) => {
    const txRef = doc(db, "peminjaman", transaksiId);
    const txSnap = await getDoc(txRef);
    if (!txSnap.exists()) return alert("Transaksi tidak ditemukan!");
    
    const dataTx = txSnap.data();
    
    let tarifDenda = 1000;
    const aturanSnap = await getDoc(doc(db, "settings", "sirkulasi"));
    if (aturanSnap.exists()) {
      tarifDenda = aturanSnap.data().dendaPerHari || 1000;
    }

    const hariIni = new Date();
    hariIni.setHours(0,0,0,0);
    
    let jatuhTempoTanggal = new Date();
    if (dataTx.rawJatuhTempo) {
      jatuhTempoTanggal = new Date(dataTx.rawJatuhTempo.seconds * 1000);
    } else {
      const parts = dataTx.tanggalJatuhTempo.split("/");
      jatuhTempoTanggal = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    jatuhTempoTanggal.setHours(0,0,0,0);

    const selisihWaktu = hariIni.getTime() - jatuhTempoTanggal.getTime();
    const selisihHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));
    const totalDendaBukuIni = selisihHari > 0 ? selisihHari * tarifDenda : 0;

    let namaBukuTerproses = "";
    const listBukuDiperbarui = dataTx.buku.map((b) => {
      if (b.id === bukuIdRaib && (b.status === "Dipinjam" || !b.status)) {
        namaBukuTerproses = b.judul;
        return { 
          ...b, 
          status: "Kembali", 
          tanggalDikembalikan: new Date().toLocaleDateString("id-ID"),
          denda: totalDendaBukuIni,
          terlambatHari: selisihHari > 0 ? selisihHari : 0
        };
      }
      if (!b.status) b.status = "Dipinjam";
      return b;
    });

    const masihAdaBukuDipinjam = listBukuDiperbarui.some(b => b.status === "Dipinjam");
    const statusTransaksiBaru = masihAdaBukuDipinjam ? "Dipinjam" : "Kembali";

    await updateDoc(txRef, {
      status: statusTransaksiBaru,
      buku: listBukuDiperbarui
    });

    if (totalDendaBukuIni > 0) {
      await addDoc(collection(db, "kas"), {
        type: "Pemasukan",
        kategori: "Infaq Keterlambatan",
        nominal: totalDendaBukuIni,
        keterangan: `Otomatis: Denda telat ${selisihHari} hari buku [${namaBukuTerproses}] oleh ${dataTx.namaPeminjam}`,
        createdAt: serverTimestamp()
      });
      alert(`↩️ Buku Berhasil Kembali!\n👤 Peminjam: ${dataTx.namaPeminjam}\n📖 Judul: ${namaBukuTerproses}\n⚠️ Terlambat: ${selisihHari} Hari\n💰 Infaq Denda Rp${totalDendaBukuIni.toLocaleString("id-ID")} otomatis masuk Kas Keuangan!`);
    } else {
      alert(`🎉 Sukses! Buku [${namaBukuTerproses}] milik ${dataTx.namaPeminjam} berhasil dikembalikan tepat waktu!`);
    }
  };

  // ==============================================================
  // MESIN SCAN PINTAR (MENDUKUNG FILTER KARTU ANGGOTA)
  // ==============================================================
  const handleScanPengembalian = async (dataQR) => {
    // KONDISI 1: Jika yang di-scan adalah KARTU ANGGOTA
    if (dataQR.startsWith("ANGGOTA|")) {
      const parts = dataQR.split("|");
      const nia = parts[1];
      const nama = parts[2];
      
      setScannedMember({ nia, nama });
      alert(`🎯 Kartu Anggota [${nama}] Terdeteksi!\n\nSistem mengunci akun ${nama}. Kamera tetap menyala, silakan langsung arahkan ke QR Punggung Buku untuk memulangkannya.`);
      return; // Kamera tetap menyala (tidak di-close) agar bisa langsung scan buku
    }

    // KONDISI 2: Jika yang di-scan adalah BUKU
    if (dataQR.startsWith("BUKU|")) {
      const idBukuDitemukan = dataQR.split("|")[1];
      setBukaKameraMundur(false); // Tutup kamera jika buku berhasil terbaca

      let transaksiTarget = null;

      // JALUR 1: Jika sebelumnya sudah scan kartu anggota (PRESISI 100%)
      if (scannedMember) {
        transaksiTarget = pinjaman.find(tx => 
          tx.nomorAnggota === scannedMember.nia && 
          tx.status === "Dipinjam" && 
          tx.buku.some(b => b.id === idBukuDitemukan && (b.status === "Dipinjam" || !b.status))
        );

        if (!transaksiTarget) {
          alert(`⚠️ Anggota bernama [${scannedMember.nama}] tidak tercatat meminjam buku fisik tersebut.`);
          setScannedMember(null);
          return;
        }
      } 
      // JALUR 2: Jika langsung scan buku tanpa scan kartu anggota
      else {
        const semuaTransaksiTerlibat = pinjaman.filter(tx => 
          tx.status === "Dipinjam" && 
          tx.buku.some(b => b.id === idBukuDitemukan && (b.status === "Dipinjam" || !b.status))
        );

        if (semuaTransaksiTerlibat.length === 0) {
          return alert("ℹ️ Buku tidak terdeteksi dalam daftar pinjam aktif.");
        }

        // Proteksi jika ada buku kembar terpinjam bersamaan
        if (semuaTransaksiTerlibat.length > 1) {
          return alert(`🚨 KASUS QR KEMBAR!\n\nAda ${semuaTransaksiTerlibat.length} orang sedang meminjam buku ber-QR sama saat ini.\n\nSolusi:\nSilakan scan KARTU ANGGOTA orangnya terlebih dahulu pada kamera ini, atau tutup kamera lalu klik tombol "↩️ Kembalikan" secara manual.`);
        }

        transaksiTarget = semuaTransaksiTerlibat[0];
      }

      // Eksekusi pemulangan buku
      await eksekusiKembaliBukuTunggal(transaksiTarget.id, idBukuDitemukan);
      setScannedMember(null); // Reset kunci setelah sukses balik
    } else {
      alert("⚠️ Barcode salah! Gunakan Kartu Anggota atau QR Punggung Buku.");
    }
  };

  if (loading) return <div className="p-4 text-center text-xs font-bold text-gray-500 animate-pulse">Memuat log sirkulasi...</div>;

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      
      {/* MODAL SCANNER */}
      {bukaKameraMundur && (
        <ScannerModal 
          title={scannedMember ? `Kamera Terkunci 🔒 Buku Milik: ${scannedMember.nama}` : "Scan Kartu Anggota / Punggung Buku"} 
          onScan={handleScanPengembalian} 
          onClose={() => { setBukaKameraMundur(false); setScannedMember(null); }} 
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-4 gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <span>📋</span> Log Sirkulasi Buku
          </h2>
          <p className="text-xs text-gray-500">Mendukung pengembalian eceran, pencegahan QR kembar, & otomatisasi denda</p>
        </div>
        
        <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
          <button 
            onClick={() => setBukaKameraMundur(true)} 
            className="w-full sm:w-auto px-5 py-3 bg-emerald-600 text-white font-black text-xs rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 tracking-wider uppercase"
          >
            📷 SCAN QR PENGEMBALIAN
          </button>
          
          {/* INDIKATOR STATUS PINJAM DI LAYAR UTAMA */}
          {scannedMember && (
            <div className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-lg font-bold flex items-center gap-2 animate-pulse">
              <span>🔒 Terkunci: Peminjam {scannedMember.nama}</span>
              <button onClick={() => setScannedMember(null)} className="text-red-600 font-extrabold hover:bg-red-100 px-1 rounded">✕ Batal</button>
            </div>
          )}
        </div>
      </div>

      {pinjaman.length === 0 ? (
        <p className="text-center py-6 text-gray-500 italic text-sm">Belum ada riwayat peminjaman.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Peminjam</th>
                <th className="p-3">Daftar Buku & Status Eceran</th>
                <th className="p-3">Batas Tanggal</th>
                <th className="p-3 text-center">Status Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {pinjaman.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50/80 transition-all">
                  
                  <td className="p-3">
                    <p className="font-black text-gray-900 text-sm">{item.namaPeminjam}</p>
                    <span className="text-[10px] font-bold text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded border">{item.nomorAnggota}</span>
                  </td>
                  
                  <td className="p-3 min-w-[280px]">
                    <div className="flex flex-col gap-2">
                      {item.buku?.map((b, i) => {
                        const statusBukuAktif = b.status || "Dipinjam";
                        return (
                          <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200 gap-2">
                            <div className="max-w-[180px] sm:max-w-[240px]">
                              <p className="truncate font-bold text-gray-800 text-xs">🔹 {b.judul}</p>
                              {statusBukuAktif === "Kembali" && (
                                <p className="text-[9px] text-gray-400 font-medium">Balik tgl: {b.tanggalDikembalikan} {b.denda > 0 && `(Denda: Rp${b.denda.toLocaleString("id-ID")})`}</p>
                              )}
                            </div>
                            
                            <div>
                              {statusBukuAktif === "Dipinjam" ? (
                                <button 
                                  onClick={() => {
                                    if(window.confirm(`Kembalikan buku "${b.judul}"?`)) {
                                      eksekusiKembaliBukuTunggal(item.id, b.id);
                                    }
                                  }}
                                  className="px-2 py-1 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[10px] font-black rounded-md shadow-sm transition-all whitespace-nowrap"
                                >
                                  ↩️ Kembalikan
                                </button>
                              ) : (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[9px] font-black rounded border border-green-200 whitespace-nowrap">✓ KEMBALI</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  
                  <td className="p-3 whitespace-nowrap">
                    <p className="text-gray-500 font-semibold text-xs">📆 Pinjam: {item.tanggalPinjam}</p>
                    <p className="text-red-600 font-bold text-xs">🚨 Batas: {item.tanggalJatuhTempo}</p>
                  </td>
                  
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${item.status === 'Dipinjam' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
                      {item.status === 'Dipinjam' ? '🚚 Belum Lengkap' : '✅ Transaksi Selesai'}
                    </span>
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