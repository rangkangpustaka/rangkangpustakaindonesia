// src/components/DaftarBuku.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";

export default function DaftarBuku() {
  const [buku, setBuku] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Terintegrasi untuk Inline Editing
  const [editId, setEditId] = useState(null);
  const [editJudul, setEditJudul] = useState("");
  const [editPenulis, setEditPenulis] = useState("");
  const [editIsbn, setEditIsbn] = useState("");
  const [editPenerbit, setEditPenerbit] = useState("");
  const [editTahun, setEditTahun] = useState("");
  const [editStok, setEditStok] = useState("");
  const [editSampul, setEditSampul] = useState("");

  useEffect(() => {
    const q = query(collection(db, "buku"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dataBuku = [];
      querySnapshot.forEach((document) => {
        dataBuku.push({ id: document.id, ...document.data() });
      });
      setBuku(dataBuku);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, judulBuku) => {
    const konfirmasi = window.confirm(`Yakin ingin menghapus buku "${judulBuku}"?`);
    if (konfirmasi) {
      try {
        await deleteDoc(doc(db, "buku", id));
      } catch (error) {
        console.error("Gagal menghapus buku:", error);
        alert("Gagal menghapus: " + error.message);
      }
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setEditJudul(item.judul);
    setEditPenulis(item.penulis);
    setEditIsbn(item.isbn || "-");
    setEditPenerbit(item.penerbit || "-");
    setEditTahun(item.tahun || "");
    setEditStok(item.stok || 0);
    setEditSampul(item.sampul || "");
  };

  const handleUpdate = async (id) => {
    try {
      const bukuRef = doc(db, "buku", id);
      await updateDoc(bukuRef, {
        judul: editJudul,
        penulis: editPenulis,
        isbn: editIsbn,
        penerbit: editPenerbit,
        tahun: editTahun,
        stok: Number(editStok),
        sampul: editSampul,
      });
      setEditId(null);
    } catch (error) {
      console.error("Gagal update buku:", error);
      alert("Gagal mengupdate: " + error.message);
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-600 text-center font-medium animate-pulse">Memuat katalog...</div>;
  }

  return (
    <div className="mt-10 max-w-4xl w-full px-4">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-2xl font-bold text-gray-800">Katalog Koleksi Perpustakaan</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">{buku.length} Judul</span>
      </div>
      
      {buku.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8">Belum ada buku dalam katalog.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {buku.map((item) => (
            <div key={item.id} className="p-4 border rounded-xl shadow-sm bg-white hover:shadow-md transition-all flex gap-4 relative">
              
              {editId === item.id ? (
                // --- TAMPILAN MODE EDIT ---
                <div className="flex flex-col gap-2 w-full text-xs text-black">
                  <input className="p-1.5 border rounded bg-gray-50" placeholder="Judul" value={editJudul} onChange={(e) => setEditJudul(e.target.value)} />
                  <input className="p-1.5 border rounded bg-gray-50" placeholder="Penulis" value={editPenulis} onChange={(e) => setEditPenulis(e.target.value)} />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input className="p-1.5 border rounded bg-gray-50" placeholder="ISBN" value={editIsbn} onChange={(e) => setEditIsbn(e.target.value)} />
                    <input className="p-1.5 border rounded bg-gray-50" placeholder="Penerbit" value={editPenerbit} onChange={(e) => setEditPenerbit(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" className="p-1.5 border rounded bg-gray-50" placeholder="Tahun" value={editTahun} onChange={(e) => setEditTahun(e.target.value)} />
                    <input type="number" className="p-1.5 border rounded bg-gray-50" placeholder="Stok" value={editStok} onChange={(e) => setEditStok(e.target.value)} />
                  </div>

                  <input className="p-1.5 border rounded bg-gray-50" placeholder="URL Sampul" value={editSampul} onChange={(e) => setEditSampul(e.target.value)} />

                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded font-semibold hover:bg-gray-300">Batal</button>
                    <button onClick={() => handleUpdate(item.id)} className="px-3 py-1.5 bg-green-600 text-white rounded font-semibold hover:bg-green-700">Simpan</button>
                  </div>
                </div>
              ) : (
                // --- TAMPILAN KATALOG MODERN ---
                <>
                  <div className="w-24 h-36 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden shadow-sm border">
                    <img 
                      src={item.sampul} 
                      alt={item.judul}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60";
                      }}
                    />
                  </div>

                  <div className="flex flex-col justify-between flex-grow min-w-0">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 truncate tracking-tight">{item.judul}</h3>
                      <p className="text-sm text-blue-600 font-medium truncate mb-2">Oleh: {item.penulis}</p>
                      
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p><span className="font-medium text-gray-700">Penerbit:</span> {item.penerbit}</p>
                        <p><span className="font-medium text-gray-700">Tahun:</span> {item.tahun}</p>
                        <p><span className="font-medium text-gray-700">ISBN:</span> {item.isbn}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${item.stok > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        Stok: {item.stok} eks
                      </span>
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-md hover:bg-amber-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.judul)}
                          className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-md hover:bg-red-100 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div> {/* <--- INI TAG PENUTUP YANG HILANG SEBELUMNYA */}
                </>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}