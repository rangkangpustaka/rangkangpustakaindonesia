// src/components/ManajemenKas.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, serverTimestamp } from "firebase/firestore";

export default function ManajemenKas() {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prosesSimpan, setProsesSimpan] = useState(false);

  // State Form (Tipe Dibuat Permanen Jadi Pengeluaran Saja)
  const [tipe] = useState("Pengeluaran"); 
  const [kategori, setKategori] = useState("Beli Alat/Buku");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");

  useEffect(() => {
    const q = query(collection(db, "kas"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dataKas = [];
      snapshot.forEach((doc) => {
        dataKas.push({ id: doc.id, ...doc.data() });
      });
      setTransaksi(dataKas);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totalPemasukan = transaksi.filter(t => t.tipe === "Pemasukan").reduce((acc, curr) => acc + curr.nominal, 0);
  const totalPengeluaran = transaksi.filter(t => t.tipe === "Pengeluaran").reduce((acc, curr) => acc + curr.nominal, 0);
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nominal || isNaN(nominal) || Number(nominal) <= 0) return alert("Nominal harus berupa angka dan lebih dari 0!");
    
    setProsesSimpan(true);
    try {
      await addDoc(collection(db, "kas"), {
        tipe, kategori, nominal: Number(nominal), keterangan: keterangan || "-", createdAt: serverTimestamp()
      });
      setNominal(""); setKeterangan("");
    } catch (error) {
      alert("Gagal menyimpan transaksi: " + error.message);
    } finally {
      setProsesSimpan(false);
    }
  };

  const handleHapus = async (id) => {
    if (window.confirm("Yakin ingin menghapus catatan transaksi ini? Saldo akan dihitung ulang secara otomatis.")) {
      await deleteDoc(doc(db, "kas", id));
    }
  };

  const handleExportExcel = async () => {
    if (transaksi.length === 0) return alert("Belum ada data transaksi!");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const FileSaver = (await import("file-saver")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Kas Pustaka");

      worksheet.columns = [
        { header: "NO", key: "no", width: 6 }, { header: "TANGGAL", key: "tanggal", width: 20 },
        { header: "TIPE", key: "tipe", width: 15 }, { header: "KATEGORI", key: "kategori", width: 25 },
        { header: "KETERANGAN", key: "keterangan", width: 40 }, { header: "NOMINAL (Rp)", key: "nominal", width: 20 }
      ];

      const dataUrut = [...transaksi].reverse(); 
      dataUrut.forEach((item, index) => {
        const tgl = item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("id-ID") : "-";
        worksheet.addRow({ no: index + 1, tanggal: tgl, tipe: item.tipe, kategori: item.kategori, keterangan: item.keterangan, nominal: item.nominal });
      });

      worksheet.addRow({}); worksheet.addRow({ keterangan: "TOTAL PEMASUKAN", nominal: totalPemasukan });
      worksheet.addRow({ keterangan: "TOTAL PENGELUARAN", nominal: totalPengeluaran }); worksheet.addRow({ keterangan: "SALDO AKHIR", nominal: saldoAkhir });

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8E0004' } };
      const buffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      FileSaver.saveAs(blob, "Laporan_Keuangan_Pustaka.xlsx");
    } catch (error) { alert("Gagal mengekspor data!"); }
  };

  if (loading) return <div className="p-4 text-center font-bold">Memuat data keuangan...</div>;

  return (
    <div className="w-full mt-4 flex flex-col gap-6">
      
      {/* 1. DASHBOARD RINGKASAN SALDO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-2xl shadow-sm">
          <p className="text-emerald-700 text-xs font-black uppercase tracking-wider mb-1">Pemasukan (Otomatis)</p>
          <h3 className="text-2xl font-black text-emerald-900">{formatRupiah(totalPemasukan)}</h3>
        </div>
        <div className="bg-red-50 border-2 border-red-200 p-5 rounded-2xl shadow-sm">
          <p className="text-red-700 text-xs font-black uppercase tracking-wider mb-1">Total Pengeluaran</p>
          <h3 className="text-2xl font-black text-red-900">{formatRupiah(totalPengeluaran)}</h3>
        </div>
        <div className="bg-gray-900 border-2 border-black p-5 rounded-2xl shadow-md transform hover:scale-105 transition-all">
          <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">Saldo Akhir Kas</p>
          <h3 className="text-2xl font-black text-[#fec700]">{formatRupiah(saldoAkhir)}</h3>
        </div>
      </div>

      {/* 2. FORM INPUT TRANSAKSI (HANYA PENGELUARAN) */}
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-black text-gray-800 mb-4 border-b pb-3 flex items-center gap-2">
          <span>✍️</span> Catat Pengeluaran Baru
        </h2>
        <p className="text-xs text-gray-500 mb-4">*Data pemasukan (Infaq Denda & Pembuatan Kartu) dicatat otomatis oleh sistem di menu Sirkulasi dan Anggota.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Arus Kas</label>
              <div className="w-full p-3 border-2 border-red-200 rounded-xl bg-red-50 text-red-700 font-black text-sm text-center">
                PENGELUARAN (-)
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Kategori Belanja</label>
              <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm cursor-pointer font-bold">
                <option value="Beli Alat/Buku">Beli Buku / ATK</option>
                <option value="Operasional">Operasional (Tinta, Listrik, Bensin)</option>
                <option value="Kegiatan">Biaya Acara / Kegiatan TBM</option>
                <option value="Lain-lain">Pengeluaran Lainnya</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Nominal (Rp)</label>
              <input type="number" required value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="Contoh: 50000" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm font-bold" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Keterangan Singkat</label>
              <input type="text" required value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Contoh: Beli spidol dan tinta" className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm" />
            </div>

          </div>
          <button type="submit" disabled={prosesSimpan} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md mt-2 uppercase tracking-wider">
            {prosesSimpan ? "Menyimpan..." : "Potong Saldo Kas (Simpan)"}
          </button>
        </form>
      </div>

      {/* 3. RIWAYAT TRANSAKSI */}
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-lg font-bold text-gray-800">Riwayat Transaksi</h2>
          <button onClick={handleExportExcel} className="px-4 py-2 bg-[#8e0004] text-white font-bold text-xs rounded-lg hover:bg-red-800 transition-all flex items-center gap-2 shadow-sm">
            📊 Laporan Excel
          </button>
        </div>

        {transaksi.length === 0 ? (
          <p className="text-center py-6 text-gray-500 italic">Belum ada catatan kas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700 text-xs uppercase font-bold">
                <tr>
                  <th className="p-3 rounded-tl-lg">Tanggal</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3 rounded-tr-lg text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition-all">
                    <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="p-3 font-bold">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider ${item.tipe === 'Pemasukan' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">{item.keterangan}</td>
                    <td className={`p-3 text-right font-black ${item.tipe === 'Pemasukan' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.tipe === 'Pemasukan' ? '+' : '-'}{formatRupiah(item.nominal)}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleHapus(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all" title="Hapus">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}