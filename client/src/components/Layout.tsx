import { Link, useLocation } from "wouter";
import { Home, ReceiptText, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { name: "Home", href: "/", icon: Home },
  { name: "Transactions", href: "/transactions", icon: ReceiptText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Floating glass top nav */}
      <header className="sticky top-0 z-40 px-4 pt-4 pb-2">
        <div className="max-w-6xl mx-auto glass-pill rounded-full flex items-center justify-between pl-4 pr-2 py-2">
          <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-home-logo">
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
              <Wallet className="w-4.5 h-4.5 text-white" strokeWidth={2.4} />
            </div>
            <span className="font-display font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">PayFlow</span>
          </Link>

          <nav className="flex items-center gap-1">
            {nav.map(({ name, href, icon: Icon }) => {
              const active = location === href || (href !== "/" && location.startsWith(href));
              return (
                <Link
                  key={name}
                  href={href}
                  data-testid={`nav-${name.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all",
                    active
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/30"
                      : "text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
                  <span className="hidden sm:inline">{name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-4 pb-12 pt-4">{children}</main>

      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 py-6">
        Powered by <span className="font-semibold">Pesapal</span> · Secure payments
      </footer>
    </div>
  );
}
