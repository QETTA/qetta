import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QETTA - AI Documentation Platform",
  description: "From application drafting to submission, AI works with you.",
  applicationName: "QETTA",
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansKR.variable} antialiased`}
      >
        {/* Skip Links for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-zinc-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-white"
        >
          Skip to content
        </a>
        <a
          href="#main-nav"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-48 focus:px-4 focus:py-2 focus:bg-zinc-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-white"
        >
          Skip to navigation
        </a>
        {children}
      </body>
    </html>
  );
}
