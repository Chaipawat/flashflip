import type { Metadata } from "next";
import { Noto_Sans_Thai_Looped, Nunito } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai_Looped({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlashFlip",
  description: "ฝึกจำคำศัพท์ภาษาอังกฤษ เก่งขึ้นอีกนิดทุกวัน",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${nunito.variable} ${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppProvider>{children}</AppProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
