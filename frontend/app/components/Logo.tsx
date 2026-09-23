import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 ${className}`}
      aria-label="NDPS Store — home"
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 32 32"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="9" className="fill-blue-600" />
        <path
          d="M9 22V10H13.2L22 22V10"
          stroke="white"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        NDPS
      </span>
    </Link>
  );
}