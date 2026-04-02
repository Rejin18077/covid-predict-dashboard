import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeCure | COVID-19 Global Forecast Dashboard",
  description:
    "Real-time global COVID-19 heatmap and AI-powered case forecast dashboard. Track regional trends and predicted daily new cases.",
  keywords: "COVID-19, pandemic, forecast, heatmap, dashboard, cases, prediction",
  openGraph: {
    title: "CodeCure | COVID-19 Global Forecast Dashboard",
    description: "AI-powered COVID-19 case forecasting with global heatmap visualization.",
    type: "website",
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
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
