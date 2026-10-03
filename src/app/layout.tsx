import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { AlbumProvider } from "@/contexts/AlbumContext";
import { SongProvider } from "@/contexts/SongContext";
import { QueryProvider } from "@/providers/QueryProvider";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

const font = Urbanist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpotiCristo",
  description: "App para ouvir as gravadas para Cristo",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={font.className}>
        <QueryProvider>
          <AlbumProvider>
            <SongProvider>
              <div className="flex min-h-dvh bg-dark-900">
                <Sidebar />

                <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 min-h-dvh">
                  <main className="flex-1 overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
            </SongProvider>
          </AlbumProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
