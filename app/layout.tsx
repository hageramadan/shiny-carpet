import type { Metadata } from "next";
import localFont from "next/font/local";
import { StoreProvider } from "@/components/store";
import Navbar from "@/components/layout/Navbar";
import LoadingScreen from "@/components/layout/LoadingScreen";
import AppToaster from "@/components/ui/AppToaster";
import { CartProvider } from "@/components/cart/CartProvider";
import { AddressesProvider } from "@/components/addresses/AddressesProvider";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import Footer from "@/components/layout/Footer";
import { siteUrl } from "@/lib/data";
import "./globals.css";

const cairo = localFont({
  src: [
    { path: "../public/fonts/cairo-regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/cairo-bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/cairo-extra.ttf", weight: "800 900", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shiny Carpet | غسيل السجاد والبطاطين بعناية",
    template: "%s | Shiny Carpet",
  },
  description:
    "عناية تستحقها تفاصيل بيتك. اكتشف خدمات غسيل السجاد والبطاطين من Shiny Carpet، اختر خدمتك وحدد عنوانك وموعد الاستلام بسهولة.",
  applicationName: "Shiny Carpet",
  icons: {
    shortcut: "/icon.svg",
    apple: "/images/logo1.png",
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "Shiny Carpet",
    title: "Shiny Carpet | نظافتهم علينا",
    description: "خدمات غسيل السجاد والبطاطين، من باب بيتك ولحد باب بيتك.",
    images: [
      {
        url: "/images/logo1.png",
        width: 432,
        height: 328,
        alt: "شعار Shiny Carpet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [{ url: "/images/logo1.png", alt: "شعار Shiny Carpet" }],
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className="scroll-smooth scroll-pt-27.5 motion-reduce:scroll-auto selection:bg-[#c5eeeb]"
      lang="ar"
      dir="rtl"
    >
      <body
        id="top"
        className={`${cairo.variable} bg-white pt-16 font-sans text-sm leading-[1.9] text-ink antialiased md:pt-20`}
      >
        <SettingsProvider>
          <StoreProvider>
            <CartProvider>
              <AddressesProvider>
                <AppToaster />
                <LoadingScreen />
                <a
                  href="#main"
                  className="fixed -top-20 right-5 bg-ink text-white z-100 focus:top-2.5 p-3"
                >
                  تخطي إلى المحتوى
                </a>
                <Navbar />
                <main id="main">{children}</main>
                <Footer />
              </AddressesProvider>
            </CartProvider>
          </StoreProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
