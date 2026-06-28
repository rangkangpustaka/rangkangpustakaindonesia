import InputBuku from "@/components/InputBuku";
import DaftarBuku from "@/components/DaftarBuku"; // Tambahkan baris ini

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50 text-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-900">
          Dashboard Manajemen Rangkang Pustaka
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri untuk Input Data */}
          <div className="lg:col-span-1">
            <InputBuku />
          </div>
          
          {/* Kolom Kanan untuk Menampilkan Data */}
          <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-gray-300 lg:pl-8 pt-8 lg:pt-0">
            <DaftarBuku />
          </div>
        </div>
      </div>
    </main>
  );
}