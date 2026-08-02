import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hidayah Connect × TeachUs — Testing Reporting System",
  description: "Internal QA reporting dashboard for the Hidayah Connect & TeachUs platform. Track 345 test cases across 7 modules, log bugs, and generate coverage reports.",
  keywords: ["QA", "testing", "Hidayah", "TeachUs", "test reporting", "bug tracker", "test cases"],
  authors: [{ name: "Hidayah Connect & TeachUs QA Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Hidayah Connect × TeachUs — Testing Reporting System",
    description: "Track test execution, log bugs, and report QA progress across 7 platform modules.",
    siteName: "Hidayah Connect & TeachUs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
