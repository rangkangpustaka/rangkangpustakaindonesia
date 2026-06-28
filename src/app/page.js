// src/app/page.js
import InputBuku from "@/components/InputBuku";
import DaftarBuku from "@/components/DaftarBuku";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Sistem Informasi Perpustakaan</h1>
        <p className="text-gray-600 text-sm md:text-base">Manajemen database pustaka digital berkinerja tinggi.</p>
      </div>

      <div className="w-full max-w-2xl">
        <InputBuku />
      </div>

      <DaftarBuku />
    </main>
  );
}