import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function defaultMetadataBase() {
  const raw = String(process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "").trim().replace(/\/$/, "");
  if (!raw) return new URL("https://portal.hanguru.blog");
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return new URL("https://portal.hanguru.blog");
  }
}

export const metadata = {
  metadataBase: defaultMetadataBase(),
  title: "MalMoi Portal",
  description: "MalMoi integrated intro and login project",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
