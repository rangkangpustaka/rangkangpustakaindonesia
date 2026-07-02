// src/components/DaftarAnggota.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function DaftarAnggota({ hakAksesAdmin }) {
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState("");
  const [anggotaTerpilih, setAnggotaTerpilih] = useState([]);
  
  const [activeTab, setActiveTab] = useState("Umum"); 
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterGender, setFilterGender] = useState("Semua");
  const [modeCetak, setModeCetak] = useState(""); 

  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editKontak, setEditKontak] = useState("");
  const [editAlamat, setEditAlamat] = useState("");
  const [editFotoUrl, setEditFotoUrl] = useState("");
  const [editTipe, setEditTipe] = useState("Umum");
  const [editJK, setEditJK] = useState("Laki-laki");
  const [editUsia, setEditUsia] = useState("Anak-anak"); 
  const [editKelas, setEditKelas] = useState("ALFA (1-3 SD)"); 

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

  // FORMAT BARU: Mengubah link GDrive share menjadi Direct Image Link secara akurat
  const getDirectGDriveLink = (url) => {
    if (!url) return "https://ui-avatars.com/api/?name=User&background=random";
    const match = url.match(/(?:file\/d\/|id=|d\/)([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/u/0/d/${match[1]}`;
    }
    return url;
  };

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Hapus data "${nama}" secara permanen?`)) {
      await deleteDoc(doc(db, "anggota", id));
      setAnggotaTerpilih(prev => prev.filter(aId => aId !== id));
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id); setEditNama(item.nama); 
    setEditKontak(item.kontak || ""); setEditAlamat(item.alamat || "");
    setEditFotoUrl(item.fotoUrl || "");
    setEditTipe(item.tipeAnggota || "Umum"); setEditJK(item.jenisKelamin || "Laki-laki");
    setEditUsia(item.kategoriUsia || "Anak-anak");
    setEditKelas(item.kelasRangkang || "ALFA (1-3 SD)");
  };

  const handleUpdate = async (id) => {
    try {
      await updateDoc(doc(db, "anggota", id), { 
        nama: editNama, kontak: editKontak, alamat: editAlamat, 
        fotoUrl: editTipe === "Peserta Didik" ? editFotoUrl : "", 
        tipeAnggota: editTipe, jenisKelamin: editJK,
        kategoriUsia: editUsia, kelasRangkang: editTipe === "Peserta Didik" ? editKelas : "-"
      });
      setEditId(null);
    } catch (error) { alert("Gagal memperbarui: " + error.message); }
  };

  const handleTogglePilih = (id) => {
    setAnggotaTerpilih(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
  };

  const handlePilihSemua = () => {
    if (anggotaTerpilih.length === anggotaDifilter.length) setAnggotaTerpilih([]); 
    else setAnggotaTerpilih(anggotaDifilter.map(a => a.id)); 
  };

  const handleEksekusiCetak = async () => {
    if (anggotaTerpilih.length === 0) return alert("Centang minimal 1 anggota untuk dicetak kartunya!");
    
    if (window.confirm(`Catat infaq pembuatan ${anggotaTerpilih.length} kartu ini ke Kas Keuangan?`)) {
      try {
        await addDoc(collection(db, "kas"), {
          tipe: "Pemasukan", kategori: "Cetak Kartu Anggota", nominal: anggotaTerpilih.length * 5000,
          keterangan: `Pembuatan kartu anggota/didik (${anggotaTerpilih.length} orang)`, createdAt: serverTimestamp() 
        });
      } catch (e) { console.error("Gagal mencatat kas otomatis."); }
    }
    
    if (activeTab === "Umum") setModeCetak("umum");
    else setModeCetak("pelajar");

    // Jeda waktu ditambah menjadi 2 detik (2000ms) agar internet lambat sempat mendownload QR & Foto
    setTimeout(() => { 
      window.print(); 
      setModeCetak(""); 
    }, 2000);
  };

  let anggotaDifilter = anggota.filter(item => {
    if (activeTab === "Umum") {
      return item.tipeAnggota === "Umum" || !item.tipeAnggota;
    }
    if (activeTab === "Peserta Didik") {
      if (item.tipeAnggota !== "Peserta Didik") return false;
      if (filterKelas !== "Semua" && item.kelasRangkang !== filterKelas) return false;
      if (filterGender !== "Semua" && item.jenisKelamin !== filterGender) return false;
      return true;
    }
    return true;
  });

  anggotaDifilter = anggotaDifilter.filter((item) => {
    const keyword = kataKunci.toLowerCase();
    return (item.nama?.toLowerCase().includes(keyword) || item.nomorAnggota?.toLowerCase().includes(keyword) || item.kelasRangkang?.toLowerCase().includes(keyword));
  });

  if (loading) return <div className="p-4 text-center font-bold text-gray-600 animate-pulse">Memuat data...</div>;

  return (
    <div className="w-full mt-4 print:mt-0">
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border-[3px] border-gray-100 print:hidden">
        
        {/* NAVIGASI TAB UTAMA */}
        <div className="flex flex-wrap gap-2 mb-4 border-b-2 border-gray-100 pb-4">
          <button 
            onClick={() => {setActiveTab("Umum"); setAnggotaTerpilih([]);}} 
            className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all flex-1 sm:flex-none border-2 ${activeTab === "Umum" ? "bg-gray-800 text-white border-gray-800 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
          >
            👥 Anggota Umum
          </button>
          <button 
            onClick={() => {setActiveTab("Peserta Didik"); setAnggotaTerpilih([]); setFilterKelas("Semua"); setFilterGender("Semua");}} 
            className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all flex-1 sm:flex-none border-2 ${activeTab === "Peserta Didik" ? "bg-[#8e0004] text-white border-[#8e0004] shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-red-50"}`}
          >
            🎓 Peserta Didik Rangkang
          </button>
        </div>

        {/* SUB-FILTER KHUSUS TAB PESERTA DIDIK */}
        {activeTab === "Peserta Didik" && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-red-50/50 p-3 sm:p-4 rounded-xl border border-red-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-black text-red-900 uppercase tracking-widest whitespace-nowrap">📚 Filter Kelas:</span>
              <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} className="w-full sm:w-auto p-2 border-2 border-white rounded-lg bg-white focus:border-[#8e0004] outline-none text-xs font-bold text-gray-800 cursor-pointer shadow-sm">
                <option value="Semua">Semua Kelas</option>
                <option value="ALFA (1-3 SD)">Kelas ALFA (1-3 SD)</option>
                <option value="BETA (4-6 SD)">Kelas BETA (4-6 SD)</option>
                <option value="SIGMA (SMP)">Kelas SIGMA (SMP)</option>
              </select>
            </div>
            <div className="hidden sm:block w-px bg-red-200 mx-2"></div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-black text-red-900 uppercase tracking-widest whitespace-nowrap">🚻 Gender:</span>
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="w-full sm:w-auto p-2 border-2 border-white rounded-lg bg-white focus:border-[#8e0004] outline-none text-xs font-bold text-gray-800 cursor-pointer shadow-sm">
                <option value="Semua">Semua</option>
                <option value="Laki-laki">Putra</option>
                <option value="Perempuan">Putri</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {activeTab === "Umum" ? "Daftar Anggota Umum" : "Data Peserta Didik Rangkang"}
            </h2>
            <p className="text-xs text-gray-500 font-bold">Total Ditemukan: {anggotaDifilter.length} Orang</p>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row w-full md:w-auto">
            <input type="text" placeholder="Cari nama atau NIA..." value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} className="w-full sm:w-64 p-3 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-[#8e0004] transition-all" />
            <button onClick={handleEksekusiCetak} className={`px-6 py-3 text-white font-black rounded-xl text-xs shadow-md uppercase tracking-wider w-full sm:w-auto transition-all ${activeTab === "Umum" ? "bg-gray-800 hover:bg-black" : "bg-[#8e0004] hover:bg-red-900"}`}>
              {activeTab === "Umum" ? "🪪 Cetak Kartu Umum" : "🎓 Cetak ID Card Vertikal"}
            </button>
          </div>
        </div>

        {anggotaDifilter.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 border rounded-xl flex items-center">
            <input type="checkbox" id="pilihSemuaAnggota" className="w-5 h-5 cursor-pointer accent-[#8e0004] mr-2" checked={anggotaTerpilih.length === anggotaDifilter.length} onChange={handlePilihSemua} />
            <label htmlFor="pilihSemuaAnggota" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Pilih Semua Data di Bawah ({anggotaTerpilih.length})</label>
          </div>
        )}

        {anggotaDifilter.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-gray-500 font-bold text-sm">Data tidak ditemukan.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {anggotaDifilter.map((item) => (
              <div key={item.id} className={`p-4 border-2 rounded-2xl shadow-sm relative transition-all flex flex-col justify-between ${anggotaTerpilih.includes(item.id) ? 'bg-indigo-50/50 border-indigo-400' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                
                <div className="absolute top-4 right-4 z-10">
                  <input type="checkbox" className="w-5 h-5 cursor-pointer accent-indigo-600" checked={anggotaTerpilih.includes(item.id)} onChange={() => handleTogglePilih(item.id)} />
                </div>

                {editId === item.id ? (
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <select value={editTipe} onChange={(e)=>setEditTipe(e.target.value)} className="p-2 border rounded-lg bg-gray-50 font-bold">
                        <option value="Umum">Anggota Umum</option><option value="Peserta Didik">Peserta Didik</option>
                      </select>
                      <select value={editUsia} onChange={(e)=>setEditUsia(e.target.value)} className="p-2 border rounded-lg bg-gray-50 font-bold">
                        <option value="Anak-anak">Anak-anak</option><option value="Remaja">Remaja</option><option value="Dewasa">Dewasa</option>
                      </select>
                    </div>
                    {editTipe === "Peserta Didik" && (
                      <div className="grid grid-cols-2 gap-2">
                        <select value={editKelas} onChange={(e)=>setEditKelas(e.target.value)} className="p-2 border border-[#8e0004] text-[#8e0004] rounded-lg bg-red-50 font-black">
                          <option value="ALFA (1-3 SD)">ALFA</option>
                          <option value="BETA (4-6 SD)">BETA</option>
                          <option value="SIGMA (SMP)">SIGMA</option>
                        </select>
                        <select value={editJK} onChange={(e)=>setEditJK(e.target.value)} className="p-2 border rounded-lg bg-gray-50 font-bold">
                          <option value="Laki-laki">Putra</option><option value="Perempuan">Putri</option>
                        </select>
                      </div>
                    )}
                    <input className="p-2 border rounded-lg bg-gray-50 outline-none" placeholder="Nama Lengkap" value={editNama} onChange={(e) => setEditNama(e.target.value)} />
                    <input className="p-2 border rounded-lg bg-gray-50 outline-none" placeholder="Alamat/Instansi" value={editAlamat} onChange={(e) => setEditAlamat(e.target.value)} />
                    
                    {editTipe === "Peserta Didik" && (
                      <input className="p-2 border rounded-lg bg-amber-50 outline-none" placeholder="Link Foto GDrive" value={editFotoUrl} onChange={(e) => setEditFotoUrl(e.target.value)} />
                    )}
                    
                    <div className="flex gap-2 justify-end mt-2">
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 font-bold rounded-lg">Batal</button>
                      <button onClick={() => handleUpdate(item.id)} className="px-3 py-1.5 bg-green-600 font-bold text-white rounded-lg">Simpan</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-16 h-20 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 relative shadow-inner">
                       {item.tipeAnggota === "Umum" ? (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">👤</div>
                       ) : (
                          <img src={getDirectGDriveLink(item.fotoUrl)} className="w-full h-full object-cover bg-white" alt="Foto" />
                       )}
                    </div>
                    <div className="pr-6 flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-extrabold bg-[#8e0004] text-white px-2 py-0.5 rounded-md">{item.nomorAnggota}</span>
                        {item.tipeAnggota === "Peserta Didik" && (
                          <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            KELAS {item.kelasRangkang ? item.kelasRangkang.split(" ")[0] : ""}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.nama}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-bold text-gray-500 border px-1.5 py-0.5 rounded bg-gray-50">{item.kategoriUsia}</span>
                        {item.tipeAnggota === "Peserta Didik" && (
                          <span className="text-[9px] font-bold text-gray-500 border px-1.5 py-0.5 rounded bg-gray-50">{item.jenisKelamin === "Laki-laki" ? "Putra" : "Putri"}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium truncate mt-1.5">📍 {item.alamat}</p>
                    </div>
                  </div>
                )}
                
                {editId !== item.id && (
                  <div className="flex gap-1.5 mt-4 pt-3 border-t">
                    <button onClick={() => handleEditClick(item)} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black rounded-lg hover:bg-amber-100 transition-all">Edit Data</button>
                    {(hakAksesAdmin === "Full Akses" || hakAksesAdmin === "Akses Besar") && (
                      <button onClick={() => handleDelete(item.id, item.nama)} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-black rounded-lg hover:bg-red-100 transition-all">Hapus</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* AREA LAYOUT CETAK FISIK                                        */}
      {/* ============================================================== */}
      
      {/* CETAK 1: KARTU UMUM */}
      {modeCetak === 'umum' && (
        <div className="hidden print:flex flex-wrap gap-4 justify-start items-start">
          {anggotaDifilter.filter(a => anggotaTerpilih.includes(a.id)).map((item) => (
            <div key={`umum-${item.id}`} className="w-[8.5cm] h-[5.4cm] border-[2px] border-black bg-white rounded-lg overflow-hidden flex flex-col font-sans break-inside-avoid shadow-sm print-exact-colors" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <div className="h-[1.6cm] w-full flex items-center px-2 gap-2 border-b-4 border-[#fec700] flex-shrink-0" style={{ backgroundColor: '#8e0004' }}>
                <img src="/logo.jpg" alt="Logo" className="h-11 w-11 object-contain p-0.5 bg-white rounded-full flex-shrink-0" />
                <div className="flex-1 text-center pr-4">
                  <p className="text-[9px] font-bold tracking-widest uppercase mb-0.5 text-white opacity-95">KARTU ANGGOTA PERPUSTAKAAN</p>
                  <p className="text-[12px] font-black uppercase leading-tight tracking-wide text-white">Rangkang Pustaka</p>
                </div>
              </div>
              <div className="flex-1 flex p-2 bg-gradient-to-br from-white to-gray-50 items-center">
                <div className="flex-1 flex flex-col justify-center gap-1.5 h-full">
                  <div><p className="text-[7px] font-extrabold uppercase tracking-wider text-gray-500">Nama Anggota</p><p className="text-[12px] font-black leading-tight line-clamp-1 text-gray-900">{item.nama}</p></div>
                  <div><p className="text-[7px] font-extrabold uppercase tracking-wider text-gray-500">No. Induk (NIA)</p><p className="text-[11px] font-bold tracking-wide text-[#8e0004]">{item.nomorAnggota || "MEMBER LAMA"}</p></div>
                  <div><p className="text-[7px] font-extrabold uppercase tracking-wider text-gray-500">Kategori & Alamat</p><p className="text-[9px] font-bold line-clamp-2 leading-tight text-gray-700">[{item.kategoriUsia || "Anak-anak"}] - {item.alamat}</p></div>
                </div>
                <div className="w-[2.2cm] flex flex-col items-center justify-center border-l-2 border-dashed border-gray-300 pl-2 flex-shrink-0 h-full">
                  <div className="w-[1.8cm] h-[1.8cm] bg-white border-2 border-gray-200 p-0.5 rounded-md shadow-sm flex-shrink-0">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`ANGGOTA|${item.nomorAnggota || "LAMA"}|${item.nama}|${item.alamat}|${item.tipeAnggota || "Umum"}`)}`} alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-[6px] text-center mt-1 font-black uppercase leading-tight text-gray-500">Scan Absen<br/>& Pinjam</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CETAK 2: KARTU DIDIK VERTIKAL */}
      {modeCetak === 'pelajar' && (
        <div className="hidden print:flex flex-wrap gap-4 justify-start items-start">
          {anggotaDifilter.filter(a => anggotaTerpilih.includes(a.id)).map((item) => (
            <div key={`pelajar-${item.id}`} className="w-[5.4cm] h-[8.6cm] border-[2px] border-black bg-white rounded-lg overflow-hidden flex flex-col font-sans break-inside-avoid shadow-sm print-exact-colors relative" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              
              <div className="h-[2.4cm] w-full flex flex-col items-center justify-start pt-2 gap-1 flex-shrink-0" style={{ backgroundColor: '#8e0004' }}>
                 <p className="text-[8px] font-bold tracking-widest uppercase text-white">TBM RANGKANG PUSTAKA</p>
                 <p className="text-[13px] font-black tracking-widest uppercase text-[#fec700]">
                   {item.kelasRangkang ? `KELAS ${item.kelasRangkang.split(" ")[0]}` : "PESERTA DIDIK"}
                 </p>
              </div>

              <div className="flex-1 flex flex-col items-center px-2 relative w-full -mt-[1.2cm]">
                 <div className="w-[2.6cm] h-[3.4cm] bg-gray-200 border-[3px] border-white rounded-lg overflow-hidden shadow-md flex-shrink-0 z-10">
                    <img src={getDirectGDriveLink(item.fotoUrl)} alt="Foto Pelajar" className="w-full h-full object-cover bg-white" />
                 </div>

                 <div className="flex flex-col items-center text-center mt-1.5 w-full">
                    <h3 className="font-black text-[13px] leading-tight text-gray-900 uppercase line-clamp-2 w-full">{item.nama}</h3>
                    <p className="text-[10px] font-extrabold text-[#8e0004] mt-0.5">{item.nomorAnggota}</p>
                    <div className="w-10 h-[2px] bg-[#fec700] my-1.5"></div>
                    <p className="text-[7.5px] font-bold text-gray-700 leading-tight uppercase w-full">TTL: {item.tempatLahir}, {item.tanggalLahir}</p>
                    <p className="text-[7.5px] font-bold text-gray-700 line-clamp-2 leading-tight uppercase mt-0.5 w-full">Alamat: {item.alamat}</p>
                 </div>
              </div>

              <div className="h-[2.2cm] w-full flex justify-center items-end pb-2 flex-shrink-0 relative">
                 <div className="w-[1.8cm] h-[1.8cm] bg-white p-0.5 border-2 border-gray-200 rounded-md shadow-sm z-10">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`ANGGOTA|${item.nomorAnggota || "LAMA"}|${item.nama}|${item.alamat}|${item.tipeAnggota || "Peserta Didik"}`)}`} alt="QR Code" className="w-full h-full object-contain" />
                 </div>
                 <div className="absolute bottom-0 w-full h-2.5" style={{ backgroundColor: '#8e0004' }}></div>
              </div>
              
            </div>
          ))}
        </div>
      )}

    </div>
  );
}