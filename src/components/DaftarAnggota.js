// src/components/DaftarAnggota.js
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";

export default function DaftarAnggota() {
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kataKunci, setKataKunci] = useState("");

  // State untuk Inline Editing
  const [editId, setEditId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editNoAnggota, setEditNoAnggota] = useState("");
  const [editNoHp, setEditNoHp] = useState("");
  const [editInstansi, setEditInstansi] = useState("");
  const [editStatus, setEditStatus] = useState("Aktif");

  useEffect(() => {
    // Mengambil data anggota, diurutkan dari yang terbaru mendaftar
    const q = query(collection(db, "anggota"), orderBy("bergabungPada", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dataAnggota = [];
      querySnapshot.forEach((document) => {
        dataAnggota.push({ id: document.id, ...document.data() });
      });
      setAnggota(dataAnggota);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data anggota: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, namaAnggota) => {
    const konfirmasi = window.confirm(`Hapus anggota "${namaAnggota}" dari sistem?`);
    if (konfirmasi) {
      try {
        await deleteDoc(doc(db, "anggota", id));
      } catch (error) {
        alert("Gagal menghapus: " + error.message);
      }
    }
  };

  const handleEditClick = (item) => {
    setEditId(item.id);
    setEditNama(item.nama);
    setEditNoAnggota(item.noAnggota);
    setEditNoHp(item.noHp || "");
    setEditInstansi(item.instansi || "");
    setEditStatus(item.status || "Aktif");
  };

  const handleUpdate = async (id) => {
    try {
      await updateDoc(doc(db, "anggota", id), {
        nama: editNama,
        noAnggota: editNoAnggota,
        noHp: editNoHp,
        instansi: editInstansi,
        status: editStatus,
      });
      setEditId(null);
    } catch (error) {
      alert("Gagal mengupdate: " + error.message);
    }
  };

  const anggotaDifilter = anggota.filter((item) => {
    const keyword = kataKunci.toLowerCase();
    return (
      item.nama?.toLowerCase().includes(keyword) || 
      item.noAnggota?.toLowerCase().includes(keyword)
    );
  });

  if (loading) return <div className="p-4 text-center animate-pulse">Memuat data anggota...</div>;

  return (
    <div className="mt-8 max-w-4xl w-full px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Direktori Anggota</h2>
          <p className="text-sm text-gray-500 mt-1">Total: {anggota.length} Orang</p>
        </div>
        <div className="w-full sm:w-72">
          <input 
            type="text"
            placeholder="Cari nama atau nomor anggota..."
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            className="w-full p-2.5 pl-4 border border-gray-300 rounded-full text-sm text-gray-800 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>
      </div>
      
      {anggotaDifilter.length === 0 ? (
        <p className="text-center py-10 text-gray-500 italic">Belum ada data anggota.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {anggotaDifilter.map((item) => (
            <div key={item.id} className="p-4 border-l-4 border-l-green-500 rounded-r-xl shadow-sm bg-white hover:shadow-md transition-all flex flex-col gap-2">
              
              {editId === item.id ? (
                // --- MODE EDIT ---
                <div className="flex flex-col gap-2 text-sm text-black">
                  <input className="p-1.5 border rounded" placeholder="Nama" value={editNama} onChange={(e) => setEditNama(e.target.value)} />
                  <input className="p-1.5 border rounded" placeholder="No Anggota" value={editNoAnggota} onChange={(e) => setEditNoAnggota(e.target.value)} />
                  <input className="p-1.5 border rounded" placeholder="No HP" value={editNoHp} onChange={(e) => setEditNoHp(e.target.value)} />
                  <input className="p-1.5 border rounded" placeholder="Instansi" value={editInstansi} onChange={(e) => setEditInstansi(e.target.value)} />
                  <select className="p-1.5 border rounded" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                  </select>
                  <div className="flex gap-2 justify-end mt-1">
                    <button onClick={() => setEditId(null)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Batal</button>
                    <button onClick={() => handleUpdate(item.id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Simpan</button>
                  </div>
                </div>
              ) : (
                // --- MODE TAMPIL NORMAL ---
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{item.nama}</h3>
                      <p className="text-sm font-semibold text-gray-600 font-mono">{item.noAnggota}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${item.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-2">
                    <p>📞 {item.noHp}</p>
                    <p>🏫 {item.instansi}</p>
                  </div>

                  <div className="flex gap-2 justify-end mt-3 pt-3 border-t">
                    <button onClick={() => handleEditClick(item)} className="px-3 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold hover:bg-amber-100">Edit</button>
                    <button onClick={() => handleDelete(item.id, item.nama)} className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-bold hover:bg-red-100">Hapus</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}