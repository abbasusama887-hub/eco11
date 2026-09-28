import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/app/context/AuthContext";
import { WishlistProvider } from "@/app/context/WishlistContext";
import { ToastProvider } from "@/app/components/ToastProvider";
import { CompareProvider } from "@/app/context/CompareContext";
import { SavedItemsProvider } from "@/app/context/SavedItemsContext";
import { SITE_URL, STORE } from "@/app/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: STORE.name,
    template: `%s | ${STORE.name}`,
  },
  description: STORE.description,
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "0rmsWMCFb10uoSjGtmuE6AwzvuZuwTZjhmfL0h2HdK4",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/`,
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
