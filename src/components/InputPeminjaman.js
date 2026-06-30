// src/components/InputPeminjaman.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import ScannerModal from "./ScannerModal";

export default function InputPeminjaman() {
  // State Peminjam
  const [namaPeminjam, setNamaPeminjam] = useState("");
  const [kontak, setKontak] = useState("");
  
  // State Database (Untuk Fitur Ketik Manual / Mesin Pencari)
  const [daftarAnggota, setDaftarAnggota] = useState([]);
  const [tampilSaranAnggota, setTampilSaranAnggota] = useState(false);
  const [katalogBuku, setKatalogBuku] = useState([]);
  const [pencarianBuku, setPencarianBuku] = useState("");
  const [bukuTerpilih, setBukuTerpilih] = useState([]); 

  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);
  const [modeKamera, setModeKamera] = useState(null); // 'anggota' atau 'buku'

  useEffect(() => {
    // 1. Tarik Data Buku untuk Pencarian Manual
    const unsubBuku = onSnapshot(query(collection(db, "buku")), (snapshot) => {
      const dataBuku = [];
      snapshot.forEach((doc) => dataBuku.push({ id: doc.id, ...doc.data() }));
      setKatalogBuku(dataBuku);
    });
    // 2. Tarik Data Anggota untuk Pencarian Manual
    const unsubAnggota = onSnapshot(query(collection(db, "anggota")), (snapshot) => {
      const dataAnggota = [];
      snapshot.forEach((doc) => dataAnggota.push({ id: doc.id, ...doc.data() }));
      setDaftarAnggota(dataAnggota);
    });
    return () => { unsubBuku(); unsubAnggota(); };
  }, []);

  // ================= LOGIKA MESIN PENCARI (KETIK MANUAL) =================
  const hasilPencarianAnggota = namaPeminjam === "" ? [] : daftarAnggota.filter(a => 
    a.nama?.toLowerCase().includes(namaPeminjam.toLowerCase())
  ).slice(0, 5);

  const handlePilihAnggota = (anggota) => {
    setNamaPeminjam(anggota.nama);
    setKontak(anggota.noHp || anggota.kontak || anggota.alamat || ""); 
    setTampilSaranAnggota(false);
  };

  const hasilPencarianBuku = pencarianBuku === "" ? [] : katalogBuku.filter(b => 
    b.judul?.toLowerCase().includes(pencarianBuku.toLowerCase()) || 
    (b.noBuku && b.noBuku.toLowerCase().includes(pencarianBuku.toLowerCase()))
  ).slice(0, 5);

  const handlePilihBukuManual = (buku) => {
    if (!bukuTerpilih.find(b => b.id === buku.id)) {
      setBukuTerpilih([...bukuTerpilih, buku]);
    }
    setPencarianBuku(""); 
  };
  // =======================================================================


  // ================= LOGIKA SCANNER KAMERA =================
  const handleScanBerhasil = (dataQR) => {
    setModeKamera(null);
    if (dataQR.startsWith("ANGGOTA|")) {
      const dataPisah = dataQR.split("|");
      setNamaPeminjam(dataPisah[2]); 
      setKontak(dataPisah[3]);
    } 
    else if (dataQR.startsWith("BUKU|")) {
      const idBuku = dataQR.split("|")[1];
      const bukuDitemukan = katalogBuku.find(b => b.id === idBuku);
      if (bukuDitemukan) {
        if (!bukuTerpilih.find(b => b.id === bukuDitemukan.id)) setBukuTerpilih(prev => [...prev, bukuDitemukan]);
        else alert("Buku ini sudah ada di dalam keranjang!");
      } else {
        alert("Buku tidak ditemukan di database!");
      }
    } 
    else {
      alert("⚠️ QR Code tidak dikenali!");
    }
  };
  // =========================================================

  const handleHapusDariKeranjang = (id) => setBukuTerpilih(bukuTerpilih.filter(b => b.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (bukuTerpilih.length === 0) return alert("Belum ada buku yang di-scan/pilih!");
    setLoading(true);
    try {
      const tglPinjam = new Date();
      const tglTenggat = new Date();
      tglTenggat.setDate(tglPinjam.getDate() + 7); // Default 7 hari pinjam

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
      setNamaPeminjam(""); setKontak(""); setBukuTerpilih([]); setPencarianBuku("");
      setSukses(true); setTimeout(() => setSukses(false), 4000);
    } catch (error) { alert("Error: " + error.message); } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      
      {/* KAMERA POP-UP */}
      {modeKamera && <ScannerModal title={`Scan QR ${modeKamera === 'anggota' ? 'Kartu Anggota' : 'Stiker Buku'}`} onScan={handleScanBerhasil} onClose={() => setModeKamera(null)} />}

      <h2 className="text-xl font-black text-gray-800 mb-6 border-b pb-4 flex items-center gap-2"><span>📖</span> Input Sirkulasi Peminjaman</h2>
      
      {sukses && <div className="mb-6 p-4 bg-green-50 border text-green-700 rounded-xl font-bold">✅ {bukuTerpilih.length} Transaksi dicatat!</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* BAGIAN 1: IDENTITAS PEMINJAM (SCAN & KETIK MANUAL) */}
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold text-orange-900 uppercase tracking-wider">1. Identitas Peminjam</label>
            <button type="button" onClick={() => setModeKamera("anggota")} className="px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-md shadow hover:bg-orange-700 transition-all flex items-center gap-1">📷 Scan Kartu</button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            <div className="relative w-full">
              <input 
                type="text" required 
                value={namaPeminjam} 
                onChange={(e) => { setNamaPeminjam(e.target.value); setTampilSaranAnggota(true); }}
                onFocus={() => setTampilSaranAnggota(true)}
                placeholder="🔍 Ketik nama anggota..." 
                className="w-full p-3 border-2 border-orange-200 bg-white rounded-xl outline-none text-sm focus:border-[#8e0004] transition-all" 
              />
              {/* Dropdown Pencarian Nama */}
              {tampilSaranAnggota && hasilPencarianAnggota.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-white border-2 border-[#8e0004]/20 rounded-xl shadow-xl overflow-hidden">
                  {hasilPencarianAnggota.map(anggota => (
                    <div key={anggota.id} onClick={() => handlePilihAnggota(anggota)} className="p-3 border-b hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-colors">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{anggota.nama}</p>
                        <p className="text-[10px] font-bold text-orange-600 mt-0.5">Kontak/Alamat: {anggota.noHp || anggota.kontak || anggota.alamat || "-"}</p>
                      </div>
                      <span className="text-xs font-black text-[#8e0004] bg-orange-100 px-2 py-1 rounded">Pilih</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input type="text" value={kontak} onChange={(e) => setKontak(e.target.value)} placeholder="Kontak / Alamat..." className="w-full p-3 border-2 border-orange-200 bg-white rounded-xl outline-none text-sm focus:border-[#8e0004]" />
          </div>
        </div>

        {/* BAGIAN 2: KERANJANG BUKU (SCAN & KETIK MANUAL) */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">2. Buku Yang Dipinjam ({bukuTerpilih.length})</label>
            <button type="button" onClick={() => setModeKamera("buku")} className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-md shadow hover:bg-indigo-700 transition-all flex items-center gap-1">📷 Scan Buku</button>
          </div>
          
          <div className="relative mb-3 w-full">
            <input 
              type="text" 
              value={pencarianBuku} 
              onChange={(e) => setPencarianBuku(e.target.value)} 
              placeholder="🔍 Atau ketik judul / No. Buku manual..." 
              className="w-full p-3 border-2 border-indigo-200 bg-white rounded-xl focus:border-indigo-600 outline-none text-sm font-medium transition-all" 
            />
            {/* Dropdown Pencarian Buku */}
            {hasilPencarianBuku.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border-2 border-indigo-100 rounded-xl shadow-xl overflow-hidden">
                {hasilPencarianBuku.map(buku => (
                  <div key={buku.id} onClick={() => handlePilihBukuManual(buku)} className="p-3 border-b hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{buku.judul}</p>
                      <p className="text-[10px] font-bold text-indigo-600 mt-0.5 uppercase tracking-wider">No: {buku.noBuku || "-"}</p>
                    </div>
                    <span className="text-xl font-bold text-indigo-400">+</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-dashed border-indigo-300 p-4 rounded-xl min-h-[80px]">
            {bukuTerpilih.length === 0 ? <p className="text-sm text-gray-400 italic text-center">Buku yang dipilih akan masuk ke keranjang ini.</p> : (
              <div className="flex flex-col gap-2">
                {bukuTerpilih.map((buku) => (
                  <div key={buku.id} className="flex justify-between bg-gray-50 p-2.5 rounded-lg border shadow-sm items-center">
                    <p className="text-sm font-bold text-[#8e0004] truncate">{buku.judul}</p>
                    <button type="button" onClick={() => handleHapusDariKeranjang(buku.id)} className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-md font-bold hover:bg-red-500 hover:text-white transition-all">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-4 bg-[#8e0004] text-white font-black rounded-xl hover:bg-red-900 shadow-md transition-all active:translate-y-1">
          {loading ? "Memproses..." : `🚀 Simpan ${bukuTerpilih.length > 0 ? bukuTerpilih.length + ' Transaksi' : 'Transaksi'}`}
        </button>
      </form>
    </div>
  );
}