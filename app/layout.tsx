import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAInstallPrompt } from "@/app/_components/PWAInstallPrompt";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Restivo — The Restaurant Operating System",
  description: "Create your menu, design your tables, manage reservations, and deliver a better dining experience — all from one beautifully connected platform.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/VisualIdentity/AppIcon.png",
    apple: "/VisualIdentity/AppIcon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Restivo",
  },
};

export const viewport: Viewport = {
  themeColor: "#B55234",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF7F2] text-[#1A1A1A]">
        {/* Enregistrement du Service Worker PWA pour l'installation native */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
        <AuthProvider>{children}</AuthProvider>
        <PWAInstallPrompt />
        {/* Modèle Viewer Google auto-hébergé localement dans /public/vendor pour fonctionner 100% Hors-Ligne */}
        <Script
          type="module"
          src="/vendor/model-viewer.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
