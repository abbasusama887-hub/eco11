"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/app/components/Logo";
import { useCart } from "@/app/context/CartContext";
import { useAuth } from "@/app/context/AuthContext";
import { useWishlist } from "@/app/context/WishlistContext";


function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h2l1.6 10.6a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 2-1.6L21 9H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="21" r="1.4" fill="currentColor" />
      <circle cx="17" cy="21" r="1.4" fill="currentColor" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8h14v12H5zM8 8V6a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4.8 20c1.3-3.4 4-5.2 7.2-5.2s5.9 1.8 7.2 5.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C12 21 3 14.5 3 8.5A5 5 0 0 1 12 5.3 5 5 0 0 1 21 8.5C21 14.5 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Avatar circle showing the first letter of the user's name */
function Avatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white select-none"
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { itemCount } = useCart();
  const { user, isLoggedIn, logout } = useAuth();
  const { itemCount: wishlistCount } = useWishlist();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleLogout() {
    setUserMenuOpen(false);
    setMenuOpen(false);
    logout();
    router.push("/");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 bg-[#FFFFFF] px-2 pt-2 sm:px-3">
      <div
        className={`flex h-14 w-full items-center justify-between rounded-2xl border px-3 text-slate-950 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 sm:px-5 ${
          isScrolled
            ? "border-slate-300/80 bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-3xl"
            : "border-white/70 bg-white/75 shadow-[0_8px_24px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl"
        }`}
      >
        <Logo className="[&>span]:!text-slate-950" />


        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Search */}
          <Link
            href="/shop"
            aria-label="Search products"
            className="group hidden rounded-xl p-2 text-slate-700 transition-all duration-200 hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-[0_0_18px_rgba(34,211,238,0.18)] sm:inline-flex"
          >
            <SearchIcon />
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="relative hidden rounded-xl p-2 text-slate-700 transition-all duration-200 hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-[0_0_18px_rgba(34,211,238,0.18)] sm:inline-flex"
          >
            <WishlistIcon />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Auth area — desktop */}
          {isLoggedIn && user ? (
            <div ref={userMenuRef} className="relative hidden sm:block">
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-transparent p-1 pr-3 text-sm font-medium text-slate-900 transition-all duration-200 hover:border-slate-200 hover:bg-slate-100 hover:text-black"
              >
                <Avatar name={user.name} />
                <span className="hidden max-w-[90px] truncate lg:block">{user.name}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 text-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {user.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {user.email || user.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    <LogoutIcon />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white/45 px-3 py-2 text-sm font-medium text-slate-900 transition-all duration-200 hover:border-cyan-300/50 hover:bg-cyan-50 hover:text-cyan-700 sm:flex"
            >
              <UserIcon />
              <span>Sign in</span>
            </Link>
          )}

          {/* Cart */}
          {isLoggedIn && (
            <Link href="/orders" aria-label="Orders" className="relative hidden rounded-xl p-2 text-slate-700 transition-all duration-200 hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-[0_0_18px_rgba(34,211,238,0.18)] sm:inline-flex">
              <OrdersIcon />
            </Link>
          )}
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative rounded-xl p-2 text-slate-700 transition-all duration-200 hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-[0_0_18px_rgba(34,211,238,0.18)]"
          >
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-1 inline-flex rounded-xl p-2 text-slate-700 transition-all duration-200 hover:bg-cyan-50 hover:text-cyan-700 md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
            <nav className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 text-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.18)] backdrop-blur-2xl md:hidden">
          <div className="flex animate-[fade-in_180ms_ease-out] flex-col gap-1 px-3 py-3">
            <div className="mt-1 border-t border-slate-200 pt-2">
              {isLoggedIn && user ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                    <Avatar name={user.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {user.email || user.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    <LogoutIcon />
                    Sign out
                  </button>
                  <Link href="/orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 hover:text-cyan-700">
                    <OrdersIcon />
                    Orders
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 hover:text-cyan-700"
                  >
                    <UserIcon />
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-50 px-3 py-2.5 text-sm font-medium text-cyan-800 transition-colors hover:bg-cyan-100"
                  >
                    Create account
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 hover:text-cyan-700"
                  >
                    <WishlistIcon />
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
