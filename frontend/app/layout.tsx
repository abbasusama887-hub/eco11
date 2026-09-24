import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/app/context/AuthContext";
import { WishlistProvider } from "@/app/context/WishlistContext";
import { ToastProvider } from "@/app/components/ToastProvider";
import { CompareProvider } from "@/app/context/CompareContext";
import { SavedItemsProvider } from "@/app/context/SavedItemsContext";
import { STORE } from "@/app/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl =
  rawSiteUrl && rawSiteUrl.length > 0
    ? rawSiteUrl.replace(/\/+$/, "")
    : "https://eco11-dun.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: STORE.name,
    template: `%s | ${STORE.name}`,
  },
  description: STORE.description,
  alternates: {
    canonical: `${siteUrl}/`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: STORE.name,
    title: STORE.name,
    description: STORE.description,
    images: [
      {
        url: STORE.logo,
        alt: STORE.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: STORE.name,
    description: STORE.description,
    images: [STORE.logo],
  },
  icons: {
    icon: STORE.logo,
    shortcut: STORE.logo,
    apple: STORE.logo,
  },
};

/**
 * Root layout — provides global fonts, CSS, and context providers only.
 * Header and Footer live in app/(main)/layout.tsx so they are excluded
 * from the (auth) route group (login, signup).
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <ToastProvider>
            <CompareProvider>
              <SavedItemsProvider>
                <WishlistProvider>
                  <CartProvider>{children}</CartProvider>
                </WishlistProvider>
              </SavedItemsProvider>
            </CompareProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
