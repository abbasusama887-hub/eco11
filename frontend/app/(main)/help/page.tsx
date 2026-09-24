import Link from "next/link";

const FAQS = [
  ["How do I track an order?", "Open Account settings or Orders, then choose View order to see the latest tracking status."],
  ["How long does delivery take?", "Delivery estimates are shown as 3-5 business days unless the order details provide a more specific update."],
  ["Can I return or cancel an order?", "Cancellation is available only while the order is within its eligible cancellation window. Contact support for return guidance."],
  ["What payment methods are available?", "The current checkout supports Cash on Delivery. Payment options shown at checkout are the authoritative options."],
];

export default function HelpPage() {
  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-10 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <header><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Customer care</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Help center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Answers for orders, delivery, returns, and payments, with direct support when you need it.</p></header>
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-7"><h2 className="text-lg font-bold">Frequently asked questions</h2><div className="mt-4 space-y-2">{FAQS.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-slate-200 px-4 py-3 dark:border-white/10"><summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 group-open:text-cyan-700 dark:text-white dark:group-open:text-cyan-300">{question}<span className="float-right text-slate-400">+</span></summary><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{answer}</p></details>)}</div></section>
          <aside className="space-y-4"><div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6"><h2 className="font-bold">Contact support</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">For order-specific help, include your order number when contacting us.</p><div className="mt-5 space-y-2"><a href="https://wa.me/923047345026" target="_blank" rel="noreferrer" className="block rounded-xl bg-cyan-500 px-4 py-3 text-center text-sm font-bold text-slate-950">WhatsApp: 03047345026</a><a href="mailto:usama.developer.500@gmail.com" className="block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700 dark:border-white/10 dark:text-slate-200">Email support</a></div></div><div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-6"><h2 className="font-bold">Quick links</h2><div className="mt-4 space-y-3 text-sm font-semibold"><Link href="/orders" className="block text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">Order help</Link><Link href="/shop" className="block text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">Shipping help</Link><Link href="/account" className="block text-cyan-700 hover:text-cyan-500 dark:text-cyan-300">Account settings</Link></div></div></aside>
        </div>
      </div>
    </main>
  );
}
