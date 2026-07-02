// src/components/InputPeminjaman.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, getDocs } from "firebase/firestore";
import ScannerModal from "./ScannerModal";

export default function InputPeminjaman({ hakAksesAdmin }) {
  const [lamaPinjam, setLamaPinjam] = useState(7);
  const [dendaPerHari, setDendaPerHari] = useState(1000);
  const [loadingAturan, setLoadingAturan] = useState(true);

  // DATABASE BUKU & ANGGOTA UNTUK AUTOCOMPLETE
  const [bukuList, setBukuList] = useState([]);
  const [anggotaList, setAnggotaList] = useState([]);
  
  const [kataKunciBuku, setKataKunciBuku] = useState("");
  const [hasilCariBuku, setHasilCariBuku] = useState([]);
  
  const [kataKunciAnggota, setKataKunciAnggota] = useState("");
  const [hasilCariAnggota, setHasilCariAnggota] = useState([]);

  const [nomorAnggota, setNomorAnggota] = useState("");
  const [namaPeminjam, setNamaPeminjam] = useState("");
  const [bukuTerpilih, setBukuTerpilih] = useState([]); 
  const [loadingPinjam, setLoadingPinjam] = useState(false);
  const [scanMode, setScanMode] = useState(null); 
  const [tglJatuhTempoManual, setTglJatuhTempoManual] = useState("");
  const [minDate, setMinDate] = useState("");

  const aksesPenuh = hakAksesAdmin === "Full Akses" || hakAksesAdmin === "Akses Besar";

  useEffect(() => {
    const today = new Date();
    setMinDate(today.toISOString().split('T')[0]);

    const ambilData = async () => {
      try {
        const docRef = doc(db, "settings", "sirkulasi");
        const docSnap = await getDoc(docRef);
        let durasi = 7;
        if (docSnap.exists()) {
          durasi = docSnap.data().lamaPinjam || 7;
          setLamaPinjam(durasi);
          setDendaPerHari(docSnap.data().dendaPerHari || 1000);
        }
        
        const defaultKembali = new Date();
        defaultKembali.setDate(defaultKembali.getDate() + durasi);
        setTglJatuhTempoManual(defaultKembali.toISOString().split('T')[0]);

        const snapBuku = await getDocs(collection(db, "buku"));
        const listBuku = [];
        snapBuku.forEach(d => listBuku.push({ id: d.id, ...d.data() }));
        setBukuList(listBuku);

        // MENGAMBIL DATA ANGGOTA UNTUK PENCARIAN
        const snapAnggota = await getDocs(collection(db, "anggota"));
        const listAnggota = [];
        snapAnggota.forEach(d => listAnggota.push({ id: d.id, ...d.data() }));
        setAnggotaList(listAnggota);

      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAturan(false);
      }
    };
    ambilData();
  }, []);

  const handleCariAnggota = (e) => {
    const val = e.target.value;
    setKataKunciAnggota(val);
    setNamaPeminjam(""); // Reset saat diketik ulang
    setNomorAnggota("");

    if (val.length > 1) {
      const keyword = val.toLowerCase();
      const filtered = anggotaList.filter(a => 
        (a.nama && a.nama.toLowerCase().includes(keyword)) || 
        (a.nomorAnggota && a.nomorAnggota.toLowerCase().includes(keyword))
      ).slice(0, 5);
      setHasilCariAnggota(filtered);
    } else {
      setHasilCariAnggota([]);
    }
  };

  const handlePilihAnggota = (anggota) => {
    setNomorAnggota(anggota.nomorAnggota);
    setNamaPeminjam(anggota.nama);
    setKataKunciAnggota(`${anggota.nama} (${anggota.nomorAnggota})`);
    setHasilCariAnggota([]); // Tutup dropdown
  };

  useEffect(() => {
    if (kataKunciBuku.length > 1) {
      const keyword = kataKunciBuku.toLowerCase();
      const filtered = bukuList.filter(b => 
        (b.judul && b.judul.toLowerCase().includes(keyword)) || 
        (b.noBuku && b.noBuku.toLowerCase().includes(keyword))
      ).slice(0, 5);
      setHasilCariBuku(filtered);
    } else {
      setHasilCariBuku([]);
    }
  }, [kataKunciBuku, bukuList]);

  const handlePilihBukuManual = (buku) => {
    if (bukuTerpilih.some(b => b.id === buku.id)) alert("Buku ini sudah ada di keranjang!");
    else setBukuTerpilih(prev => [...prev, { id: buku.id, judul: buku.judul, noBuku: buku.noBuku }]);
    setKataKunciBuku(""); setHasilCariBuku([]);
  };

  const handleSimpanAturan = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "sirkulasi"), { lamaPinjam: Number(lamaPinjam), dendaPerHari: Number(dendaPerHari) });
      const date = new Date(); date.setDate(date.getDate() + Number(lamaPinjam));
      setTglJatuhTempoManual(date.toISOString().split('T')[0]);
      alert("✅ Setelan aturan sirkulasi berhasil diperbarui!");
    } catch (err) { alert("Gagal menyimpan aturan: " + err.message); }
  };

  const handleHasilScan = (dataQR) => {
    setScanMode(null);
    if (dataQR.startsWith("ANGGOTA|")) {
      const parts = dataQR.split("|");
      setNomorAnggota(parts[1]); setNamaPeminjam(parts[2]);
      setKataKunciAnggota(`${parts[2]} (${parts[1]})`);
    } else if (dataQR.startsWith("BUKU|")) {
      const parts = dataQR.split("|");
      const idBuku = parts[1];
      const targetBuku = bukuList.find(b => b.id === idBuku);
      if (!targetBuku) return alert("⚠️ Buku tidak terdaftar!");
      if (bukuTerpilih.some(b => b.id === idBuku)) return alert("Buku ini sudah di-scan.");
      setBukuTerpilih(prev => [...prev, { id: targetBuku.id, judul: targetBuku.judul, noBuku: targetBuku.noBuku }]);
    } else alert("⚠️ Barcode tidak dikenali!");
  };

  const handleCheckoutPinjam = async (e) => {
    e.preventDefault();
    if (!namaPeminjam || bukuTerpilih.length === 0) return alert("Pastikan Peminjam berstatus Anggota dan pilih buku!");
    
    setLoadingPinjam(true);
    try {
      const tglPinjam = new Date();
      const tglJatuhTempo = new Date(tglJatuhTempoManual); tglJatuhTempo.setHours(23, 59, 59);

      await addDoc(collection(db, "peminjaman"), {
        nomorAnggota: nomorAnggota, namaPeminjam, buku: bukuTerpilih,
        tanggalPinjam: tglPinjam.toLocaleDateString("id-ID"),
        tanggalJatuhTempo: tglJatuhTempo.toLocaleDateString("id-ID"),
        rawJatuhTempo: tglJatuhTempo, status: "Dipinjam", createdAt: serverTimestamp()
      });

      alert(`🎉 Sukses! Buku harus dikembalikan pada: ${tglJatuhTempo.toLocaleDateString("id-ID")}`);
      setNomorAnggota(""); setNamaPeminjam(""); setKataKunciAnggota(""); setBukuTerpilih([]); 
    } catch (err) { alert("Gagal melakukan sirkulasi."); } 
    finally { setLoadingPinjam(false); }
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 max-w-4xl">
      {scanMode && <ScannerModal title={`Scan QR ${scanMode}`} onScan={handleHasilScan} onClose={() => setScanMode(null)} />}

      {/* BOX SETELAN ATURAN */}
      <div className="w-full md:w-[320px] bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit">
        <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-3 flex items-center gap-2 text-blue-700"><span>⚙️</span> Aturan Sirkulasi</h3>
        {loadingAturan ? <p className="text-xs animate-pulse">Memuat...</p> : (
          <form onSubmit={handleSimpanAturan} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Durasi Pinjam (Hari)</label>
              <input type="number" required disabled={!aksesPenuh} value={lamaPinjam} onChange={(e) => setLamaPinjam(e.target.value)} className="p-2 border-2 rounded-xl w-full text-sm font-bold bg-gray-50 outline-none disabled:bg-gray-200" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Denda / Hari (Rp)</label>
              <input type="number" required disabled={!aksesPenuh} value={dendaPerHari} onChange={(e) => setDendaPerHari(e.target.value)} className="p-2 border-2 rounded-xl w-full text-sm font-bold bg-gray-50 outline-none disabled:bg-gray-200" />
            </div>
            {aksesPenuh ? (
              <button type="submit" className="py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 mt-1">💾 Terapkan Setelan</button>
            ) : (
              <p className="text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200 text-center mt-1">🔒 Hanya Full Akses yang bisa mengubah aturan.</p>
            )}
          </form>
        )}
      </div>

      {/* BOX FORM TRANSAKSI */}
      <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-black text-gray-800 mb-4 border-b pb-3 flex items-center gap-2"><span>🔄</span> Peminjaman Buku</h2>

        {/* INPUT PINTAR: CARI ANGGOTA (AUTOCOMPLETE) */}
        <div className="relative mb-5 z-40">
          <div className="flex items-center gap-2 p-2.5 border-2 rounded-xl bg-orange-50 border-orange-200 transition-all focus-within:border-orange-500">
            <span className="text-orange-500 font-bold px-1 text-lg">👤</span>
            <input type="text" placeholder="Ketik Nama atau NIA Anggota..." value={kataKunciAnggota} onChange={handleCariAnggota} className="w-full bg-transparent outline-none text-sm font-bold text-gray-800" />
            <button onClick={() => setScanMode('anggota')} className="text-xs bg-orange-500 text-white px-2 py-1 rounded font-bold hover:bg-orange-600">📷 SCAN</button>
          </div>
          
          {hasilCariAnggota.length > 0 && (
            <div className="absolute top-14 left-0 w-full bg-white border-2 border-orange-200 rounded-xl shadow-xl overflow-hidden">
              {hasilCariAnggota.map(a => (
                <div key={a.id} onClick={() => handlePilihAnggota(a)} className="p-3 border-b hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-all">
                  <p className="text-xs font-black text-gray-800">{a.nama}</p>
                  <span className="text-[10px] font-bold bg-gray-200 px-2 py-0.5 rounded-md text-gray-700">{a.nomorAnggota || "-"}</span>
                </div>
              ))}
            </div>
          )}
          {!namaPeminjam && kataKunciAnggota && hasilCariAnggota.length === 0 && (
             <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">*Anggota tidak ditemukan. Peminjam wajib terdaftar di database.</p>
          )}
        </div>

        {/* INPUT PINTAR: CARI BUKU */}
        <div className="relative mb-5 z-30">
          <div className="flex items-center gap-2 p-2.5 border-2 rounded-xl bg-indigo-50 border-indigo-200 transition-all focus-within:border-indigo-500">
            <span className="text-indigo-500 font-bold px-1 text-lg">📚</span>
            <input type="text" placeholder="Ketik Judul Buku..." value={kataKunciBuku} onChange={(e) => setKataKunciBuku(e.target.value)} className="w-full bg-transparent outline-none text-sm font-bold text-gray-800" />
            <button onClick={() => setScanMode('buku')} className="text-xs bg-indigo-500 text-white px-2 py-1 rounded font-bold hover:bg-indigo-600">📷 SCAN</button>
          </div>
          {hasilCariBuku.length > 0 && (
            <div className="absolute top-14 left-0 w-full bg-white border-2 border-indigo-200 rounded-xl shadow-xl overflow-hidden">
              {hasilCariBuku.map(b => (
                <div key={b.id} onClick={() => handlePilihBukuManual(b)} className="p-3 border-b hover:bg-indigo-50 cursor-pointer flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-800 line-clamp-1">{b.judul}</p>
                  <span className="text-[10px] font-bold bg-gray-200 px-2 py-0.5 rounded-md flex-shrink-0">{b.noBuku || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleCheckoutPinjam} className="flex flex-col gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 min-h-[100px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Keranjang Buku ({bukuTerpilih.length})</p>
            {bukuTerpilih.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">Keranjang masih kosong...</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {bukuTerpilih.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 border rounded-lg shadow-sm text-xs">
                    <p className="font-bold text-gray-800 line-clamp-1"><span className="text-[#8e0004] mr-1">[{b.noBuku}]</span> {b.judul}</p>
                    <button type="button" onClick={() => setBukuTerpilih(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 font-bold px-2 py-1 hover:bg-red-50 rounded">✖</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Tanggal Batas Pengembalian</label>
            <input type="date" required min={minDate} value={tglJatuhTempoManual} onChange={(e) => setTglJatuhTempoManual(e.target.value)} className="w-full p-3 border-2 rounded-xl bg-gray-50 text-sm font-bold outline-none cursor-pointer focus:border-blue-600" />
          </div>

          <button type="submit" disabled={loadingPinjam || !namaPeminjam} className="w-full py-4 bg-gray-800 text-white font-black rounded-xl hover:bg-black text-sm uppercase tracking-widest shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
            {loadingPinjam ? "Memproses..." : "🔒 Konfirmasi Pinjam"}
          </button>
        </form>
      </div>
    </div>
  );
}