import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 ${className}`}
      aria-label="Bazar Store — home"
    >
      <img
        src="/logo.jpg"
        alt="Bazar Store logo"
        width={34}
        height={34}
        className="h-8 w-8 shrink-0 rounded-lg object-cover"
      />
      <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        bazar
      </span>
    </Link>
  );
}