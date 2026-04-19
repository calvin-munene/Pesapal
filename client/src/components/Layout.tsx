import { Link, useLocation } from "wouter";
import { LayoutDashboard, CreditCard, ReceiptText, Settings, Wallet, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const nav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Pay", href: "/pay", icon: CreditCard },
  { name: "Transactions", href: "/transactions", icon: ReceiptText },
  { name: "Settings", href: "/settings", icon: Settings },
];

function NavLinks({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {nav.map(({ name, href, icon: Icon }) => {
        const active = location === href || (href !== "/" && location.startsWith(href));
        return (
          <Link
            key={name}
            href={href}
            onClick={onClose}
            data-testid={`nav-${name.toLowerCase()}`}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={active ? 2.5 : 1.8} />
            {name}
          </Link>
        );
      })}
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-white border-r border-slate-200">
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Wallet className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
          </div>
          <span className="font-display font-bold text-slate-900 tracking-tight text-lg">PayFlow</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">AD</div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-none">Admin</p>
              <p className="text-xs text-slate-500 mt-0.5">Pesapal Integration</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl flex flex-col">
            <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Wallet className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-display font-bold text-slate-900 text-lg">PayFlow</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onClose={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900">PayFlow</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
