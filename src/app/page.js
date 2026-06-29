// src/app/page.js
"use client";
import { useState, useEffect } from "react";
import InputBuku from "@/components/InputBuku";
import DaftarBuku from "@/components/DaftarBuku";
import InputAnggota from "@/components/InputAnggota";
import DaftarAnggota from "@/components/DaftarAnggota";
// IMPORT KOMPONEN SIRKULASI BARU
import InputPeminjaman from "@/components/InputPeminjaman"; 
import DaftarPeminjaman from "@/components/DaftarPeminjaman"; 

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function Home() {
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  
  // STATE TAB: "buku", "anggota", atau "sirkulasi"
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
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      
      {/* HEADER */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-6 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Rangkang Pustaka</h1>
          <p className="text-gray-600 text-sm">Sistem Manajemen Pustaka Terpadu</p>
        </div>

        <div className="mt-4 md:mt-0">
          {admin ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-green-600">Halo, Pustakawan!</span>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded hover:bg-red-200 text-sm transition-all">Logout</button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="flex gap-2">
              <input type="email" placeholder="Email Admin" value={email} onChange={(e) => setEmail(e.target.value)} className="p-2 border rounded text-sm text-black" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-2 border rounded text-sm text-black" required />
              <button type="submit" disabled={loadingAuth} className="px-4 py-2 bg-blue-600 text-white font-bold rounded text-sm">Login</button>
            </form>
          )}
        </div>
      </div>

      {/* NAVIGASI 3 TAB UNTUK ADMIN */}
      {admin && (
        <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-2 mb-8 bg-white rounded-lg shadow-sm border p-1">
          <button onClick={() => setActiveTab("buku")} className={`flex-1 py-2 text-center font-bold rounded-md transition-all ${activeTab === "buku" ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}>
            📚 Katalog Buku
          </button>
          <button onClick={() => setActiveTab("anggota")} className={`flex-1 py-2 text-center font-bold rounded-md transition-all ${activeTab === "anggota" ? "bg-green-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}>
            👥 Anggota
          </button>
          <button onClick={() => setActiveTab("sirkulasi")} className={`flex-1 py-2 text-center font-bold rounded-md transition-all ${activeTab === "sirkulasi" ? "bg-purple-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}>
            🔄 Sirkulasi
          </button>
        </div>
      )}

      {/* TAB 1: BUKU */}
      {(activeTab === "buku" || !admin) && (
        <>
          {admin && <div className="w-full max-w-2xl mb-8"><InputBuku /></div>}
          <DaftarBuku isAdmin={!!admin} />
        </>
      )}

      {/* TAB 2: ANGGOTA */}
      {admin && activeTab === "anggota" && (
        <>
          <div className="w-full max-w-2xl mb-8"><InputAnggota /></div>
          <DaftarAnggota />
        </>
      )}

      {/* TAB 3: SIRKULASI */}
      {admin && activeTab === "sirkulasi" && (
        <>
          <div className="w-full max-w-2xl mb-8"><InputPeminjaman /></div>
          <DaftarPeminjaman />
        </>
      )}
      
    </main>
  );
}