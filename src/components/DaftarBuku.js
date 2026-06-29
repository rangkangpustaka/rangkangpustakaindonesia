// src/components/DaftarBuku.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
// IMPORT LIBRARY EXCEL DI SINI
import * as XLSX from "xlsx";

export default function DaftarBuku({ isAdmin }) {
  const [buku, setBuku] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState("");
  const [bukuTerpilih, setBukuTerpilih] = useState([]);
  const [isImporting, setIsImporting] = useState(false); // State untuk loading import

  const fileInputRef = useRef(null); // Referensi untuk input file tersembunyi

  const [editId, setEditId] = useState(null);
  const [editNoBuku, setEditNoBuku] = useState("");
  const [editKategori, setEditKategori] = useState("");
  const [editJudul, setEditJudul] = useState("");
  const [editPenulis, setEditPenulis] = useState("");
  const [editIsbn, setEditIsbn] = useState("");
  const [editPenerbit, setEditPenerbit] = useState("");
  const [editTempatTerbit, setEditTempatTerbit] = useState("");
  const [editTahun, setEditTahun] = useState("");
  const [editSumber, setEditSumber] = useState(""); 
  const [editStok, setEditStok] = useState("");
  const [editSampul, setEditSampul] = useState("");

  useEffect(() => {
    const q = query(collection(db, "buku"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dataBuku = [];
      querySnapshot.forEach((document) => {
        dataBuku.push({ id: document.id, ...document.data() });
      });
      setBuku(dataBuku);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data: ", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, judulBuku) => {
    if (window.confirm(`Yakin ingin menghapus buku "${judulBuku}"?`)) {
      try {
        await deleteDoc(doc(db, "buku", id));
        setBukuTerpilih(prev => prev.filter(bId => bId !== id));
      } catch (error) {
        alert("Gagal menghapus: " + error.message);
      }
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setEditNoBuku(item.noBuku || "-");
    setEditKategori(item.kategori || "-");
    setEditJudul(item.judul);
    setEditPenulis(item.penulis);
    setEditIsbn(item.isbn || "-");
    setEditPenerbit(item.penerbit || "-");
    setEditTempatTerbit(item.tempatTerbit || "-");
    setEditTahun(item.tahun || "");
    setEditSumber(item.sumber || "-");
    setEditStok(item.stok || 0);
    setEditSampul(item.sampul || "");
  };

  const handleUpdate = async (id) => {
    try {
      await updateDoc(doc(db, "buku", id), {
        noBuku: editNoBuku, kategori: editKategori, judul: editJudul,
        penulis: editPenulis, isbn: editIsbn, penerbit: editPenerbit,
        tempatTerbit: editTempatTerbit, tahun: editTahun, sumber: editSumber,
        stok: Number(editStok), sampul: editSampul,
      });
      setEditId(null);
    } catch (error) {
      alert("Gagal mengupdate: " + error.message);
    }
  };

  const bukuDifilter = buku.filter((item) => {
    const keyword = kataKunci.toLowerCase();
    return (
      item.judul?.toLowerCase().includes(keyword) || item.penulis?.toLowerCase().includes(keyword) || 
      item.noBuku?.toLowerCase().includes(keyword) || item.kategori?.toLowerCase().includes(keyword)
    );
  });

  const handleTogglePilih = (id) => {
    setBukuTerpilih(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const handlePilihSemua = () => {
    if (bukuTerpilih.length === bukuDifilter.length) {
      setBukuTerpilih([]); 
    } else {
      setBukuTerpilih(bukuDifilter.map(b => b.id)); 
    }
  };

  // ----------------------------------------------------------------------
  // FUNGSI BARU: IMPORT DARI EXCEL
  // ----------------------------------------------------------------------
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Ambil sheet pertama saja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Ubah isi sheet menjadi array JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let hitungBerhasil = 0;

        // Looping setiap baris di Excel
        for (const baris of jsonData) {
          // Syarat wajib: Harus ada Judul dan Penulis
          if (baris.Judul && baris.Penulis) {
            await addDoc(collection(db, "buku"), {
              noBuku: baris["No Buku"] ? String(baris["No Buku"]) : "-",
              kategori: baris["Kategori"] ? String(baris["Kategori"]) : "-",
              judul: String(baris["Judul"]),
              penulis: String(baris["Penulis"]),
              isbn: baris["ISBN"] ? String(baris["ISBN"]) : "-",
              penerbit: baris["Penerbit"] ? String(baris["Penerbit"]) : "-",
              tempatTerbit: baris["Tempat Terbit"] ? String(baris["Tempat Terbit"]) : "-",
              tahun: baris["Tahun"] ? String(baris["Tahun"]) : "-",
              sumber: baris["Sumber"] ? String(baris["Sumber"]) : "-",
              stok: baris["Stok"] ? Number(baris["Stok"]) : 1, // Default stok 1
              sampul: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60",
              createdAt: new Date(),
            });
            hitungBerhasil++;
          }
        }

        alert(`Luar Biasa! ${hitungBerhasil} buku berhasil diimpor ke database.`);
      } catch (error) {
        console.error(error);
        alert("Gagal mengimpor file! Pastikan format Excel Anda benar.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // ----------------------------------------------------------------------

  const handleExportExcel = () => {
    const dataEkspor = bukuTerpilih.length > 0 ? bukuDifilter.filter(b => bukuTerpilih.includes(b.id)) : bukuDifilter;
    if (dataEkspor.length === 0) return alert("Tidak ada data untuk diekspor.");

    const headers = ["No", "No Buku", "Kategori", "Judul", "Penulis", "Penerbit", "Tempat Terbit", "Tahun", "Sumber", "Stok"];
    const csvData = dataEkspor.map((item, index) => [
      index + 1, `"${item.noBuku || "-"}"`, `"${item.kategori || "-"}"`, `"${item.judul}"`,
      `"${item.penulis}"`, `"${item.penerbit || "-"}"`, `"${item.tempatTerbit || "-"}"`, `"${item.tahun || "-"}"`, 
      `"${item.sumber || "-"}"`, item.stok
    ]);
    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Data_Buku_Rangkang_Pustaka.csv";
    link.click();
  };

  const handleCetakLabel = () => {
    if (bukuTerpilih.length === 0) {
      alert("Silakan centang minimal satu buku yang ingin dicetak labelnya!");
      return;
    }
    window.print();
  };

  if (loading) return <div className="p-4 text-center animate-pulse">Memuat katalog...</div>;

  return (
    <div className="mt-10 max-w-4xl w-full px-4 print:mt-0 print:px-0">
      
      {/* INPUT FILE TERSEMBUNYI UNTUK IMPORT EXCEL */}
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        ref={fileInputRef} 
        onChange={handleImportExcel} 
        className="hidden" 
      />

      {/* --- TAMPILAN WEB --- */}
      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Katalog Koleksi</h2>
            <p className="text-sm text-gray-500 mt-1">Total: {buku.length} Judul Buku</p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 flex-wrap">
            <input type="text" placeholder="Cari judul, kategori, No. buku..." value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} className="w-full sm:w-56 p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" />
            
            {isAdmin && (
              <div className="flex gap-2 flex-wrap">
                {/* TOMBOL IMPORT EXCEL BARU */}
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  disabled={isImporting}
                  className={`px-3 py-2 text-white font-bold rounded-lg text-sm transition-all ${isImporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isImporting ? "⏳ Mengimpor..." : "📥 Import Excel"}
                </button>

                <button onClick={handleExportExcel} className="px-3 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-sm">📊 Export</button>
                <button onClick={handleCetakLabel} className="px-3 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-900 text-sm">🏷️ Cetak</button>
              </div>
            )}
          </div>
        </div>

        {isAdmin && bukuDifilter.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" id="pilihSemua" className="w-5 h-5 cursor-pointer accent-blue-600"
                checked={bukuDifilter.length > 0 && bukuTerpilih.length === bukuDifilter.length}
                onChange={handlePilihSemua}
              />
              <label htmlFor="pilihSemua" className="text-sm font-bold text-blue-800 cursor-pointer">
                Pilih Semua ({bukuTerpilih.length} Terpilih)
              </label>
            </div>
            {bukuTerpilih.length > 0 && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                Siap dicetak!
              </span>
            )}
          </div>
        )}
        
        {bukuDifilter.length === 0 ? (
          <p className="text-center py-10 italic">Belum ada buku dalam katalog.</p>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {bukuDifilter.map((item) => (
              <div key={item.id} className={`p-4 border rounded-xl shadow-sm relative transition-all ${bukuTerpilih.includes(item.id) ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}>
                
                {isAdmin && editId !== item.id && (
                  <div className="absolute top-4 right-4 z-10">
                    <input 
                      type="checkbox" className="w-5 h-5 cursor-pointer accent-blue-600"
                      checked={bukuTerpilih.includes(item.id)}
                      onChange={() => handleTogglePilih(item.id)}
                    />
                  </div>
                )}

                {editId === item.id ? (
                  <div className="flex flex-col gap-2 w-full text-xs text-black">
                    <div className="grid grid-cols-2 gap-2">
                      <input className="p-1.5 border bg-white rounded" placeholder="No. Buku" value={editNoBuku} onChange={(e) => setEditNoBuku(e.target.value)} />
                      <input className="p-1.5 border bg-white rounded" placeholder="Kategori" value={editKategori} onChange={(e) => setEditKategori(e.target.value)} />
                    </div>
                    <input className="p-1.5 border bg-white rounded" placeholder="Judul" value={editJudul} onChange={(e) => setEditJudul(e.target.value)} />
                    <input className="p-1.5 border bg-white rounded" placeholder="Sumber" value={editSumber} onChange={(e) => setEditSumber(e.target.value)} />
                    <div className="flex gap-2 justify-end mt-2">
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 font-bold rounded hover:bg-gray-300">Batal</button>
                      <button onClick={() => handleUpdate(item.id)} className="px-3 py-1.5 bg-green-600 font-bold text-white rounded hover:bg-green-700">Simpan</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full pr-8">
                    <div>
                      <div className="flex gap-1 mb-1">
                        <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-sm">{item.kategori}</span>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm">No: {item.noBuku}</span>
                      </div>
                      <h3 className="font-bold text-gray-900">{item.judul}</h3>
                      <p className="text-xs text-gray-500 mt-2">Sumber: <span className="font-semibold text-gray-700">{item.sumber || "-"}</span></p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1.5 mt-3">
                        <button onClick={() => handleEditClick(item)} className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-md">Edit</button>
                        <button onClick={() => handleDelete(item.id, item.judul)} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-md">Hapus</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- DESAIN CETAK LABEL FISIK --- */}
      <div className="hidden print:flex flex-wrap gap-4 justify-start items-start">
        {bukuDifilter.filter(b => bukuTerpilih.includes(b.id)).map((item) => (
          
          <div key={`label-${item.id}`} className="w-[9cm] h-[4.5cm] border-[3px] border-black flex flex-col bg-white text-black font-sans break-inside-avoid overflow-hidden">
            
            <div className="flex border-b-[3px] border-black h-[45%]">
              <div className="w-[35%] border-r-[3px] border-black flex items-center justify-center p-1 bg-white">
                <img src="/logo.jpg" alt="Logo Rangkang Pustaka" className="max-h-full max-w-full object-contain grayscale" />
              </div>
              <div className="w-[65%] flex flex-col items-center justify-center text-center px-1">
                <p className="text-[11px] font-medium leading-tight">Taman Baca Masyarakat</p>
                <p className="text-[12px] font-extrabold leading-tight mt-0.5">"Rumah Baca Rangkang Pustaka"</p>
              </div>
            </div>

            <div className="flex h-[55%] text-[11px]">
              <div className="w-[35%] border-r-[3px] border-black px-1.5 py-1 flex flex-col justify-between font-medium">
                <p>No. Buku</p>
                <p>Tahun</p>
                <p>Sumber</p>
                <p>Kategori</p>
              </div>
              <div className="w-[65%] px-1.5 py-1 flex flex-col justify-between font-bold">
                <p className="truncate">: {item.noBuku}</p>
                <p className="truncate">: {item.tahun}</p>
                <p className="truncate">: {item.sumber || "-"}</p>
                <p className="truncate">: {item.kategori}</p>
              </div>
            </div>
            
          </div>
        ))}
      </div>

    </div>
  );
}