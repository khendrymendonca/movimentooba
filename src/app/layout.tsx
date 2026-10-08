import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "O Bom Amigo",
  description: "Projeto social para gestão de doadores de sangue",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${instrumentSans.className} min-h-screen bg-slate-50 text-slate-900 flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
