import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
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
  icons: {
    icon: "/VisualIdentity/AppIcon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF7F2] text-[#1A1A1A]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
