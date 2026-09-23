"use client";

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
    </>
  );
}