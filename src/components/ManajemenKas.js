// src/components/ManajemenKas.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function ManajemenKas() {
  const [kas, setKas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tipe, setTipe] = useState("Pemasukan");
  const [kategori, setKategori] = useState("");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "kas"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((d) => data.push({ id: d.id, ...d.data() }));
      setKas(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!nominal || isNaN(nominal)) return alert("Nominal harus berupa angka valid!");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "kas"), {
        tipe, kategori, nominal: Number(nominal), keterangan, createdAt: serverTimestamp()
      });
      setKategori(""); setNominal(""); setKeterangan("");
    } catch (err) { alert("Gagal menyimpan data: " + err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus catatan kas ini secara permanen?")) {
      await deleteDoc(doc(db, "kas", id));
    }
  };

  // FUNGSI EXPORT EXCEL SUPER RAPI (DILENGKAPI TOTAL)
  const handleExportExcel = async () => {
    if (kas.length === 0) return alert("Buku kas masih kosong.");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const FileSaver = (await import("file-saver")).default;
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Buku Kas Rangkang");

      // Bikin Judul Laporan di Atas
      worksheet.mergeCells('A1', 'F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = "LAPORAN KAS KEUANGAN - RANGKANG PUSTAKA";
      titleCell.font = { size: 14, bold: true, name: 'Calibri' };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Header Tabel
      worksheet.getRow(3).values = ["NO", "TANGGAL", "KATEGORI", "KETERANGAN", "PEMASUKAN (Rp)", "PENGELUARAN (Rp)"];
      const headerRow = worksheet.getRow(3);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.height = 25;
      
      headerRow.eachCell(cell => {
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8E0004' } }; // Warna Merah Marun
         cell.alignment = { vertical: 'middle', horizontal: 'center' };
         cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      worksheet.columns = [
        { key: "no", width: 6 }, { key: "tanggal", width: 20 },
        { key: "kategori", width: 25 }, { key: "keterangan", width: 40 },
        { key: "pemasukan", width: 20 }, { key: "pengeluaran", width: 20 },
      ];

      let totalMasuk = 0;
      let totalKeluar = 0;

      // Isi Data
      [...kas].reverse().forEach((item, index) => {
         const isMasuk = item.tipe === "Pemasukan";
         if (isMasuk) totalMasuk += Number(item.nominal);
         else totalKeluar += Number(item.nominal);

         const dateStr = item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString('id-ID') : "-";

         const row = worksheet.addRow({
            no: index + 1, tanggal: dateStr, kategori: item.kategori || "-",
            keterangan: item.keterangan || "-",
            pemasukan: isMasuk ? item.nominal : 0,
            pengeluaran: !isMasuk ? item.nominal : 0
         });
         
         row.eachCell((cell, colNumber) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colNumber === 1 || colNumber === 2) cell.alignment = { horizontal: 'center' };
         });
         row.getCell('pemasukan').numFmt = '#,##0';
         row.getCell('pengeluaran').numFmt = '#,##0';
      });

      // Baris Total Akhir (Footer)
      const totalRow = worksheet.addRow({
         keterangan: "TOTAL KESELURUHAN", pemasukan: totalMasuk, pengeluaran: totalKeluar
      });
      totalRow.font = { bold: true, size: 12 };
      totalRow.getCell('keterangan').alignment = { horizontal: 'right' };
      totalRow.getCell('pemasukan').numFmt = '#,##0';
      totalRow.getCell('pemasukan').font = { color: { argb: 'FF008000' }, bold: true };
      totalRow.getCell('pengeluaran').numFmt = '#,##0';
      totalRow.getCell('pengeluaran').font = { color: { argb: 'FFFF0000' }, bold: true };

      // Menulis ke file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      FileSaver.saveAs(blob, "Laporan_Keuangan_Rangkang_Pustaka.xlsx");

    } catch (error) { alert("Gagal mengekspor data: " + error.message); }
  };

  const saldoAkhir = kas.reduce((acc, curr) => curr.tipe === "Pemasukan" ? acc + Number(curr.nominal) : acc - Number(curr.nominal), 0);
  const totalPemasukan = kas.filter(k => k.tipe === "Pemasukan").reduce((a, b) => a + Number(b.nominal), 0);
  const totalPengeluaran = kas.filter(k => k.tipe === "Pengeluaran").reduce((a, b) => a + Number(b.nominal), 0);

  if (loading) return <div className="p-4 text-center font-bold text-gray-600 animate-pulse">Memuat Buku Kas...</div>;

  return (
    <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b-2 border-gray-100 pb-6">
        <div>
           <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2"><span>💰</span> Buku Kas & Keuangan</h2>
           <p className="text-sm text-gray-500 font-medium">Transparansi pengelolaan dana TBM.</p>
        </div>
        <button onClick={handleExportExcel} className="px-5 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-md text-sm transition-all w-full md:w-auto uppercase tracking-wider flex items-center justify-center gap-2">
          <span>📊</span> Unduh Laporan Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
          <p className="text-xs font-black text-blue-800 uppercase tracking-wider mb-1">Total Saldo Kas</p>
          <h3 className="text-2xl font-black text-blue-900">Rp {saldoAkhir.toLocaleString("id-ID")}</h3>
        </div>
        <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
          <p className="text-xs font-black text-green-800 uppercase tracking-wider mb-1">Total Pemasukan</p>
          <h3 className="text-2xl font-black text-green-900">Rp {totalPemasukan.toLocaleString("id-ID")}</h3>
        </div>
        <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200">
          <p className="text-xs font-black text-red-800 uppercase tracking-wider mb-1">Total Pengeluaran</p>
          <h3 className="text-2xl font-black text-red-900">Rp {totalPengeluaran.toLocaleString("id-ID")}</h3>
        </div>
      </div>

      <form onSubmit={handleSimpan} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 mb-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-600 mb-1 block uppercase">Tipe Transaksi</label>
            <select value={tipe} onChange={(e) => setTipe(e.target.value)} className={`w-full p-3 rounded-xl border-2 font-bold outline-none cursor-pointer ${tipe === 'Pemasukan' ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
              <option value="Pemasukan">Pemasukan (+)</option><option value="Pengeluaran">Pengeluaran (-)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-600 mb-1 block uppercase">Nominal (Rp) *</label>
            <input type="number" required value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="Contoh: 50000" className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-[#8e0004] outline-none text-sm font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-600 mb-1 block uppercase">Kategori (Opsional)</label>
            <input type="text" value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="Cetak Kartu, Donasi..." className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-[#8e0004] outline-none text-sm font-bold" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-600 mb-1 block uppercase">Keterangan Catatan</label>
          <input type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Detail sumber dana atau penggunaan..." className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-[#8e0004] outline-none text-sm font-bold" />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full md:w-auto self-end px-8 py-3 bg-gray-900 text-white font-black uppercase text-xs rounded-xl hover:bg-black shadow-md">{isSubmitting ? "Menyimpan..." : "Simpan Catatan Kas"}</button>
      </form>

      <div className="overflow-x-auto border border-gray-200 rounded-2xl">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-4">Tanggal & Waktu</th><th className="p-4">Kategori & Keterangan</th>
              <th className="p-4 text-right">Debit (Masuk)</th><th className="p-4 text-right">Kredit (Keluar)</th><th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {kas.length === 0 ? <tr><td colSpan="5" className="text-center py-6 text-gray-400 font-medium">Buku Kas masih bersih...</td></tr> : 
             kas.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 transition-all">
                <td className="p-4 whitespace-nowrap text-xs text-gray-500 font-bold">{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString('id-ID') : "-"}</td>
                <td className="p-4"><p className="font-bold text-gray-800 bg-gray-200 inline-block px-2 py-0.5 rounded text-[10px] mb-1">{item.kategori || "Umum"}</p><p className="text-xs text-gray-600 font-medium">{item.keterangan || "-"}</p></td>
                <td className="p-4 text-right font-black text-green-600">{item.tipe === "Pemasukan" ? `+ ${Number(item.nominal).toLocaleString('id-ID')}` : "-"}</td>
                <td className="p-4 text-right font-black text-red-600">{item.tipe === "Pengeluaran" ? `- ${Number(item.nominal).toLocaleString('id-ID')}` : "-"}</td>
                <td className="p-4 text-center"><button onClick={() => handleDelete(item.id)} className="text-red-500 font-black hover:bg-red-100 px-2 py-1 rounded">🗑️ Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}