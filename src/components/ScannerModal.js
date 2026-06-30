// src/components/ScannerModal.js
"use client";
import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ScannerModal({ onScan, onClose, title }) {
  const [pesan, setPesan] = useState("⏳ Meminta izin kamera...");

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    let isMounted = true;

    const mulaiKamera = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (isMounted) {
              isMounted = false; // Kunci agar tidak membaca QR 2 kali
              
              // PEREDAM ERROR 1: Saat kamera berhasil membaca QR
              try {
                scanner.stop().then(() => {
                  scanner.clear();
                  onScan(decodedText);
                }).catch(() => {
                  onScan(decodedText);
                });
              } catch (err) {
                // Tangkap error jika scanner menolak di-stop
                try { scanner.clear(); } catch(e) {}
                onScan(decodedText);
              }
            }
          },
          (errorMessage) => { /* Abaikan error pencarian fokus lensa */ }
        );
        if (isMounted) setPesan(""); 
      } catch (error) {
        if (isMounted) setPesan("⚠️ Gagal mengakses kamera. Mohon izinkan akses kamera di browser Anda.");
      }
    };

    mulaiKamera();

    // PEREDAM ERROR 2: Pembersih otomatis saat modal ditutup / pindah halaman
    return () => {
      isMounted = false;
      try {
        scanner.stop().then(() => {
          scanner.clear();
        }).catch(() => {
          // Bersihkan sisa elemen video di layar jika nyangkut
          const readerElement = document.getElementById("reader");
          if (readerElement) readerElement.innerHTML = "";
        });
      } catch (error) {
        // Tangkap error sinkronus "Cannot stop, scanner is not running"
        try { scanner.clear(); } catch(e) {}
        const readerElement = document.getElementById("reader");
        if (readerElement) readerElement.innerHTML = "";
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/90 p-4">
      <div className="bg-white p-4 rounded-2xl w-full max-w-sm relative shadow-2xl animate-in zoom-in duration-200">
        <h3 className="text-center font-black text-[#8e0004] mb-3 uppercase tracking-widest">
          {title || "Arahkan QR Code"}
        </h3>
        
        <div className="relative w-full rounded-xl overflow-hidden border-4 border-gray-200 bg-gray-50 min-h-[250px] flex flex-col items-center justify-center">
          {pesan && (
            <div className="absolute z-10 px-4 text-center">
              <p className="text-sm font-bold text-gray-700">{pesan}</p>
            </div>
          )}
          <div id="reader" className="w-full h-full relative z-0"></div>
        </div>
        
        <p className="text-center text-[10px] text-gray-500 mt-3 font-medium">
          Posisikan kotak QR tepat di tengah layar agar otomatis terbaca.
        </p>
        
        <button onClick={onClose} className="w-full mt-4 py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-all uppercase tracking-wider">
          ✖ Tutup Kamera
        </button>
      </div>
    </div>
  );
}