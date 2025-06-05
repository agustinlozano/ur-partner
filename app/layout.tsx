import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import FloatingRoomMenu from "@/components/floating-room-menu";
import ThemeToggleButton from "@/components/theme-toggle-button";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative h-full w-full`}
      >
        <ThemeProvider>
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 top-0 bg-[size:34px_44px]",
              "bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]",
              "dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"
            )}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20"></div>
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]"></div>
          <div className="relative z-10">{children}</div>
          <FloatingRoomMenu />
          <ThemeToggleButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
