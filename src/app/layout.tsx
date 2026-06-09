import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AetherImage - AI Generation Workspace",
  description: "A professional image generation workspace with canvas editing and context memory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <head>
        <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
      </head>
      <body className="min-h-full flex flex-col bg-[#09090c] font-sans">{children}</body>
    </html>
  );
}

