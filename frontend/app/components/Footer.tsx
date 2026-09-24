import Link from "next/link";
import Logo from "@/app/components/Logo";

const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/shop" },
      { label: "Categories", href: "/shop" },
      { label: "Best Sellers", href: "/shop" },
    ],
  },
  {
    heading: "Categories",
    links: [
      { label: "Running", href: "/shop" },
      { label: "Lifestyle", href: "/shop" },
      { label: "Sneakers", href: "/shop" },
      { label: "Sports", href: "/shop" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "About Us", href: "/" },
      { label: "Contact", href: "mailto:usama.developer.500@gmail.com" },
      { label: "Help Center", href: "/help" },
      { label: "Shipping Policy", href: "/" },
      { label: "Return Policy", href: "/" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/" },
      { label: "Terms", href: "/" },
      { label: "Shipping Policy", href: "/" },
      { label: "Return Policy", href: "/" },
    ],
  },
];

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 4l16 16M20 4L4 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 21v-7h2.5l.5-3H14V9.2c0-.9.3-1.6 1.7-1.6H17V5.1C16.6 5 15.7 5 14.6 5 12.3 5 10.7 6.4 10.7 8.9V11H8v3h2.7v7h3.3z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/80 bg-white/80 text-slate-950 shadow-[0_-18px_48px_rgba(15,23,42,0.1)] backdrop-blur-2xl">
      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 lg:gap-x-16">
          <div className="col-span-2 sm:col-span-1">
            <Logo className="[&>span]:!text-slate-950" />
            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-600">
              Shoes for every step — running, courts, and the street in between.
            </p>
            <div className="mt-6 flex items-center gap-2.5">
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/60 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-[0_8px_24px_rgba(34,211,238,0.14)]"
              >
                <InstagramIcon />
              </a>
              <a
                href="#"
                aria-label="X (Twitter)"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/60 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-[0_8px_24px_rgba(34,211,238,0.14)]"
              >
                <XIcon />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/60 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-50 hover:text-cyan-700 hover:shadow-[0_8px_24px_rgba(34,211,238,0.14)]"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-950">
                {group.heading}
              </h3>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group relative inline-block text-sm leading-6 text-slate-600 transition-colors duration-200 hover:text-cyan-700"
                    >
                      {link.label}
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-cyan-300 transition-all duration-200 group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            © {new Date().getFullYear()} bazar. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 sm:gap-5">
            <Link href="/" className="text-xs text-slate-500 transition-colors hover:text-cyan-700">Privacy Policy</Link>
            <Link href="/" className="text-xs text-slate-500 transition-colors hover:text-cyan-700">Terms</Link>
            <Link href="/" className="text-xs text-slate-500 transition-colors hover:text-cyan-700">Shipping Policy</Link>
            <Link href="/" className="text-xs text-slate-500 transition-colors hover:text-cyan-700">Return Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}