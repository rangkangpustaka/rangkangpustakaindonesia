// src/app/page.js
"use client";
import { useState, useEffect } from "react";
import InputBuku from "@/components/InputBuku";
import DaftarBuku from "@/components/DaftarBuku";

// Import Firebase Auth
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

export default function Home() {
  const [admin, setAdmin] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Mengecek status login saat web dibuka
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
      alert("Berhasil login sebagai Pustakawan!");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Gagal login:", error);
      alert("Gagal login! Periksa email dan password.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      
      {/* HEADER UTAMA */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Rangkang Pustaka</h1>
          <p className="text-gray-600 text-sm">Sistem Informasi Perpustakaan (OPAC)</p>
        </div>

        {/* LOGIKA LOGIN / LOGOUT */}
        <div className="mt-4 md:mt-0">
          {admin ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-green-600">Halo, Pustakawan!</span>
              <button onClick={handleLogout} className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded hover:bg-red-200 text-sm transition-all">
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="flex gap-2">
              <input type="email" placeholder="Email Admin" value={email} onChange={(e) => setEmail(e.target.value)} className="p-2 border rounded text-sm text-black" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-2 border rounded text-sm text-black" required />
              <button type="submit" disabled={loadingAuth} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 text-sm transition-all">
                {loadingAuth ? "..." : "Login"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* JIKA ADMIN LOGIN: Tampilkan Form Input Buku */}
      {admin && (
        <div className="w-full max-w-2xl mb-8 animate-fade-in-down">
          <InputBuku />
        </div>
      )}

      {/* KATALOG BUKU SELALU TAMPIL (Tapi mode Admin/Visitor dipisah) */}
      <DaftarBuku isAdmin={!!admin} />
      
    </main>
  );
}