// src/app/layout.tsx
// ========================================================================
// SISTEM INFORMASI KERETA API (KELOMPOK 14)
// Root Layout Utama Frontend (Font, Provider, Navbar, & Metadata)
// ========================================================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { BookingProvider } from "@/context/BookingContext";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Railink - Sistem Pemesanan Tiket Kereta Api | Kelompok 14",
  description:
    "Layanan reservasi tiket kereta api antarkota, cek jadwal perjalanan, pilih kursi langsung, dan boarding digital cepat dan terpercaya.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <BookingProvider>
          <Navbar />

          <main className="flex-1 w-full">
            {children}
          </main>

          <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2026 Railink KAI. Projek UAS Pemrograman Web - Kelompok 14.</p>
              <p className="text-slate-500">Layanan Reservasi &amp; Informasi Perjalanan Kereta Api</p>
            </div>
          </footer>
        </BookingProvider>
      </body>
    </html>
  );
}