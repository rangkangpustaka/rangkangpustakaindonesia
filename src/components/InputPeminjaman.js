// src/components/InputPeminjaman.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import ScannerModal from "./ScannerModal"; // IMPOR KAMERA

export default function InputPeminjaman() {
  const [namaPeminjam, setNamaPeminjam] = useState("");
  const [kontak, setKontak] = useState("");
  
  const [katalogBuku, setKatalogBuku] = useState([]);
  const [bukuTerpilih, setBukuTerpilih] = useState([]); 

  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);

  const [modeKamera, setModeKamera] = useState(null); // 'anggota' atau 'buku'

  useEffect(() => {
    const unsubBuku = onSnapshot(query(collection(db, "buku")), (snapshot) => {
      const dataBuku = [];
      snapshot.forEach((doc) => dataBuku.push({ id: doc.id, ...doc.data() }));
      setKatalogBuku(dataBuku);
    });
    return () => unsubBuku(); 
  }, []);

  // LOGIKA SAAT KAMERA BERHASIL MEMBACA QR CODE
  const handleScanBerhasil = (dataQR) => {
    setModeKamera(null); // Matikan kamera

    if (dataQR.startsWith("ANGGOTA|")) {
      const dataPisah = dataQR.split("|");
      setNamaPeminjam(dataPisah[2]); 
      setKontak(dataPisah[3]);
    } 
    else if (dataQR.startsWith("BUKU|")) {
      const idBuku = dataQR.split("|")[1];
      const bukuDitemukan = katalogBuku.find(b => b.id === idBuku);
      
      if (bukuDitemukan) {
        if (!bukuTerpilih.find(b => b.id === bukuDitemukan.id)) {
          setBukuTerpilih(prev => [...prev, bukuDitemukan]);
        } else {
          alert("Buku ini sudah ada di dalam keranjang!");
        }
      } else {
        alert("Buku tidak ditemukan di database!");
      }
    } 
    else {
      alert("⚠️ QR Code tidak dikenali!");
    }
  };

  const handleHapusDariKeranjang = (id) => setBukuTerpilih(bukuTerpilih.filter(b => b.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bukuTerpilih.length === 0) return alert("Belum ada buku yang di-scan/pilih!");
    setLoading(true);
    try {
      const tglPinjam = new Date();
      const tglTenggat = new Date();
      tglTenggat.setDate(tglPinjam.getDate() + 7);

      for (const buku of bukuTerpilih) {
        await addDoc(collection(db, "peminjaman"), {
          namaPeminjam, kontak: kontak || "-",
          judulBuku: buku.judul, noBuku: buku.noBuku || "-",
          tanggalPinjam: tglPinjam.toLocaleDateString("id-ID"),
          tenggatWaktu: tglTenggat.toLocaleDateString("id-ID"),
          timestampTenggat: tglTenggat.getTime(),
          status: "Dipinjam", createdAt: serverTimestamp(),
        });
      }
      setNamaPeminjam(""); setKontak(""); setBukuTerpilih([]); 
      setSukses(true); setTimeout(() => setSukses(false), 4000);
    } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      
      {/* POPUP KAMERA TAMPIL JIKA TOMBOL DITEKAN */}
      {modeKamera && <ScannerModal title={`Scan QR ${modeKamera === 'anggota' ? 'Kartu Anggota' : 'Stiker Buku'}`} onScan={handleScanBerhasil} onClose={() => setModeKamera(null)} />}

      <h2 className="text-xl font-black text-gray-800 mb-6 border-b pb-4 flex items-center gap-2"><span>📖</span> Input Sirkulasi Kilat</h2>
      {sukses && <div className="mb-6 p-4 bg-green-50 border text-green-700 rounded-xl font-bold">✅ {bukuTerpilih.length} Transaksi dicatat!</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* BARIS 1: DATA ANGGOTA */}
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold text-orange-900 uppercase tracking-wider">1. Identitas Peminjam</label>
            <button type="button" onClick={() => setModeKamera("anggota")} className="px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-md shadow hover:bg-orange-700">📷 Scan Kartu</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" required value={namaPeminjam} onChange={(e) => setNamaPeminjam(e.target.value)} placeholder="Nama / Ketik manual..." className="p-3 border-2 rounded-xl outline-none text-sm" />
            <input type="text" value={kontak} onChange={(e) => setKontak(e.target.value)} placeholder="Kontak / Alamat..." className="p-3 border-2 rounded-xl outline-none text-sm" />
          </div>
        </div>

        {/* BARIS 2: KERANJANG BUKU */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">2. Buku Yang Dipinjam ({bukuTerpilih.length})</label>
            <button type="button" onClick={() => setModeKamera("buku")} className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-md shadow hover:bg-indigo-700">📷 Scan Buku</button>
          </div>
          
          <div className="bg-white border-2 border-dashed border-indigo-300 p-4 rounded-xl min-h-[80px]">
            {bukuTerpilih.length === 0 ? <p className="text-sm text-gray-400 italic text-center">Tekan 'Scan Buku' untuk menambahkan</p> : (
              <div className="flex flex-col gap-2">
                {bukuTerpilih.map((buku) => (
                  <div key={buku.id} className="flex justify-between bg-gray-50 p-2.5 rounded-lg border shadow-sm items-center">
                    <p className="text-sm font-bold text-[#8e0004] truncate">{buku.judul}</p>
                    <button type="button" onClick={() => handleHapusDariKeranjang(buku.id)} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-md font-bold hover:bg-red-500 hover:text-white">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-[#8e0004] text-white font-black rounded-xl hover:bg-red-900 shadow-md">
          {loading ? "Memproses..." : `🚀 Simpan Transaksi`}
        </button>
      </form>
    </div>
  );
}