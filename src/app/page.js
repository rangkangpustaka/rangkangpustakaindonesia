// src/app/page.js
"use client";
import { useState, useEffect } from "react";
import InputBuku from "@/components/InputBuku";
import DaftarBuku from "@/components/DaftarBuku";
import InputAnggota from "@/components/InputAnggota";
import DaftarAnggota from "@/components/DaftarAnggota";
import InputPeminjaman from "@/components/InputPeminjaman"; 
import DaftarPeminjaman from "@/components/DaftarPeminjaman"; 
import DashboardStats from "@/components/DashboardStats";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function Home() {
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("buku");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdmin(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
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

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab("buku");
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 flex flex-col items-center print:bg-white print:p-0">
      
      {/* =========================================================================
          WRAPPER NON-CETAK
          ========================================================================= */}
      <div className="w-full max-w-4xl flex flex-col items-center print:hidden">
        
        {/* HEADER UTAMA DENGAN LOGO ASLI */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center mb-6 bg-[#8e0004] p-5 md:p-6 rounded-2xl shadow-lg border-b-[6px] border-[#fec700] relative overflow-hidden gap-4">
          
          {/* BRANDING DENGAN LOGO */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center md:text-left">
            {/* Kartu Badge Putih untuk Logo */}
            <div className="bg-white py-2 px-3 rounded-xl shadow-md border-b-4 border-gray-200 flex-shrink-0">
              <img 
                src="/logo.jpg" 
                alt="Logo Rangkang Pustaka" 
                className="h-14 sm:h-16 w-auto object-contain" 
              />
            </div>
            
            {/* Teks Subtitle */}
            <div className="hidden sm:block">
              <p className="text-white text-xs font-bold tracking-[0.2em] uppercase mt-1 opacity-95">
                Taman Baca Masyarakat
              </p>
              <p className="text-[#fec700] text-[10px] font-black tracking-widest uppercase mt-0.5">
                Nisam, Aceh Utara
              </p>
            </div>
          </div>

          {/* AREA AUTH / LOGIN ADMIN */}
          <div className="relative z-10 w-full md:w-auto">
            {admin ? (
              <div className="flex items-center justify-center md:justify-end gap-4 bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                <span className="text-sm font-bold text-white uppercase tracking-wider pl-2">🔑 Pustakawan</span>
                <button onClick={handleLogout} className="px-4 py-2 bg-[#fec700] text-[#8e0004] font-extrabold rounded-lg hover:bg-yellow-400 transition-all text-xs shadow-md">
                  LOGOUT
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="flex flex-col sm:flex-row gap-2 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                <input 
                  type="email" placeholder="Email Pustakawan" value={email} onChange={(e) => setEmail(e.target.value)} 
                  className="bg-white p-2.5 rounded-lg text-sm text-gray-900 w-full sm:w-44 focus:ring-2 focus:ring-[#fec700] outline-none placeholder-gray-500 font-medium shadow-inner" required 
                />
                <input 
                  type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} 
                  className="bg-white p-2.5 rounded-lg text-sm text-gray-900 w-full sm:w-36 focus:ring-2 focus:ring-[#fec700] outline-none placeholder-gray-500 font-medium shadow-inner" required 
                />
                <button type="submit" disabled={loadingAuth} className="px-5 py-2.5 bg-[#fec700] text-[#8e0004] font-black rounded-lg hover:bg-yellow-400 text-sm transition-all tracking-wider uppercase shadow-md">
                  {loadingAuth ? "..." : "LOGIN"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* DASHBOARD STATISTIK */}
        {admin && <DashboardStats />}

        {/* NAVIGASI TAB UTAMA */}
        {admin && (
          <div className="w-full flex flex-col sm:flex-row gap-3 mb-8">
            <button onClick={() => setActiveTab("buku")} className={`flex-1 py-3.5 text-center text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 border-2 ${activeTab === "buku" ? "bg-[#8e0004] text-white border-[#8e0004] shadow-md" : "bg-white text-[#8e0004] border-gray-200 hover:border-[#8e0004]"}`}>
              📚 Katalog Koleksi
            </button>
            <button onClick={() => setActiveTab("anggota")} className={`flex-1 py-3.5 text-center text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 border-2 ${activeTab === "anggota" ? "bg-[#8e0004] text-white border-[#8e0004] shadow-md" : "bg-white text-[#8e0004] border-gray-200 hover:border-[#8e0004]"}`}>
              👥 Manajemen Anggota
            </button>
            <button onClick={() => setActiveTab("sirkulasi")} className={`flex-1 py-3.5 text-center text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 border-2 ${activeTab === "sirkulasi" ? "bg-[#8e0004] text-white border-[#8e0004] shadow-md" : "bg-white text-[#8e0004] border-gray-200 hover:border-[#8e0004]"}`}>
              🔄 Sirkulasi Peminjaman
            </button>
          </div>
        )}

        {/* CONTAINER FORM INPUT */}
        <div className="w-full flex justify-center mb-8">
          {(activeTab === "buku" || !admin) && admin && <InputBuku />}
          {admin && activeTab === "anggota" && <InputAnggota />}
          {admin && activeTab === "sirkulasi" && <InputPeminjaman />}
        </div>

      </div> 

      {/* =========================================================================
          WRAPPER LIST UTAMA
          ========================================================================= */}
      <div className="w-full flex justify-center">
        {(activeTab === "buku" || !admin) && <DaftarBuku isAdmin={!!admin} />}
        {admin && activeTab === "anggota" && <DaftarAnggota />}
        {admin && activeTab === "sirkulasi" && <DaftarPeminjaman />}
      </div>

    </main>
  );
}