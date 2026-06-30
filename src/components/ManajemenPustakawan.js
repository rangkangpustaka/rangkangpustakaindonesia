// src/components/ManajemenPustakawan.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function ManajemenPustakawan() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hakAkses, setHakAkses] = useState("Akses Dasar"); 
  const [loading, setLoading] = useState(false);

  const [pustakawan, setPustakawan] = useState([]);
  const [pustakawanTerpilih, setPustakawanTerpilih] = useState([]);

  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editHakAkses, setEditHakAkses] = useState("");

  useEffect(() => {
    const q = query(collection(db, "pustakawan"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setPustakawan(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSimpan = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "pustakawan"), {
        nama, email, password, hakAkses,
        createdAt: serverTimestamp()
      });
      setNama(""); setEmail(""); setPassword(""); setHakAkses("Akses Dasar");
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async (id, namaAdmin) => {
    if (window.confirm(`Cabut akses dan hapus data pustakawan "${namaAdmin}"?`)) {
      await deleteDoc(doc(db, "pustakawan", id));
      setPustakawanTerpilih(prev => prev.filter(pId => pId !== id));
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id); 
    setEditNama(item.nama); 
    setEditEmail(item.email); 
    setEditPassword(item.password);
    setEditHakAkses(item.hakAkses || "Akses Dasar");
  };

  const handleUpdate = async (id) => {
    await updateDoc(doc(db, "pustakawan", id), {
      nama: editNama, email: editEmail, password: editPassword, hakAkses: editHakAkses
    });
    setEditId(null);
  };

  const handleTogglePilih = (id) => {
    setPustakawanTerpilih(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  const handleCetakKartu = () => {
    if (pustakawanTerpilih.length === 0) return alert("Centang minimal 1 pustakawan untuk dicetak kartunya!");
    window.print();
  };

  return (
    <div className="w-full mt-4 flex flex-col gap-6 print:mt-0">
      
      {/* 1. BAGIAN FORM TAMBAH PUSTAKAWAN */}
      <div className="w-full max-w-4xl bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden mx-auto">
        <h2 className="text-xl font-black text-gray-800 mb-2 border-b pb-4 flex items-center gap-2">
          <span>🛡️</span> Tambah Pustakawan / Admin Baru
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Tentukan tingkat hak akses. <strong className="text-[#8e0004]">Akses Besar</strong> melihat semua menu, <strong className="text-blue-600">Akses Dasar</strong> hanya melihat Katalog & Sirkulasi.
        </p>

        <form onSubmit={handleSimpan} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Lengkap" className="p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm font-bold" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Sistem" className="p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm font-bold" />
            <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (Sandi)" className="p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm font-bold" />
            
            <select value={hakAkses} onChange={(e) => setHakAkses(e.target.value)} className="p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm font-black cursor-pointer">
              <option value="Akses Dasar">Akses Dasar (Relawan)</option>
              <option value="Akses Besar">Akses Besar (Super Admin)</option>
            </select>
          </div>
          
          <button type="submit" disabled={loading} className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-black transition-all shadow-md">
            {loading ? "Menyimpan..." : "➕ Simpan & Daftarkan Akses"}
          </button>
        </form>
      </div>

      {/* 2. BAGIAN DAFTAR PUSTAKAWAN */}
      <div className="w-full max-w-4xl bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Daftar Pustakawan Terdaftar</h2>
            <p className="text-xs text-gray-500">Total: {pustakawan.length} Admin Aktif</p>
          </div>
          <button onClick={handleCetakKartu} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm shadow-md">
            🪪 Cetak Kartu ({pustakawanTerpilih.length})
          </button>
        </div>

        {pustakawan.length === 0 ? (
          <p className="text-center py-6 text-gray-500 italic">Belum ada data admin tersimpan.</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {pustakawan.map((item) => (
              <div key={item.id} className={`p-4 border-2 rounded-2xl relative transition-all ${pustakawanTerpilih.includes(item.id) ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                
                <div className="absolute top-4 right-4 z-10">
                  <input type="checkbox" className="w-5 h-5 cursor-pointer accent-gray-800" checked={pustakawanTerpilih.includes(item.id)} onChange={() => handleTogglePilih(item.id)} />
                </div>

                {editId === item.id ? (
                  <div className="flex flex-col gap-2 text-xs pr-8">
                    <input className="p-2 border rounded-lg bg-gray-50 font-bold" placeholder="Nama" value={editNama} onChange={(e) => setEditNama(e.target.value)} />
                    <input className="p-2 border rounded-lg bg-gray-50" placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    <input className="p-2 border rounded-lg bg-gray-50" placeholder="Password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                    <select value={editHakAkses} onChange={(e) => setEditHakAkses(e.target.value)} className="p-2 border rounded-lg bg-gray-50 font-bold">
                      <option value="Akses Dasar">Akses Dasar</option>
                      <option value="Akses Besar">Akses Besar</option>
                    </select>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleUpdate(item.id)} className="px-3 py-1.5 bg-green-600 font-bold text-white rounded-lg flex-1">Simpan</button>
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-300 font-bold rounded-lg flex-1">Batal</button>
                    </div>
                  </div>
                ) : (
                  <div className="pr-8">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-widest uppercase ${item.hakAkses === 'Akses Besar' ? 'bg-[#8e0004] text-[#fec700]' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                      {item.hakAkses === 'Akses Besar' ? '👑 AKSES BESAR' : '👤 AKSES DASAR'}
                    </span>
                    
                    <h3 className="font-black text-gray-900 text-lg mt-1.5">{item.nama}</h3>
                    <p className="text-xs text-gray-600 font-bold mt-1">📧 {item.email}</p>
                    <p className="text-xs text-gray-400 font-medium font-mono mt-0.5">🔑 {item.password}</p>
                    
                    <div className="flex gap-1.5 mt-3">
                      <button onClick={() => handleEditClick(item)} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg hover:bg-amber-100">Edit</button>
                      <button onClick={() => handleHapus(item.id, item.nama)} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100">Hapus</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. TAMPILAN CETAK KARTU FISIK (Desain disamakan Hitam-Emas untuk semua) */}
      <div className="hidden print:flex flex-wrap gap-4 justify-start items-start">
        {pustakawan.filter(p => pustakawanTerpilih.includes(p.id)).map((item) => (
          <div key={`card-${item.id}`} className="relative w-[8.5cm] h-[5.4cm] border-[2px] border-black bg-white rounded-lg overflow-hidden flex flex-col font-sans break-inside-avoid shadow-sm print-exact-colors" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            
            {/* Header Kartu: Selalu Hitam-Emas */}
            <div className="h-[1.6cm] w-full flex items-center px-2 gap-2 border-b-4 border-[#fec700]" style={{ backgroundColor: '#111827' }}>
              {/* === PERBAIKAN LOGO: Dibuat overflow-hidden agar terpotong bulat sempurna === */}
              <div className="h-11 w-11 bg-white rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img src="/logo.jpg" alt="Logo" className="h-full w-full object-contain p-0.5 bg-white" />
              </div>
              <div className="flex-1 text-center pr-4">
                <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#fec700' }}>
                  KARTU AKSES PUSTAKAWAN
                </p>
                <p className="text-[12px] font-black uppercase leading-tight" style={{ color: '#ffffff' }}>Rangkang Pustaka</p>
              </div>
            </div>

            {/* Badan Kartu */}
            <div className="flex-1 flex p-2 bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="flex-1 flex flex-col justify-center gap-2">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>Nama Pengelola</p>
                  <p className="text-[13px] font-black leading-tight" style={{ color: '#111827' }}>{item.nama}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>ID Sistem / Email</p>
                  <p className="text-[10px] font-bold" style={{ color: '#8e0004' }}>{item.email}</p>
                </div>
              </div>
              
              <div className="w-[2.2cm] h-full flex flex-col items-center justify-center border-l-2 border-gray-300 pl-2">
                <div className="w-[1.8cm] h-[1.8cm] bg-white border-2 border-gray-800 p-0.5 rounded-md shadow-sm">
                  {/* Kode Rahasia: ADMIN|email|password */}
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`ADMIN|${item.email}|${item.password}`)}`} alt="QR Admin" className="w-full h-full object-contain" />
                </div>
                <p className="text-[6px] text-center mt-1 font-black uppercase" style={{ color: '#4b5563' }}>Scan Login</p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}