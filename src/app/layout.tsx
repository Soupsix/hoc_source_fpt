import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Flashcard Learning - Hệ Thống Học Tập Câu Hỏi",
  description: "Hệ thống luyện thi trắc nghiệm và học flashcard thông minh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
