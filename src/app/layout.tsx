import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "Alivia — Triagem Inteligente by jpazv",
  description: "Triagem clínica inteligente para coluna, joelho e quadril. Sem cirurgia, com tecnologia avançada.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${rubik.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-rubik)]">
        {children}
      </body>
    </html>
  );
}
