// src/components/ManajemenPustakawan.js
"use client";
import { useState } from "react";

export default function ManajemenPustakawan() {
  const [namaAdmin, setNamaAdmin] = useState("");
  const [emailAdmin, setEmailAdmin] = useState("");
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [kartuDibuat, setKartuDibuat] = useState(false);

  const handleBuatKartu = (e) => {
    e.preventDefault();
    if (!namaAdmin || !emailAdmin || !passwordAdmin) {
      return alert("Harap isi semua data!");
    }
    setKartuDibuat(true);
  };

  const handleCetakKartu = () => {
    window.print();
  };

  return (
    <div className="w-full mt-4 flex flex-col items-center">
      
      {/* FORM INPUT DI LAYAR WEB */}
      <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
        <h2 className="text-xl font-black text-gray-800 mb-2 border-b pb-4 flex items-center gap-2">
          <span>🛡️</span> Buat Kartu Akses Pustakawan
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Masukkan email dan password akun admin Firebase Anda. Sistem akan membuatkan QR Code rahasia untuk login kilat via kamera.
        </p>

        <form onSubmit={handleBuatKartu} className="flex flex-col gap-4">
          <input type="text" required value={namaAdmin} onChange={(e) => setNamaAdmin(e.target.value)} placeholder="Nama Lengkap Admin" className="p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm" />
          <input type="email" required value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)} placeholder="Email Akun Firebase" className="p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm" />
          <input type="text" required value={passwordAdmin} onChange={(e) => setPasswordAdmin(e.target.value)} placeholder="Password Akun Firebase" className="p-3 border-2 rounded-xl bg-gray-50 focus:border-[#8e0004] outline-none text-sm" />
          
          <button type="submit" className="w-full py-3 mt-2 bg-gray-800 text-white font-bold rounded-xl hover:bg-black transition-all">
            🛠️ Generate Kartu Admin
          </button>
        </form>

        {kartuDibuat && (
          <button onClick={handleCetakKartu} className="w-full py-3 mt-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all">
            🪪 Cetak Kartu Sekarang
          </button>
        )}
      </div>

      {/* TAMPILAN CETAK KARTU FISIK (Hanya Muncul Saat Print) */}
      {kartuDibuat && (
        <div className="hidden print:flex flex-col items-center justify-center mt-10">
          <div className="relative w-[8.5cm] h-[5.4cm] border-[2px] border-black bg-white rounded-lg overflow-hidden flex flex-col font-sans break-inside-avoid shadow-sm">
            
            {/* Header Hitam Emas Khusus Admin */}
            <div className="bg-gray-900 h-[1.6cm] w-full flex items-center px-2 gap-2 border-b-4 border-[#fec700]">
              <div className="bg-white h-10 w-10 p-0.5 rounded-full flex items-center justify-center">
                <img src="/logo.jpg" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div className="text-white flex-1 text-center pr-4">
                <p className="text-[9px] font-bold tracking-widest uppercase text-[#fec700]">KARTU AKSES PUSTAKAWAN</p>
                <p className="text-[12px] font-black uppercase leading-tight">Rangkang Pustaka</p>
              </div>
            </div>

            {/* Badan Kartu Khusus Admin */}
            <div className="flex-1 flex p-2 bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="flex-1 flex flex-col justify-center gap-2">
                <div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Nama Pustakawan</p>
                  <p className="text-[13px] font-black text-gray-900">{namaAdmin}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">ID Sistem / Email</p>
                  <p className="text-[10px] font-bold text-[#8e0004]">{emailAdmin}</p>
                </div>
              </div>
              
              <div className="w-[2.2cm] h-full flex flex-col items-center justify-center border-l-2 border-gray-300 pl-2">
                <div className="w-[1.8cm] h-[1.8cm] bg-white border-2 border-gray-800 p-0.5 rounded-md shadow-sm">
                  {/* Kode Rahasia: ADMIN|email|password */}
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`ADMIN|${emailAdmin}|${passwordAdmin}`)}`} alt="QR Admin" className="w-full h-full object-contain" />
                </div>
                <p className="text-[6px] text-center mt-1 text-gray-600 font-black uppercase">Scan Login</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}