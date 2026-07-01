// src/components/DaftarBuku.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import * as XLSX from "xlsx";

export default function DaftarBuku({ isAdmin, hakAksesAdmin }) {
  const [buku, setBuku] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState("");
  const [bukuTerpilih, setBukuTerpilih] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [editId, setEditId] = useState(null);
  const [editNoBuku, setEditNoBuku] = useState("");
  const [editKategori, setEditKategori] = useState("");
  const [editJudul, setEditJudul] = useState("");
  const [editPenulis, setEditPenulis] = useState("");
  const [editIsbn, setEditIsbn] = useState("");
  const [editPenerbit, setEditPenerbit] = useState("");
  const [editTempatTerbit, setEditTempatTerbit] = useState("");
  const [editTahun, setEditTahun] = useState("");
  const [editEdisi, setEditEdisi] = useState("");
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
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, judulBuku) => {
    if (window.confirm(`Yakin ingin menghapus buku "${judulBuku}"?`)) {
      await deleteDoc(doc(db, "buku", id));
      setBukuTerpilih(prev => prev.filter(bId => bId !== id));
    }
  };

  const handleHapusBanyak = async () => {
    if (window.confirm(`🚨 PERINGATAN!\nYakin ingin menghapus ${bukuTerpilih.length} buku terpilih sekaligus?`)) {
      try {
        for (const id of bukuTerpilih) { await deleteDoc(doc(db, "buku", id)); }
        setBukuTerpilih([]); 
      } catch (error) { alert("Gagal menghapus: " + error.message); }
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id); setEditNoBuku(item.noBuku || "-"); setEditKategori(item.kategori || "-");
    setEditJudul(item.judul); setEditPenulis(item.penulis); setEditIsbn(item.isbn || "-");
    setEditPenerbit(item.penerbit || "-"); setEditTempatTerbit(item.tempatTerbit || "-");
    setEditTahun(item.tahun || ""); setEditEdisi(item.edisi || "-"); setEditSumber(item.sumber || "-");
    setEditStok(item.stok || 1); setEditSampul(item.sampul || "");
  };

  const handleUpdate = async (id) => {
    await updateDoc(doc(db, "buku", id), {
      noBuku: editNoBuku, kategori: editKategori, judul: editJudul, penulis: editPenulis,
      isbn: editIsbn, penerbit: editPenerbit, tempatTerbit: editTempatTerbit, tahun: editTahun,
      edisi: editEdisi, sumber: editSumber, stok: Number(editStok), sampul: editSampul,
    });
    setEditId(null);
  };

  const handleTogglePilih = (id) => {
    setBukuTerpilih(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
  };

  const handlePilihSemua = () => {
    if (bukuTerpilih.length === bukuDifilter.length) setBukuTerpilih([]); 
    else setBukuTerpilih(bukuDifilter.map(b => b.id)); 
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        let hitungBerhasil = 0, hitungDilewati = 0;
        
        for (const baris of jsonData) {
          const judulExcel = baris["JUDUL"] || baris["Judul"] || baris["judul"];
          const penulisExcel = baris["PENULIS"] || baris["Penulis"] || baris["penulis"];
          const noRegExcel = String(baris["NO REGISTRASI"] || baris["No Registrasi"] || baris["No Buku"] || "-").trim();

          if (judulExcel && penulisExcel) {
            const apakahSudahAda = buku.find(b => 
              (noRegExcel !== "-" && b.noBuku === noRegExcel) || 
              (b.judul.toLowerCase() === String(judulExcel).toLowerCase() && b.penulis.toLowerCase() === String(penulisExcel).toLowerCase())
            );

            if (apakahSudahAda) { hitungDilewati++; continue; }

            await addDoc(collection(db, "buku"), {
              noBuku: noRegExcel, judul: String(judulExcel), penulis: String(penulisExcel),
              penerbit: String(baris["PENERBIT"] || baris["Penerbit"] || "-"),
              tempatTerbit: String(baris["KOTA TERBIT"] || baris["Tempat Terbit"] || "-"),
              tahun: String(baris["TAHUN TERBIT"] || baris["Tahun Terbit"] || baris["Tahun"] || "-"),
              edisi: String(baris["EDISI"] || baris["Edisi"] || "-"),
              isbn: String(baris["ISBN"] || baris["Isbn"] || "-"),
              kategori: String(baris["KLASIFIKASI"] || baris["Klasifikasi"] || baris["Kategori"] || "-"),
              stok: Number(baris["JUMLAH"] || baris["Jumlah"] || baris["Stok"] || 1),
              sampul: String(baris["Sampul URL"] || baris["SAMPUL URL"] || ""),
              sumber: String(baris["Sumber"] || baris["Asal"] || baris["SUMBER"] || "-"),
              createdAt: new Date(),
            });
            hitungBerhasil++;
          }
        }
        alert(`Laporan Impor Excel:\n✅ ${hitungBerhasil} Buku BARU dimasukkan.\n⚠️ ${hitungDilewati} Buku dilewati (duplikat).`);
      } catch (error) { alert("Gagal membaca file Excel!"); } 
      finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = async () => {
    const dataEkspor = bukuTerpilih.length > 0 ? bukuDifilter.filter(b => bukuTerpilih.includes(b.id)) : bukuDifilter;
    if (dataEkspor.length === 0) return alert("Katalog kosong, tidak ada data.");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const FileSaver = (await import("file-saver")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Katalog Rangkang Pustaka");
      worksheet.columns = [
        { header: "NO", key: "no", width: 6 }, { header: "NO REGISTRASI", key: "noBuku", width: 18 },
        { header: "JUDUL", key: "judul", width: 40 }, { header: "PENULIS", key: "penulis", width: 25 },
        { header: "PENERBIT", key: "penerbit", width: 30 }, { header: "KOTA TERBIT", key: "tempatTerbit", width: 20 },
        { header: "TAHUN TERBIT", key: "tahun", width: 15 }, { header: "EDISI", key: "edisi", width: 10 },
        { header: "ISBN", key: "isbn", width: 20 }, { header: "KLASIFIKASI", key: "kategori", width: 20 },
        { header: "SUMBER", key: "sumber", width: 20 }, { header: "JUMLAH", key: "stok", width: 10 },
        { header: "Sampul URL", key: "sampul", width: 45 }
      ];

      dataEkspor.forEach((item, index) => {
        worksheet.addRow({
          no: index + 1, noBuku: item.noBuku || "-", judul: item.judul || "-", penulis: item.penulis || "-",
          penerbit: item.penerbit || "-", tempatTerbit: item.tempatTerbit || "-", tahun: item.tahun || "-",
          edisi: item.edisi || "-", isbn: item.isbn || "-", kategori: item.kategori || "-",
          sumber: item.sumber || "-", stok: item.stok || 1, sampul: item.sampul || ""
        });
      });

      const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
        cell.font = { name: 'Calibri', size: 11, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderStyle;
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; 
        row.height = 22;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 11 }; cell.border = borderStyle;
          cell.alignment = { vertical: 'middle', horizontal: (colNumber === 1 || colNumber === 12) ? 'center' : 'left', wrapText: true }; 
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      FileSaver.saveAs(blob, "Database_Rangkang_Pustaka.xlsx");
    } catch (error) { alert("Gagal mengekspor data: " + error.message); }
  };

  const handleCetakLabel = () => {
    if (bukuTerpilih.length === 0) return alert("Silakan centang buku yang mau dicetak!");
    window.print();
  };

  const bukuDifilter = buku.filter((item) => {
    const keyword = kataKunci.toLowerCase();
    return (
      item.judul?.toLowerCase().includes(keyword) || item.penulis?.toLowerCase().includes(keyword) || 
      item.noBuku?.toLowerCase().includes(keyword) || item.kategori?.toLowerCase().includes(keyword)
    );
  });

  if (loading) return <div className="p-4 text-center font-bold">Memuat...</div>;

  return (
    <div className="mt-4 max-w-4xl w-full px-4 print:mt-0 print:px-0">
      <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />

      <div className="print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
          <div><h2 className="text-2xl font-black text-gray-800 tracking-tight">Katalog Koleksi</h2><p className="text-sm text-gray-500">Total: {buku.length} Judul</p></div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 flex-wrap">
            <input type="text" placeholder="Cari judul..." value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} className="w-full sm:w-56 p-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-[#8e0004]" />
            {isAdmin && (
              <div className="flex gap-2 flex-wrap">
                {/* GEMBOK: HAPUS BANYAK */}
                {hakAksesAdmin === "Akses Besar" && bukuTerpilih.length > 0 && (
                  <button onClick={handleHapusBanyak} className="px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 text-sm shadow-sm">🗑️ Hapus ({bukuTerpilih.length})</button>
                )}
                {/* GEMBOK: IMPORT EXCEL */}
                {hakAksesAdmin === "Akses Besar" && (
                  <button onClick={() => fileInputRef.current.click()} disabled={isImporting} className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-sm">📥 Import</button>
                )}
                {/* GEMBOK: EXPORT EXCEL */}
                {hakAksesAdmin === "Akses Besar" && (
                  <button onClick={handleExportExcel} className="px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 text-sm">📊 Export</button>
                )}
                <button onClick={handleCetakLabel} className="px-4 py-2.5 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 text-sm">🏷️ Cetak</button>
              </div>
            )}
          </div>
        </div>

        {isAdmin && bukuDifilter.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center">
            <input type="checkbox" id="pilihSemua" className="w-5 h-5 cursor-pointer accent-blue-600 mr-2" checked={bukuDifilter.length > 0 && bukuTerpilih.length === bukuDifilter.length} onChange={handlePilihSemua} />
            <label htmlFor="pilihSemua" className="text-sm font-bold text-blue-800 cursor-pointer">Pilih Semua ({bukuTerpilih.length})</label>
          </div>
        )}
        
        {bukuDifilter.length === 0 ? <p className="text-center py-10 italic text-gray-500">Katalog masih kosong.</p> : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {bukuDifilter.map((item) => (
              <div key={item.id} className={`p-4 border-2 rounded-2xl shadow-sm relative transition-all ${bukuTerpilih.includes(item.id) ? 'bg-blue-50/60 border-blue-400' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                {isAdmin && editId !== item.id && (
                  <div className="absolute top-4 right-4 z-10">
                    <input type="checkbox" className="w-5 h-5 cursor-pointer accent-blue-600" checked={bukuTerpilih.includes(item.id)} onChange={() => handleTogglePilih(item.id)} />
                  </div>
                )}
                
                {editId === item.id ? (
                  <div className="flex flex-col gap-2 w-full text-xs text-black">
                    <div className="grid grid-cols-2 gap-2">
                      <input className="p-2 border rounded-lg bg-gray-50" placeholder="No. Registrasi" value={editNoBuku} onChange={(e) => setEditNoBuku(e.target.value)} />
                      <input className="p-2 border rounded-lg bg-gray-50" placeholder="Klasifikasi/Kategori" value={editKategori} onChange={(e) => setEditKategori(e.target.value)} />
                    </div>
                    <input className="p-2 border rounded-lg bg-gray-50 font-bold" placeholder="Judul Buku" value={editJudul} onChange={(e) => setEditJudul(e.target.value)} />
                    <input className="p-2 border rounded-lg bg-gray-50" placeholder="Nama Penulis" value={editPenulis} onChange={(e) => setEditPenulis(e.target.value)} />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input className="p-2 border rounded-lg bg-gray-50" placeholder="Penerbit" value={editPenerbit} onChange={(e) => setEditPenerbit(e.target.value)} />
                      <input className="p-2 border rounded-lg bg-gray-50" placeholder="Kota Terbit" value={editTempatTerbit} onChange={(e) => setEditTempatTerbit(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <input className="p-2 border rounded-lg bg-gray-50" placeholder="Tahun" value={editTahun} onChange={(e) => setEditTahun(e.target.value)} />
                      <input className="p-2 border rounded-lg bg-gray-50" placeholder="Edisi" value={editEdisi} onChange={(e) => setEditEdisi(e.target.value)} />
                      <input className="p-2 border rounded-lg bg-green-50 border-green-200" placeholder="Asal / Sumber" value={editSumber} onChange={(e) => setEditSumber(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input className="p-2 border rounded-lg bg-gray-50" placeholder="Jumlah (Stok)" type="number" value={editStok} onChange={(e) => setEditStok(e.target.value)} />
                      <input className="p-2 border rounded-lg bg-gray-50" placeholder="ISBN" value={editIsbn} onChange={(e) => setEditIsbn(e.target.value)} />
                    </div>
                    
                    <input className="p-2 border rounded-lg bg-gray-50" placeholder="URL Sampul" value={editSampul} onChange={(e) => setEditSampul(e.target.value)} />
                    
                    <div className="flex gap-2 justify-end mt-2">
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 font-bold rounded-lg hover:bg-gray-300">Batal</button>
                      <button onClick={() => handleUpdate(item.id)} className="px-3 py-1.5 bg-green-600 font-bold text-white rounded-lg">Simpan</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 items-start h-full pr-4">
                    <div className="w-20 h-28 bg-gray-100 border border-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-inner relative">
                      <img src={item.sampul || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60"} alt={item.judul} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-h-[112px]">
                      <div>
                        <div className="flex gap-1.5 mb-1 flex-wrap">
                          <span className="text-[10px] font-extrabold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border">{item.kategori}</span>
                          <span className="text-[10px] font-extrabold bg-red-50 text-[#8e0004] px-2 py-0.5 rounded-md border border-red-100">No: {item.noBuku}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight">{item.judul}</h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">Penulis: <span className="text-gray-800 font-semibold">{item.penulis}</span></p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1.5 mt-3">
                          <button onClick={() => handleEditClick(item)} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg">Edit</button>
                          {/* GEMBOK HAPUS SATUAN */}
                          {hakAksesAdmin === "Akses Besar" && (
                            <button onClick={() => handleDelete(item.id, item.judul)} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition-all">Hapus</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden print:flex flex-wrap gap-4 justify-start items-start">
        {bukuDifilter.filter(b => bukuTerpilih.includes(b.id)).map((item) => (
          <div key={`label-${item.id}`} className="w-[9cm] h-[4.5cm] border-[3px] border-black flex flex-col bg-white font-sans break-inside-avoid overflow-hidden" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', color: 'black' }}>
            <div className="flex border-b-[3px] border-black h-[45%]">
              <div className="w-[25%] border-r-[3px] border-black flex items-center justify-center p-1 bg-white">
                <img src="/logo.jpg" alt="Logo Rangkang" className="max-h-full max-w-full object-contain grayscale" style={{ filter: 'grayscale(100%) contrast(1.2)' }} />
              </div>
              <div className="w-[50%] border-r-[3px] border-black flex flex-col items-center justify-center text-center px-1">
                <p className="text-[9px] font-bold leading-tight uppercase tracking-wider text-black">Taman Baca Masyarakat</p>
                <p className="text-[12px] font-black leading-tight mt-0.5 uppercase tracking-wide text-black">Rangkang Pustaka</p>
              </div>
              <div className="w-[25%] flex items-center justify-center p-0.5 bg-white flex-shrink-0">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=1&data=${encodeURIComponent(`BUKU|${item.id}`)}`} alt="QR Buku" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex h-[55%] text-[11px]">
              <div className="w-[35%] border-r-[3px] border-black px-1.5 py-1 flex flex-col justify-between font-bold text-black">
                <p>No. Registrasi</p><p>Tahun Terbit</p><p>Asal / Sumber</p><p>Kategori</p>
              </div>
              <div className="w-[65%] px-1.5 py-1 flex flex-col justify-between font-black text-black">
                <p className="truncate">: {item.noBuku}</p><p className="truncate">: {item.tahun || "-"}</p>
                <p className="truncate">: {item.sumber || "-"}</p><p className="truncate">: {item.kategori}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}