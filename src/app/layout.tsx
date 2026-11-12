import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "O Bom Amigo | Movimento de Doação de Sangue",
  description: "Aplicativo oficial do Movimento O Bom Amigo para gestão de doadores e incentivo à doação de sangue.",
  applicationName: "O Bom Amigo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "O Bom Amigo",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
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
