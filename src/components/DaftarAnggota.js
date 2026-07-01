// src/components/DaftarAnggota.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function DaftarAnggota() {
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState("");
  
  const [anggotaTerpilih, setAnggotaTerpilih] = useState([]);

  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editKontak, setEditKontak] = useState("");
  const [editAlamat, setEditAlamat] = useState("");

  useEffect(() => {
    const q = query(collection(db, "anggota"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dataAnggota = [];
      querySnapshot.forEach((document) => {
        dataAnggota.push({ id: document.id, ...document.data() });
      });
      setAnggota(dataAnggota);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Hapus anggota "${nama}" dari database?`)) {
      await deleteDoc(doc(db, "anggota", id));
      setAnggotaTerpilih(prev => prev.filter(aId => aId !== id));
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id); 
    setEditNama(item.nama); 
    setEditKontak(item.kontak || ""); 
    setEditAlamat(item.alamat || "");
  };

  const handleUpdate = async (id) => {
    try {
      await updateDoc(doc(db, "anggota", id), { 
        nama: editNama, 
        kontak: editKontak, 
        alamat: editAlamat 
      });
      setEditId(null);
    } catch (error) {
      alert("Gagal memperbarui data anggota: " + error.message);
    }
  };

  const handleTogglePilih = (id) => {
    setAnggotaTerpilih(prev => prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]);
  };

  const handlePilihSemua = () => {
    if (anggotaTerpilih.length === anggotaDifilter.length) setAnggotaTerpilih([]); 
    else setAnggotaTerpilih(anggotaDifilter.map(a => a.id)); 
  };

  // ==========================================
  // FITUR CETAK KARTU + INTEGRASI KAS KEUANGAN
  // ==========================================
  const handleCetakKartu = async () => {
    if (anggotaTerpilih.length === 0) return alert("Centang minimal 1 anggota untuk dicetak kartunya!");
    
    // Ajukan pertanyaan kas otomatis sebelum cetak lembar fisik
    if (window.confirm(`Apakah Anda ingin mencatat biaya pembuatan fisik untuk ${anggotaTerpilih.length} kartu ini ke Buku Kas Keuangan? (Infaq Rp5.000 / kartu)`)) {
      try {
        const totalBiayaCetak = anggotaTerpilih.length * 5000;
        
        // Suntik data ke kas otomatis
        await addDoc(collection(db, "kas"), {
          tipe: "Pemasukan",
          kategori: "Cetak Kartu Anggota",
          nominal: totalBiayaCetak,
          keterangan: `Otomatis: Pembuatan kartu fisik anggota (${anggotaTerpilih.length} orang)`,
          createdAt: serverTimestamp() 
        });
        alert(`💰 Kas Berhasil Dicatat! Pemasukan sebesar Rp${totalBiayaCetak.toLocaleString("id-ID")} telah dibukukan.`);
      } catch (e) {
        alert("Gagal mencatat kas otomatis: " + e.message);
      }
    }
    
    // Setelah konfirmasi kas selesai, baru jendela print terbuka
    window.print(); 
  };

  const anggotaDifilter = anggota.filter((item) => {
    const keyword = kataKunci.toLowerCase();
    return (
      item.nama?.toLowerCase().includes(keyword) || 
      item.nomorAnggota?.toLowerCase().includes(keyword) ||
      item.alamat?.toLowerCase().includes(keyword)
    );
  });

  if (loading) return <div className="p-4 text-center font-bold text-gray-600 animate-pulse">Memuat data anggota...</div>;

  return (
    <div className="w-full mt-4 print:mt-0">
      
      {/* TAMPILAN DASHBOARD WEB (Sembunyi Saat Cetak) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Manajemen Anggota</h2>
            <p className="text-sm text-gray-500">Total: {anggota.length} Anggota Terdaftar</p>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <input type="text" placeholder="Cari nama, NIA, alamat..." value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} className="w-full sm:w-56 p-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-[#8e0004] focus:bg-white transition-all" />
            <button onClick={handleCetakKartu} className="w-full sm:w-auto px-4 py-2.5 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 text-sm shadow-sm transition-all text-center">🪪 Cetak Kartu ({anggotaTerpilih.length})</button>
          </div>
        </div>

        {anggotaDifilter.length > 0 && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center">
            <input type="checkbox" id="pilihSemuaAnggota" className="w-5 h-5 cursor-pointer accent-indigo-600 mr-2" checked={anggotaDifilter.length > 0 && anggotaTerpilih.length === anggotaDifilter.length} onChange={handlePilihSemua} />
            <label htmlFor="pilihSemuaAnggota" className="text-sm font-bold text-indigo-800 cursor-pointer">Pilih Semua Anggota Terfilter</label>
          </div>
        )}

        {anggotaDifilter.length === 0 ? (
          <p className="text-center py-8 text-gray-500 italic">Data anggota tidak ditemukan.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {anggotaDifilter.map((item) => (
              <div key={item.id} className={`p-4 border-2 rounded-2xl shadow-sm relative transition-all ${anggotaTerpilih.includes(item.id) ? 'bg-indigo-50/50 border-indigo-400' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                
                <div className="absolute top-4 right-4 z-10">
                  <input type="checkbox" className="w-5 h-5 cursor-pointer accent-indigo-600" checked={anggotaTerpilih.includes(item.id)} onChange={() => handleTogglePilih(item.id)} />
                </div>

                {editId === item.id ? (
                  <div className="flex flex-col gap-2 text-xs">
                    <input className="p-2 border rounded-lg bg-gray-100 font-bold text-[#8e0004]" disabled value={item.nomorAnggota || "MEMBER LAMA"} />
                    <input className="p-2 border rounded-lg bg-gray-50 outline-none focus:border-[#8e0004]" placeholder="Nama" value={editNama} onChange={(e) => setEditNama(e.target.value)} />
                    <input className="p-2 border rounded-lg bg-gray-50 outline-none focus:border-[#8e0004]" placeholder="Alamat/Instansi" value={editAlamat} onChange={(e) => setEditAlamat(e.target.value)} />
                    <input className="p-2 border rounded-lg bg-gray-50 outline-none focus:border-[#8e0004]" placeholder="Kontak" value={editKontak} onChange={(e) => setEditKontak(e.target.value)} />
                    <div className="flex gap-2 justify-end mt-2">
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 font-bold rounded-lg hover:bg-gray-300">Batal</button>
                      <button onClick={() => handleUpdate(item.id)} className="px-3 py-1.5 bg-green-600 font-bold text-white rounded-lg hover:bg-green-700">Simpan</button>
                    </div>
                  </div>
                ) : (
                  <div className="pr-8">
                    <span className="text-[10px] font-extrabold bg-[#8e0004] text-white px-2 py-0.5 rounded-md tracking-wider">
                      {item.nomorAnggota || "MEMBER LAMA"}
                    </span>
                    <h3 className="font-bold text-gray-900 text-lg mt-1 line-clamp-1">{item.nama}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">📍 {item.alamat}</p>
                    <p className="text-xs text-gray-500 font-medium">📞 {item.kontak}</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Bergabung: {item.tanggalDaftar || "-"}</p>
                    
                    <div className="flex gap-1.5 mt-3">
                      <button onClick={() => handleEditClick(item)} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg hover:bg-amber-100 transition-all">Edit</button>
                      <button onClick={() => handleDelete(item.id, item.nama)} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition-all">Hapus</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TAMPILAN KHUSUS PRINT KARTU ID */}
      <div className="hidden print:flex flex-wrap gap-4 justify-start items-start">
        {anggotaDifilter.filter(a => anggotaTerpilih.includes(a.id)).map((item) => (
          <div key={`card-${item.id}`} className="relative w-[8.5cm] h-[5.4cm] border-[2px] border-black bg-white rounded-lg overflow-hidden flex flex-col font-sans break-inside-avoid shadow-sm print-exact-colors" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            
            <div className="h-[1.6cm] w-full flex items-center px-2 gap-2 border-b-4 border-[#fec700]" style={{ backgroundColor: '#8e0004' }}>
              <div className="h-11 w-11 bg-white rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img src="/logo.jpg" alt="Logo" className="h-full w-full object-contain p-0.5 bg-white" />
              </div>
              <div className="flex-1 text-center pr-4">
                <p className="text-[9px] font-bold tracking-widest uppercase mb-0.5" style={{ color: '#ffffff', opacity: 0.9 }}>KARTU ANGGOTA PERPUSTAKAAN</p>
                <p className="text-[12px] font-black uppercase leading-tight tracking-wide" style={{ color: '#ffffff' }}>Rangkang Pustaka</p>
              </div>
            </div>

            <div className="flex-1 flex p-2 bg-gradient-to-br from-white to-gray-50">
              <div className="flex-1 flex flex-col justify-center gap-1.5">
                <div>
                  <p className="text-[7px] font-extrabold uppercase tracking-wider" style={{ color: '#6b7280' }}>Nama Anggota</p>
                  <p className="text-[12px] font-black leading-tight line-clamp-1" style={{ color: '#111827' }}>{item.nama}</p>
                </div>
                <div>
                  <p className="text-[7px] font-extrabold uppercase tracking-wider" style={{ color: '#6b7280' }}>No. Induk Anggota (NIA)</p>
                  <p className="text-[11px] font-bold tracking-wide" style={{ color: '#8e0004' }}>{item.nomorAnggota || "MEMBER LAMA"}</p>
                </div>
                <div>
                  <p className="text-[7px] font-extrabold uppercase tracking-wider" style={{ color: '#6b7280' }}>Alamat / Instansi</p>
                  <p className="text-[9px] font-bold line-clamp-2 leading-tight" style={{ color: '#374151' }}>{item.alamat}</p>
                </div>
              </div>

              <div className="w-[2.2cm] h-full flex flex-col items-center justify-center border-l-2 border-dashed border-gray-300 pl-2 flex-shrink-0">
                <div className="w-[1.8cm] h-[1.8cm] bg-white border-2 border-gray-200 p-0.5 rounded-md shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`ANGGOTA|${item.nomorAnggota || "LAMA"}|${item.nama}|${item.alamat}`)}`} 
                    alt="QR Code Anggota" className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[6px] text-center mt-1 font-black uppercase leading-tight" style={{ color: '#6b7280' }}>Scan Untuk<br/>Akses Pustaka</p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}