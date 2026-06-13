import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CareerEngineProvider } from "@/hooks/useCareerEngine";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Career OS | Next-Gen Trajectory Engine",
  description: "A professional, next-generation job search and career trajectory platform featuring custom Step Semi-Markov modeling and dynamic skill graph traversal.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 flex flex-col font-sans">
        <CareerEngineProvider>
          {children}
        </CareerEngineProvider>
        <Analytics />
      </body>
    </html>
  );
}

