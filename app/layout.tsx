import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbars"; // 👈 นำเข้า Navbar ที่สร้างใหม่

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "EXAM HUB",
  description: "ระบบคลังข้อสอบออนไลน์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8FAFC]`}>
        
        {/* Navbar ตัวใหม่ที่รองรับ Real-time UI */}
        <Navbar />

        {children}
        
      </body>
    </html>
  );
}