import "./globals.css";

export const metadata = {
  title: "Dashboard Rangkang Pustaka",
  description: "Sistem Pendataan Buku Yayasan Rangkang Pustaka",
};

export default function RootLayout({ children }) {
  return (
    // lang="id" dan suppressHydrationWarning membuat web ini kebal dari error ekstensi Translate Browser
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-black">
        {children}
      </body>
    </html>
  );
}