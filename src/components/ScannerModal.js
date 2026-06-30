// src/components/ScannerModal.js
"use client";
import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ScannerModal({ onScan, onClose, title }) {
  useEffect(() => {
    // Setting mesin kamera
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: { width: 250, height: 250 },
      fps: 10,
    });

    scanner.render(
      (decodedText) => {
        scanner.clear(); // Matikan kamera setelah berhasil baca
        onScan(decodedText);
      },
      (errorMessage) => { /* Abaikan error pencarian frame */ }
    );

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/90 p-4">
      <div className="bg-white p-4 rounded-2xl w-full max-w-sm relative shadow-2xl">
        <h3 className="text-center font-black text-[#8e0004] mb-3 uppercase tracking-widest">{title || "Arahkan QR Code"}</h3>
        
        {/* Wadah Kamera */}
        <div id="reader" className="w-full rounded-xl overflow-hidden border-4 border-gray-100"></div>
        
        <p className="text-center text-xs text-gray-500 mt-3 font-medium">Posisikan kotak QR tepat di tengah layar.</p>
        
        <button onClick={onClose} className="w-full mt-4 py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-all uppercase">
          Batal / Tutup Kamera
        </button>
      </div>
    </div>
  );
}