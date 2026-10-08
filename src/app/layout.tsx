import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai_Looped, Nunito } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai_Looped({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  display: "swap",
  weight: ["400", "600", "700", "800", "900"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "FlashFlip",
  description: "ฝึกจำคำศัพท์ภาษาอังกฤษ พิมพ์คำแล้วเลือกความหมายได้เลย แล้วสุ่มฝึกเฉพาะคำที่ยังจำไม่ได้",
  applicationName: "FlashFlip",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1727" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${nunito.variable} ${notoSansThai.variable} antialiased`}>
      <body>
        <AppProvider>{children}</AppProvider>
        <Toaster position="top-center" duration={2200} visibleToasts={1} toastOptions={{ classNames: { toast: "ff-toast" } }} />
      </body>
    </html>
  );
}
