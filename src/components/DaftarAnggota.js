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
  
  // STATE KAMAR TAB (Umum, Putra, Putri)
  const [activeTab, setActiveTab] = useState("Umum"); 
  const [modeCetak, setModeCetak] = useState(""); 

  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editKontak, setEditKontak] = useState("");
  const [editAlamat, setEditAlamat] = useState("");
  const [editFotoUrl, setEditFotoUrl] = useState("");
  const [editTipe, setEditTipe] = useState("Umum");
  const [editJK, setEditJK] = useState("Laki-laki");
  const [editUsia, setEditUsia] = useState("Anak-anak"); // State usia saat di-edit

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

  const getDirectGDriveLink = (url) => {
    if (!url) return "https://ui-avatars.com/api/?name=User&background=random";
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
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
  };

  const handleUpdate = async (id) => {
    try {
      await updateDoc(doc(db, "anggota", id), { 
        nama: editNama, kontak: editKontak, alamat: editAlamat, 
        fotoUrl: editFotoUrl, tipeAnggota: editTipe, jenisKelamin: editJK,
        kategoriUsia: editUsia 
      });
      setEditId(null);
    } catch (error) { alert("Gagal memperbarui: " + error.message); }
  };

  const handleTogglePilih = (id) => {
    setAnggotaTerpilih(prev => prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]);
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
      } catch (e) { alert("Gagal mencatat kas otomatis."); }
    }
    
    if (activeTab === "Umum") setModeCetak("umum");
    else setModeCetak("pelajar");

    setTimeout(() => { window.print(); setModeCetak(""); }, 500);
  };

  // LOGIKA PEMISAHAN KAMAR DATA (FILTER UTAMA)
  let anggotaDifilter = anggota.filter(item => {
    if (activeTab === "Umum") return item.tipeAnggota === "Umum" || !item.tipeAnggota;
    if (activeTab === "Putra") return item.tipeAnggota === "Peserta Didik" && item.jenisKelamin === "Laki-laki";
    if (activeTab === "Putri") return item.tipeAnggota === "Peserta Didik" && item.jenisKelamin === "Perempuan";
    return true;
  });

  // LOGIKA PENCARIAN
  anggotaDifilter = anggotaDifilter.filter((item) => {
    const keyword = kataKunci.toLowerCase();
    return (item.nama?.toLowerCase().includes(keyword) || item.nomorAnggota?.toLowerCase().includes(keyword));
  });

  if (loading) return <div className="p-4 text-center font-bold text-gray-600 animate-pulse">Memuat data...</div>;

  return (
    <div className="w-full mt-4 print:mt-0">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
        
        {/* NAVIGASI KAMAR (TABS) */}
        <div className="flex flex-wrap gap-2 mb-6 border-b-2 border-gray-100 pb-4">
          <button onClick={() => {setActiveTab("Umum"); setAnggotaTerpilih([]);}} className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all flex-1 sm:flex-none border-2 ${activeTab === "Umum" ? "bg-gray-800 text-white border-gray-800 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
            👥 Anggota Umum
          </button>
          <button onClick={() => {setActiveTab("Putra"); setAnggotaTerpilih([]);}} className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all flex-1 sm:flex-none border-2 ${activeTab === "Putra" ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-blue-700 border-gray-200 hover:bg-blue-50"}`}>
            👦 Didik (Putra)
          </button>
          <button onClick={() => {setActiveTab("Putri"); setAnggotaTerpilih([]);}} className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all flex-1 sm:flex-none border-2 ${activeTab === "Putri" ? "bg-pink-600 text-white border-pink-600 shadow-md" : "bg-white text-pink-700 border-gray-200 hover:bg-pink-50"}`}>
            👧 Didik (Putri)
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Data {activeTab === "Umum" ? "Umum" : `Peserta Didik (${activeTab})`}</h2>
            <p className="text-xs text-gray-500">Total: {anggotaDifilter.length} Orang</p>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <input type="text" placeholder="Cari nama atau NIA..." value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} className="w-full sm:w-56 p-2.5 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-[#8e0004]" />
            <button onClick={handleEksekusiCetak} className={`px-5 py-2.5 text-white font-bold rounded-xl text-xs shadow-sm uppercase tracking-wider w-full sm:w-auto ${activeTab === "Umum" ? "bg-gray-800 hover:bg-black" : "bg-[#8e0004] hover:bg-red-900"}`}>
              {activeTab === "Umum" ? "🪪 Cetak Kartu Anggota" : "🎓 Cetak ID Card Vertikal"}
            </button>
          </div>
        </div>

        {anggotaDifilter.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 border rounded-xl flex items-center">
            <input type="checkbox" id="pilihSemuaAnggota" className="w-5 h-5 cursor-pointer accent-[#8e0004] mr-2" checked={anggotaTerpilih.length === anggotaDifilter.length} onChange={handlePilihSemua} />
            <label htmlFor="pilihSemuaAnggota" className="text-sm font-bold text-gray-700 cursor-pointer">Pilih Semua di Tab Ini ({anggotaTerpilih.length})</label>
          </div>
        )}

        {anggotaDifilter.length === 0 ? (
          <p className="text-center py-8 text-gray-500 italic">Data {activeTab} masih kosong.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {anggotaDifilter.map((item) => (
              <div key={item.id} className={`p-4 border-2 rounded-2xl shadow-sm relative transition-all flex flex-col justify-between ${anggotaTerpilih.includes(item.id) ? 'bg-indigo-50/50 border-indigo-400' : 'bg-white border-gray-100'}`}>
                
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
                      <select value={editJK} onChange={(e)=>setEditJK(e.target.value)} className="p-2 border rounded-lg bg-gray-50 font-bold">
                        <option value="Laki-laki">Putra</option><option value="Perempuan">Putri</option>
                      </select>
                    )}
                    <input className="p-2 border rounded-lg bg-gray-50 outline-none" placeholder="Nama Lengkap" value={editNama} onChange={(e) => setEditNama(e.target.value)} />
                    <input className="p-2 border rounded-lg bg-gray-50 outline-none" placeholder="Alamat/Instansi" value={editAlamat} onChange={(e) => setEditAlamat(e.target.value)} />
                    <input className="p-2 border rounded-lg bg-gray-50 outline-none" placeholder="Link Foto GDrive" value={editFotoUrl} onChange={(e) => setEditFotoUrl(e.target.value)} />
                    <div className="flex gap-2 justify-end mt-2">
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 font-bold rounded-lg">Batal</button>
                      <button onClick={() => handleUpdate(item.id)} className="px-3 py-1.5 bg-green-600 font-bold text-white rounded-lg">Simpan</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-14 h-16 bg-gray-200 rounded border border-gray-300 overflow-hidden flex-shrink-0">
                       <img src={getDirectGDriveLink(item.fotoUrl)} className="w-full h-full object-cover" alt="Foto" />
                    </div>
                    <div className="pr-6 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold bg-[#8e0004] text-white px-2 py-0.5 rounded-md">{item.nomorAnggota}</span>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border">{item.kategoriUsia || "Anak-anak"}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm mt-1 line-clamp-1">{item.nama}</h3>
                      {item.tipeAnggota === "Peserta Didik" && <p className="text-[9px] text-gray-500 font-bold mt-0.5">TTL: {item.tempatLahir}, {item.tanggalLahir}</p>}
                      <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">📍 {item.alamat}</p>
                    </div>
                  </div>
                )}
                
                {editId !== item.id && (
                  <div className="flex gap-1.5 mt-3 pt-3 border-t">
                    <button onClick={() => handleEditClick(item)} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg hover:bg-amber-100 transition-all">Edit Profil</button>
                    {hakAksesAdmin === "Akses Besar" && (
                      <button onClick={() => handleDelete(item.id, item.nama)} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold rounded-lg hover:bg-red-100">Hapus</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* AREA CETAK MENCETAK BERDASARKAN MODE                           */}
      {/* ============================================================== */}
      
      {/* CETAK 1: KARTU UMUM (HORIZONTAL) */}
      {modeCetak === 'umum' && (
        <div className="hidden print:flex flex-wrap gap-4 justify-start items-start">
          {anggotaDifilter.filter(a => anggotaTerpilih.includes(a.id)).map((item) => (
            <div key={`umum-${item.id}`} className="relative w-[8.5cm] h-[5.4cm] border-[2px] border-black bg-white rounded-lg overflow-hidden flex flex-col font-sans break-inside-avoid shadow-sm print-exact-colors" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
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
                  <div><p className="text-[7px] font-extrabold uppercase tracking-wider text-gray-500">Nama Anggota</p><p className="text-[12px] font-black leading-tight line-clamp-1 text-gray-900">{item.nama}</p></div>
                  <div><p className="text-[7px] font-extrabold uppercase tracking-wider text-gray-500">No. Induk Anggota (NIA)</p><p className="text-[11px] font-bold tracking-wide text-[#8e0004]">{item.nomorAnggota || "MEMBER LAMA"}</p></div>
                  <div><p className="text-[7px] font-extrabold uppercase tracking-wider text-gray-500">Kategori Usia & Alamat</p><p className="text-[9px] font-bold line-clamp-2 leading-tight text-gray-700">[{item.kategoriUsia || "Anak-anak"}] - {item.alamat}</p></div>
                </div>
                <div className="w-[2.2cm] h-full flex flex-col items-center justify-center border-l-2 border-dashed border-gray-300 pl-2 flex-shrink-0">
                  <div className="w-[1.8cm] h-[1.8cm] bg-white border-2 border-gray-200 p-0.5 rounded-md shadow-sm">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`ANGGOTA|${item.nomorAnggota || "LAMA"}|${item.nama}|${item.alamat}`)}`} alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-[6px] text-center mt-1 font-black uppercase leading-tight text-gray-500">Scan Untuk<br/>Akses Pustaka</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CETAK 2: KARTU DIDIK (VERTIKAL KTP) DENGAN FOTO & QR CODE */}
      {modeCetak === 'pelajar' && (
        <div className="hidden print:flex flex-wrap gap-4 justify-start items-start">
          {anggotaDifilter.filter(a => anggotaTerpilih.includes(a.id)).map((item) => (
            <div key={`pelajar-${item.id}`} className="relative w-[5.4cm] h-[8.6cm] border-[2px] border-black bg-white rounded-lg overflow-hidden flex flex-col font-sans break-inside-avoid shadow-sm print-exact-colors" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              
              {/* Banner Atas */}
              <div className="h-[2.2cm] w-full flex flex-col items-center justify-start pt-1.5 gap-1" style={{ backgroundColor: '#8e0004' }}>
                 <p className="text-[7px] font-bold tracking-widest uppercase" style={{ color: '#ffffff' }}>TBM RANGKANG PUSTAKA</p>
                 <p className="text-[11px] font-black tracking-widest uppercase text-[#fec700]">PESERTA DIDIK</p>
              </div>

              {/* Foto Profile di Tengah */}
              <div className="absolute top-[1.3cm] left-1/2 transform -translate-x-1/2 w-[2.4cm] h-[3.2cm] bg-gray-200 border-[3px] border-white rounded-md overflow-hidden shadow-md">
                 <img src={getDirectGDriveLink(item.fotoUrl)} alt="Foto Pelajar" className="w-full h-full object-cover bg-white" />
              </div>

              {/* Data Detail (Nama, NIA, TTL, Alamat) */}
              <div className="mt-[2.4cm] flex flex-col items-center text-center px-1">
                 <h3 className="font-black text-[12px] leading-tight text-gray-900 uppercase line-clamp-1">{item.nama}</h3>
                 <p className="text-[9px] font-extrabold text-[#8e0004] mt-0.5">{item.nomorAnggota}</p>
                 <div className="w-8 h-[2px] bg-[#fec700] my-1"></div>
                 <p className="text-[6.5px] font-bold text-gray-600 leading-tight uppercase">TTL: {item.tempatLahir}, {item.tanggalLahir}</p>
                 <p className="text-[6.5px] font-bold text-gray-600 line-clamp-2 leading-tight uppercase mt-0.5">Alamat: {item.alamat}</p>
              </div>

              {/* QR Code di Bawah */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                 <div className="w-[1.6cm] h-[1.6cm] bg-white p-0.5 border-2 border-gray-100 rounded-md shadow-sm">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`ANGGOTA|${item.nomorAnggota || "LAMA"}|${item.nama}|${item.alamat}`)}`} alt="QR Code" className="w-full h-full object-contain" />
                 </div>
              </div>
              
              <div className="absolute bottom-0 w-full h-1 bg-[#8e0004]"></div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}