import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import FloatingRoomMenu from "@/components/floating-room-menu";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Describe ur Partner",
  description: "Describe your partner's personality through images.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`dark ${geistSans.variable} ${geistMono.variable} antialiased relative h-full w-full bg-slate-950`}
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20"></div>
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]"></div>
        <div className="relative z-10">{children}</div>
        <FloatingRoomMenu />
      </body>
    </html>
  );
}
