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
import ManajemenPustakawan from "@/components/ManajemenPustakawan"; // IMPORT MENU BARU

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function Home() {
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [tampilkanLogin, setTampilkanLogin] = useState(false);
  
  const [tampilkanKameraAdmin, setTampilkanKameraAdmin] = useState(false);

  const [activeTabPublic, setActiveTabPublic] = useState("katalog");
  const [activeTabAdmin, setActiveTabAdmin] = useState("buku");      

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdmin(user);
      if (user) setTampilkanLogin(false);
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
        alert("Gagal login via QR! Pastikan email dan password aktif.");
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
        
        <div className="w-full flex flex-col md:flex-row justify-between items-center mb-6 bg-[#8e0004] p-5 md:p-6 rounded-2xl shadow-lg border-b-[6px] border-[#fec700] relative overflow-hidden gap-4">
          <div className="relative z-10 flex items-center gap-4 text-center md:text-left">
            <div className="bg-white py-2 px-3 rounded-xl shadow-md border-b-4 border-gray-200 flex-shrink-0">
              <img src="/logo.jpg" alt="Logo" className="h-14 sm:h-16 w-auto object-contain" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-white text-xs font-bold tracking-[0.2em] uppercase opacity-95">Taman Baca Masyarakat</p>
              <p className="text-[#fec700] text-[10px] font-black tracking-widest uppercase mt-0.5">Nisam, Aceh Utara</p>
            </div>
          </div>

          <div className="relative z-10 w-full md:w-auto flex justify-center md:justify-end">
            {admin ? (
              <div className="flex items-center gap-4 bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                <span className="text-xs font-bold text-white uppercase tracking-wider pl-2">🔑 {admin.email}</span>
                <button onClick={handleLogout} className="px-4 py-2 bg-[#fec700] text-[#8e0004] font-extrabold rounded-lg hover:bg-yellow-400 transition-all text-xs shadow-md">LOGOUT</button>
              </div>
            ) : (
              <button onClick={() => setTampilkanLogin(!tampilkanLogin)} className="px-4 py-2 bg-white/10 text-white font-bold rounded-lg border border-white/20 hover:bg-white hover:text-[#8e0004] transition-all text-xs tracking-wider">
                {tampilkanLogin ? "✖ TUTUP LOGIN" : "🔒 PUSTAKAWAN"}
              </button>
            )}
          </div>
        </div>

        {!admin && tampilkanLogin && (
          <div className="w-full bg-white border-2 border-[#8e0004] p-5 rounded-2xl shadow-md mb-6 animate-in slide-in-from-top duration-300">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-sm font-black text-[#8e0004] uppercase tracking-wider">Masuk Sistem Internal</h3>
              <button onClick={() => setTampilkanKameraAdmin(true)} className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                📷 Scan Kartu Admin
              </button>
            </div>
            
            <form onSubmit={handleLogin} className="flex flex-col sm:flex-row gap-3">
              <input type="email" placeholder="Ketik Email..." value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-50 border p-3 rounded-xl text-sm flex-1 focus:border-[#8e0004] outline-none" required />
              <input type="password" placeholder="Ketik Sandi..." value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-50 border p-3 rounded-xl text-sm flex-1 focus:border-[#8e0004] outline-none" required />
              <button type="submit" disabled={loadingAuth} className="px-6 py-3 bg-[#8e0004] text-white font-black rounded-xl hover:bg-red-800 text-sm transition-all uppercase shadow-md">{loadingAuth ? "Proses..." : "MASUK"}</button>
            </form>
          </div>
        )}

        {!admin && (
          <div className="w-full flex gap-2 mb-6 bg-gray-200/50 p-1.5 rounded-xl">
            <button onClick={() => setActiveTabPublic("katalog")} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTabPublic === "katalog" ? "bg-white text-[#8e0004] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>📚 Cari Buku</button>
            <button onClick={() => setActiveTabPublic("absen")} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTabPublic === "absen" ? "bg-white text-[#8e0004] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>📝 Isi Buku Tamu</button>
          </div>
        )}

        {!admin && activeTabPublic === "absen" && <InputAbsensi />}
        {admin && <DashboardStats />}

        {admin && (
          <div className="w-full flex gap-2 mb-8 flex-wrap overflow-x-auto pb-2">
            <button onClick={() => setActiveTabAdmin("buku")} className={`flex-1 min-w-[100px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "buku" ? "bg-[#8e0004] text-white border-[#8e0004]" : "bg-white text-[#8e0004] border-gray-200"}`}>📚 Katalog</button>
            <button onClick={() => setActiveTabAdmin("anggota")} className={`flex-1 min-w-[100px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "anggota" ? "bg-[#8e0004] text-white border-[#8e0004]" : "bg-white text-[#8e0004] border-gray-200"}`}>👥 Anggota</button>
            <button onClick={() => setActiveTabAdmin("sirkulasi")} className={`flex-1 min-w-[100px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "sirkulasi" ? "bg-[#8e0004] text-white border-[#8e0004]" : "bg-white text-[#8e0004] border-gray-200"}`}>🔄 Sirkulasi</button>
            <button onClick={() => setActiveTabAdmin("absen")} className={`flex-1 min-w-[100px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "absen" ? "bg-[#8e0004] text-white border-[#8e0004]" : "bg-white text-[#8e0004] border-gray-200"}`}>📝 Absensi</button>
            <button onClick={() => setActiveTabAdmin("pustakawan")} className={`flex-1 min-w-[120px] py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all border-2 ${activeTabAdmin === "pustakawan" ? "bg-gray-900 text-[#fec700] border-gray-900" : "bg-white text-gray-800 border-gray-200"}`}>🛡️ Pustakawan</button>
          </div>
        )}

        <div className="w-full flex justify-center mb-8">
          {admin && activeTabAdmin === "buku" && <InputBuku />}
          {admin && activeTabAdmin === "anggota" && <InputAnggota />}
          {admin && activeTabAdmin === "sirkulasi" && <InputPeminjaman />}
        </div>
      </div> 

      <div className="w-full max-w-4xl flex justify-center">
        {(!admin && activeTabPublic === "katalog") && <DaftarBuku isAdmin={false} />}
        {admin && activeTabAdmin === "buku" && <DaftarBuku isAdmin={true} />}
        {admin && activeTabAdmin === "anggota" && <DaftarAnggota />}
        {admin && activeTabAdmin === "sirkulasi" && <DaftarPeminjaman />}
        {admin && activeTabAdmin === "absen" && <DaftarAbsensi />}
        {admin && activeTabAdmin === "pustakawan" && <ManajemenPustakawan />}
      </div>
    </main>
  );
}