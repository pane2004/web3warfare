import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/lib/providers";
import Sidebar from "./components/Sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App",
  description: "An application with a ChatGPT-style sidebar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
