"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function DaftarBuku() {
  const [buku, setBuku] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Memanggil data dari koleksi "buku" dan mengurutkannya dari yang terbaru
    const q = query(collection(db, "buku"), orderBy("createdAt", "desc"));
    
    // onSnapshot membuat data tampil secara real-time
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dataBuku = [];
      snapshot.forEach((doc) => {
        dataBuku.push({ id: doc.id, ...doc.data() });
      });
      setBuku(dataBuku);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p className="mt-8 text-gray-500">Memuat daftar buku...</p>;
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Koleksi Rangkang Pustaka</h2>
      
      {buku.length === 0 ? (
        <p className="text-gray-500 bg-gray-100 p-4 rounded text-center">
          Belum ada buku yang tersimpan.
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buku.map((item) => (
            <li key={item.id} className="p-4 border rounded-lg shadow-sm bg-white text-gray-800">
              <h3 className="font-bold text-lg text-blue-700">{item.judul}</h3>
              <p className="text-sm text-gray-600 mt-1">Penulis: {item.penulis}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}