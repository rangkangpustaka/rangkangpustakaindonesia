// src/components/InputAbsensi.js
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import ScannerModal from "./ScannerModal"; 

export default function InputAbsensi() {
  // State Default Kategori dan Tujuan ditaruh di atas untuk Langkah 1
  const [kategori, setKategori] = useState("Peserta Didik Rangkang");
  const [tujuan, setTujuan] = useState("Membaca Buku");
  
  // State untuk Input Manual (Langkah 2 Opsional)
  const [nama, setNama] = useState("");
  const [asalInstansi, setAsalInstansi] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);
  const [pesanSukses, setPesanSukses] = useState("");

  // STATE UNTUK KAMERA SCANNER
  const [bukaKamera, setBukaKamera] = useState(false);

  // =====================================================================
  // JALUR 1: LOGIKA ABSENSI INSTAN VIA SCAN KARTU (TANPA TOMBOL KIRIM)
  // =====================================================================
  const handleScanAbsensi = async (dataQR) => {
    setBukaKamera(false); 

    if (dataQR.startsWith("ANGGOTA|")) {
      const parts = dataQR.split("|");
      const namaDariKartu = parts[2];
      const alamatDariKartu = parts[3];

      setLoading(true);
      try {
        // Langsung tembak ke Firebase detik itu juga!
        await addDoc(collection(db, "absensi"), {
          nama: namaDariKartu,
          kategori: kategori, 
          asalInstansi: alamatDariKartu || "Anggota TBM",
          tujuan: tujuan, 
          waktuKunjungan: serverTimestamp(),
        });
        
        setPesanSukses(`Selamat datang, ${namaDariKartu}!`);
        setSukses(true);
        setTimeout(() => setSukses(false), 5000);
        
      } catch (error) {
        alert("Gagal memproses absensi otomatis: " + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      alert("⚠️ QR Code tidak valid! Pastikan Anda men-scan Kartu Anggota Rangkang Pustaka.");
    }
  };

  // =====================================================================
  // JALUR 2: LOGIKA ABSENSI MANUAL (JIKA TIDAK BAWA KARTU)
  // =====================================================================
  const handleSubmitManual = async (e) => {
    e.preventDefault();
    if (!nama) return alert("Silakan ketik nama Anda terlebih dahulu!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "absensi"), {
        nama,
        kategori,
        asalInstansi: asalInstansi || "-",
        tujuan,
        waktuKunjungan: serverTimestamp(),
      });
      
      setNama(""); 
      setAsalInstansi(""); 
      
      setPesanSukses(`Terima kasih, ${nama}!`);
      setSukses(true);
      setTimeout(() => setSukses(false), 5000);
    } catch (error) {
      alert("Gagal menyimpan data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-sm border-[3px] border-gray-100 mb-8 animate-in zoom-in-95 duration-500 relative">
      
      {bukaKamera && (
        <ScannerModal 
          title="Scan Kartu Anggota Anda" 
          onScan={handleScanAbsensi} 
          onClose={() => setBukaKamera(false)} 
        />
      )}

      <div className="text-center mb-6 border-b-2 border-gray-100 pb-4">
        <span className="text-4xl mb-2 block">📝</span>
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight uppercase">Buku Tamu Digital</h2>
        <p className="text-xs text-gray-500 font-bold mt-1">Ikuti 2 langkah mudah di bawah ini untuk merekam kehadiran.</p>
      </div>

      {sukses && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="font-black text-green-800 text-sm uppercase tracking-wider">Hadir Terkonfirmasi!</p>
            <p className="text-xs text-green-700 font-bold">{pesanSukses} Data kunjungan Anda sudah tersimpan otomatis.</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-center animate-pulse">
          <p className="font-bold text-blue-800 text-sm">Sedang mencatat kehadiran ke dalam sistem...</p>
        </div>
      )}

      {/* ============================== */}
      {/* LANGKAH 1: PILIH TUJUAN DULU   */}
      {/* ============================== */}
      <div className="mb-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
        <h3 className="text-xs font-black text-blue-800 mb-4 uppercase tracking-widest flex items-center gap-2">
          <span className="bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">1</span> 
          Tentukan Status & Tujuan Kunjungan
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-600 mb-1 block uppercase tracking-wider">Kategori Pengunjung</label>
            <select 
              value={kategori} 
              onChange={(e) => setKategori(e.target.value)} 
              className="w-full p-3 border-2 border-white shadow-sm rounded-xl bg-white focus:border-[#8e0004] outline-none text-xs font-bold text-gray-900 cursor-pointer transition-all"
            >
              <option value="Peserta Didik Rangkang">🎓 Peserta Didik Rangkang</option>
              <option value="Pelajar / Siswa">🎒 Pelajar / Siswa Umum</option>
              <option value="Mahasiswa">🎓 Mahasiswa</option>
              <option value="Masyarakat Umum">🏘️ Masyarakat Umum</option>
              <option value="Guru / Dosen">👨‍🏫 Guru / Pengajar</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-600 mb-1 block uppercase tracking-wider">Tujuan Kunjungan</label>
            <select 
              value={tujuan} 
              onChange={(e) => setTujuan(e.target.value)} 
              className="w-full p-3 border-2 border-white shadow-sm rounded-xl bg-white focus:border-[#8e0004] outline-none text-xs font-bold text-gray-900 cursor-pointer transition-all"
            >
              <option value="Membaca Buku">📖 Membaca Buku di Tempat</option>
              <option value="Meminjam Buku">🚚 Meminjam Buku (Bawa Pulang)</option>
              <option value="Mengembalikan Buku">↩️ Mengembalikan Buku</option>
              <option value="Mengerjakan Tugas">✍️ Mengerjakan Tugas / Diskusi</option>
              <option value="Kunjungan Biasa">👀 Hanya Berkunjung / Melihat</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* LANGKAH 2: EKSEKUSI ABSENSI    */}
      {/* ============================== */}
      <div>
        <h3 className="text-xs font-black text-gray-800 mb-4 uppercase tracking-widest flex items-center gap-2">
          <span className="bg-gray-800 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px]">2</span> 
          Pilih Cara Absensi
        </h3>

        {/* OPSI A: SCAN KARTU (INSTAN) */}
        <button 
          type="button"
          onClick={() => setBukaKamera(true)}
          className="w-full mb-5 py-4 bg-[#8e0004] text-white font-black tracking-widest rounded-xl hover:bg-red-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm uppercase flex justify-center items-center gap-2 border-2 border-[#8e0004]"
        >
          <span className="text-xl">📷</span> 
          Scan Kartu Anggota (Otomatis Hadir)
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="h-px bg-gray-200 flex-1"></div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ATAU KETIK MANUAL JIKA TIDAK BAWA KARTU</p>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* OPSI B: KETIK MANUAL */}
        <form onSubmit={handleSubmitManual} className="flex flex-col gap-4 bg-gray-50/50 p-4 border-2 border-gray-100 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-600 mb-1 block uppercase tracking-wider">Nama Lengkap *</label>
              <input 
                type="text" 
                required 
                value={nama} 
                onChange={(e) => setNama(e.target.value)} 
                placeholder="Ketik nama di sini..." 
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-[#8e0004] outline-none text-xs font-bold text-gray-900 transition-all" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-600 mb-1 block uppercase tracking-wider">Asal Sekolah / Alamat</label>
              <input 
                type="text" 
                value={asalInstansi} 
                onChange={(e) => setAsalInstansi(e.target.value)} 
                placeholder="Contoh: SMAN 1 Nisam" 
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-[#8e0004] outline-none text-xs font-bold text-gray-900 transition-all" 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 bg-gray-800 text-white font-black tracking-widest rounded-xl hover:bg-black transition-all text-xs uppercase shadow-md"
          >
            Kirim Daftar Hadir Manual
          </button>
        </form>

      </div>
    </div>
  );
}