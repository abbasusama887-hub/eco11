"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function StoreChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isOrderRoute = pathname === "/orders" || pathname.startsWith("/orders/");

  if (isOrderRoute) return <>{children}</>;

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col bg-white pt-16 dark:bg-zinc-950">{children}</div>
      <Footer />
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-10px_25px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {[
            { href: "/", label: "Home", icon: HomeIcon },
            { href: "/shop", label: "Shop", icon: ShopIcon },
            { href: "/wishlist", label: "Wishlist", icon: WishlistNavIcon },
            { href: "/cart", label: "Cart", icon: CartNavIcon },
            { href: "/login", label: "Account", icon: AccountIcon },
          ].map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={label} href={href} className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-medium transition-colors ${isActive ? "bg-cyan-50 text-cyan-700" : "text-slate-600"}`}>
                <Icon active={isActive} />
                <span className="mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-7H9v7H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShopIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8h16l-1 12H5L4 8Zm3-4h10l1 4H6l1-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WishlistNavIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} aria-hidden="true">
      <path d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 5.3 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CartNavIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h2l1.5 10.5a2 2 0 0 0 2 1.7h7.4a2 2 0 0 0 2-1.6L20.5 8H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1" fill="currentColor" />
      <circle cx="17" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19c1.7-3.2 4.3-4.8 7-4.8S17.3 15.8 19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
