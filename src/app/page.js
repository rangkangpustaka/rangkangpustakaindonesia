// src/app/page.js
"use client";
import { useState, useEffect } from "react";
import InputBuku from "@/components/InputBuku";
import DaftarBuku from "@/components/DaftarBuku";
import InputAnggota from "@/components/InputAnggota";
import DaftarAnggota from "@/components/DaftarAnggota";
import InputPeminjaman from "@/components/InputPeminjaman"; 
import DaftarPeminjaman from "@/components/DaftarPeminjaman"; 
import InputAbsensi from "@/components/InputAbsensi";       
import DaftarAbsensi from "@/components/DaftarAbsensi";     
import DashboardStats from "@/components/DashboardStats";
import ScannerModal from "@/components/ScannerModal";
import ManajemenPustakawan from "@/components/ManajemenPustakawan";
import ManajemenKas from "@/components/ManajemenKas";

import { auth, db } from "@/lib/firebase"; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore"; 

export default function Home() {
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [tampilkanLogin, setTampilkanLogin] = useState(false);
  
  const [hakAksesAdmin, setHakAksesAdmin] = useState("");

  const [tampilkanKameraAdmin, setTampilkanKameraAdmin] = useState(false);
  const [activeTabPublic, setActiveTabPublic] = useState("katalog");
  const [activeTabAdmin, setActiveTabAdmin] = useState("buku");      

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAdmin(user);
      if (user) {
        setTampilkanLogin(false);
        setActiveTabAdmin("buku"); 
        
        const q = query(collection(db, "pustakawan"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const adminData = querySnapshot.docs[0].data();
          setHakAksesAdmin(adminData.hakAkses || "Akses Dasar"); 
        } else {
          setHakAksesAdmin("Akses Dasar"); 
        }
      } else {
        setHakAksesAdmin("");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoadingAuth(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail(""); setPassword("");
    } catch (error) {
      alert("Gagal login! Periksa email dan password.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleScanAdmin = async (dataQR) => {
    setTampilkanKameraAdmin(false);
    if (dataQR.startsWith("ADMIN|")) {
      const parts = dataQR.split("|");
      const scanEmail = parts[1];
      const scanPass = parts[2];
      
      setLoadingAuth(true);
      try {
        await signInWithEmailAndPassword(auth, scanEmail, scanPass);
      } catch (error) {
        alert("Gagal login via QR! Pastikan akun aktif.");
      } finally {
        setLoadingAuth(false);
      }
    } else {
      alert("⚠️ QR Code Ditolak! Ini bukan Kartu Pustakawan.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTabAdmin("buku");
    setActiveTabPublic("katalog");
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 flex flex-col items-center print:bg-white print:p-0">
      
      {tampilkanKameraAdmin && <ScannerModal title="Scan Kartu Pustakawan" onScan={handleScanAdmin} onClose={() => setTampilkanKameraAdmin(false)} />}

      <div className="w-full max-w-4xl flex flex-col items-center print:hidden">
        
        {/* BANNER ATAS UTAMA */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center mb-6 bg-[#8e0004] p-5 md:p-6 rounded-2xl shadow-lg border-b-[6px] border-[#fec700] relative overflow-hidden gap-4">
          
          <div className="relative z-10 flex items-center gap-4 text-center md:text-left select-none">
            {/* LOGO SAKTI: PINTU MASUK RAHASIA PUSTAKAWAN */}
            <div 
              onClick={() => !admin && setTampilkanLogin(!tampilkanLogin)} 
              className={`bg-white py-2 px-3 rounded-xl shadow-md border-b-4 border-gray-200 flex-shrink-0 transition-all ${!admin ? 'cursor-pointer active:scale-95 hover:brightness-95' : ''}`}
              title={!admin ? "Halaman Internal Rangkang Pustaka" : ""}
            >
              <img src="/logo.jpg" alt="Logo Rangkang" className="h-14 sm:h-16 w-auto object-contain" />
            </div>

            <div className="text-left">
              <p className="text-white text-xs font-bold tracking-[0.2em] uppercase opacity-95">Taman Baca Masyarakat</p>
              <p className="text-[#fec700] text-lg font-black tracking-wide uppercase leading-tight">Rangkang Pustaka</p>
              <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase">Nisam, Aceh Utara</p>
            </div>
          </div>

          {/* KANAN BANNER: TOMBOL LOGOUT */}
          <div className="relative z-10 w-full md:w-auto flex justify-center md:justify-end">
            {admin && (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-4 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex flex-col items-end pr-2">
                    <span className="text-[10px] font-bold text-[#fec700] uppercase tracking-wider">{hakAksesAdmin}</span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{admin.email}</span>
                  </div>
                  <button onClick={handleLogout} className="px-4 py-2 bg-[#fec700] text-[#8e0004] font-extrabold rounded-lg hover:bg-yellow-400 transition-all text-xs shadow-md">LOGOUT</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FORMULIR LOGIN INTERNAL (RUNTUH JIKA LOGO DIKLIK) */}
        {!admin && tampilkanLogin && (
          <div className="w-full bg-white border-2 border-[#8e0004] p-5 rounded-2xl shadow-md mb-6 animate-in slide-in-from-top duration-300">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h3 className="text-sm font-black text-[#8e0004] uppercase tracking-wider">Otentikasi Pustakawan Rangkang</h3>
              </div>
              <button onClick={() => setTampilkanKameraAdmin(true)} className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all">
                📷 Scan Kartu Admin
              </button>
            </div>
            
            <form onSubmit={handleLogin} className="flex flex-col sm:flex-row gap-3">
              <input type="email" placeholder="Ketik Email Pustakawan..." value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-50 border p-3 rounded-xl text-sm flex-1 focus:border-[#8e0004] outline-none font-medium" required />
              <input type="password" placeholder="Ketik Sandi..." value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-50 border p-3 rounded-xl text-sm flex-1 focus:border-[#8e0004] outline-none font-medium" required />
              <button type="submit" disabled={loadingAuth} className="px-6 py-3 bg-[#8e0004] text-white font-black rounded-xl hover:bg-red-800 text-sm transition-all uppercase shadow-md tracking-wider">{loadingAuth ? "Proses..." : "MASUK"}</button>
            </form>
          </div>
        )}

        {/* TAMPILAN KIOSK PENGUNJUNG UMUM */}
        {!admin && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
            {/* Pesan Sambutan */}
            <div className="text-center mb-6 mt-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight mb-2">Selamat Datang Sobat Literasi! 👋</h1>
              <p className="text-sm text-gray-500 font-medium">Jelajahi jendela dunia dari desa kita. Silakan pilih menu di bawah ini.</p>
            </div>

            {/* Menu Utama (Card Style Raksasa) */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setActiveTabPublic("katalog")}
                className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl transition-all border-[3px] group ${
                  activeTabPublic === "katalog"
                    ? "bg-white border-[#8e0004] shadow-[#8e0004]/20 shadow-xl scale-[1.02]"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100 shadow-sm"
                }`}
              >
                <span className="text-5xl sm:text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">📚</span>
                <h3 className={`text-lg sm:text-xl font-black uppercase tracking-widest mt-2 ${activeTabPublic === "katalog" ? "text-[#8e0004]" : "text-gray-700"}`}>Katalog Koleksi</h3>
                <p className="text-xs text-gray-500 font-bold mt-2 text-center">Cari buku favoritmu di sini</p>
              </button>

              <button
                onClick={() => setActiveTabPublic("absen")}
                className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl transition-all border-[3px] group ${
                  activeTabPublic === "absen"
                    ? "bg-white border-[#8e0004] shadow-[#8e0004]/20 shadow-xl scale-[1.02]"
                    : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100 shadow-sm"
                }`}
              >
                <span className="text-5xl sm:text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">📝</span>
                <h3 className={`text-lg sm:text-xl font-black uppercase tracking-widest mt-2 ${activeTabPublic === "absen" ? "text-[#8e0004]" : "text-gray-700"}`}>Isi Buku Tamu</h3>
                <p className="text-xs text-gray-500 font-bold mt-2 text-center">Rekam jejak kunjungan hari ini</p>
              </button>
            </div>

            {/* Petunjuk Pintar Saat Membuka Katalog */}
            {activeTabPublic === "katalog" && (
               <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-4 flex items-start gap-3 shadow-sm">
                 <span className="text-blue-600 text-2xl animate-bounce">💡</span>
                 <div>
                   <h4 className="text-sm font-black text-blue-900 mb-1 uppercase tracking-wider">Petunjuk Peminjaman:</h4>
                   <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                     1. Cari judul buku pada kotak pencarian di bawah.<br/>
                     2. Perhatikan tulisan warna merah <b className="bg-red-100 px-1 rounded text-red-700">No: xxx</b> untuk mencari bukunya di dalam rak.<br/>
                     3. Ambil buku tersebut dan bawa ke meja Pustakawan beserta Kartu Anggota Anda.
                   </p>
                 </div>
               </div>
            )}
          </div>
        )}

        {/* INPUT BUKU TAMU PENGUNJUNG */}
        {!admin && activeTabPublic === "absen" && <InputAbsensi />}
        
        {/* STATISTIK INTERNAL (HANYA AKSES BESAR) */}
        {admin && hakAksesAdmin === "Akses Besar" && <DashboardStats />}

        {/* MENU PANEL INTERNAL PUSTAKAWAN */}
        {admin && (
          <div className="w-full flex gap-2 mb-8 flex-wrap overflow-x-auto pb-2">
            <button onClick={() => setActiveTabAdmin("buku")} className={`flex-1 min-w-[100px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "buku" ? "bg-[#8e0004] text-white border-[#8e0004]" : "bg-white text-[#8e0004] border-gray-200"}`}>📚 Katalog</button>
            <button onClick={() => setActiveTabAdmin("sirkulasi")} className={`flex-1 min-w-[100px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "sirkulasi" ? "bg-[#8e0004] text-white border-[#8e0004]" : "bg-white text-[#8e0004] border-gray-200"}`}>🔄 Sirkulasi</button>
            <button onClick={() => setActiveTabAdmin("anggota")} className={`flex-1 min-w-[100px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "anggota" ? "bg-[#8e0004] text-white border-[#8e0004]" : "bg-white text-[#8e0004] border-gray-200"}`}>👥 Anggota</button>
            <button onClick={() => setActiveTabAdmin("absen")} className={`flex-1 min-w-[100px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "absen" ? "bg-[#8e0004] text-white border-[#8e0004]" : "bg-white text-[#8e0004] border-gray-200"}`}>📝 Absensi</button>
            
            {hakAksesAdmin === "Akses Besar" && (
              <>
                <button onClick={() => setActiveTabAdmin("pustakawan")} className={`flex-1 min-w-[120px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "pustakawan" ? "bg-gray-900 text-[#fec700] border-gray-900" : "bg-white text-gray-800 border-gray-200"}`}>🛡️ Pustakawan</button>
                <button onClick={() => setActiveTabAdmin("kas")} className={`flex-1 min-w-[120px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "kas" ? "bg-emerald-700 text-white border-emerald-700 shadow-md" : "bg-white text-emerald-700 border-gray-200"}`}>💰 Keuangan</button>
              </>
            )}
          </div>
        )}

        {/* INPUT BOX INTERNAL */}
        <div className="w-full flex justify-center mb-8">
          {admin && activeTabAdmin === "buku" && <InputBuku />}
          {admin && activeTabAdmin === "sirkulasi" && <InputPeminjaman hakAksesAdmin={hakAksesAdmin} />}
          {admin && activeTabAdmin === "anggota" && <InputAnggota />}
        </div>
      </div> 

      {/* RENDER TABEL & REKORD DATA UTAMA */}
      <div className="w-full max-w-4xl flex justify-center">
        {(!admin && activeTabPublic === "katalog") && <DaftarBuku isAdmin={false} />}
        {admin && activeTabAdmin === "buku" && <DaftarBuku isAdmin={true} hakAksesAdmin={hakAksesAdmin} />}
        {admin && activeTabAdmin === "sirkulasi" && <DaftarPeminjaman hakAksesAdmin={hakAksesAdmin} />}
        {admin && activeTabAdmin === "anggota" && <DaftarAnggota hakAksesAdmin={hakAksesAdmin} />}
        {admin && activeTabAdmin === "absen" && <DaftarAbsensi hakAksesAdmin={hakAksesAdmin} />}
        {admin && hakAksesAdmin === "Akses Besar" && activeTabAdmin === "pustakawan" && <ManajemenPustakawan />}
        {admin && hakAksesAdmin === "Akses Besar" && activeTabAdmin === "kas" && <ManajemenKas />}
      </div>
    </main>
  );
}