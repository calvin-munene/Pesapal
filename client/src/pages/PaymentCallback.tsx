import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, XCircle, Clock, Loader2, ArrowLeft, Wallet, Sparkles, Receipt } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type PayStatus = "loading" | "COMPLETED" | "PENDING" | "FAILED" | "INVALID" | "REVERSED";

const KNOWN_STATUSES: PayStatus[] = ["loading", "COMPLETED", "PENDING", "FAILED", "INVALID", "REVERSED"];

function normalizeStatus(raw: string | undefined | null): PayStatus {
  if (!raw) return "PENDING";
  const upper = raw.toUpperCase();
  if (KNOWN_STATUSES.includes(upper as PayStatus)) return upper as PayStatus;
  if (upper.includes("COMPLETE")) return "COMPLETED";
  if (upper.includes("PEND")) return "PENDING";
  if (upper.includes("FAIL")) return "FAILED";
  if (upper.includes("INVALID")) return "INVALID";
  if (upper.includes("REVERS")) return "REVERSED";
  return "PENDING";
}

export default function PaymentCallback() {
  const params = new URLSearchParams(window.location.search);
  const orderTrackingId = params.get("OrderTrackingId") || params.get("orderTrackingId");
  const merchantRef = params.get("OrderMerchantReference") || params.get("merchantReference");

  const [status, setStatus] = useState<PayStatus>("loading");
  const [details, setDetails] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!orderTrackingId) {
      setStatus("FAILED");
      return;
    }
    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      try {
        const r = await apiRequest("GET", `/api/pesapal/status/${orderTrackingId}`);
        const data = await r.json();
        if (cancelled) return;
        const s = normalizeStatus(data.paymentStatusDescription);
        setStatus(s);
        setDetails(data);
        attempts += 1;
        setPollCount(attempts);
        // Keep polling if still pending, max 8 attempts (24s)
        if (s === "PENDING" && attempts < 8) {
          setTimeout(check, 3000);
        }
      } catch {
        if (cancelled) return;
        attempts += 1;
        if (attempts < 4) {
          setTimeout(check, 3000);
        } else {
          setStatus("FAILED");
        }
      }
    };

    check();
    return () => { cancelled = true; };
  }, [orderTrackingId]);

  const config: Record<PayStatus, { title: string; msg: string; gradient: string; ring: string; icon: React.ReactNode; emoji: string }> = {
    loading: {
      title: "Confirming your payment",
      msg: "Hang tight — we're checking with Pesapal in real time.",
      gradient: "from-violet-400 to-fuchsia-600",
      ring: "shadow-fuchsia-500/40",
      icon: <Loader2 className="w-14 h-14 text-white animate-spin" strokeWidth={2.5} />,
      emoji: "✨",
    },
    COMPLETED: {
      title: "Payment successful!",
      msg: "Your payment was received and confirmed. A receipt is available below.",
      gradient: "from-emerald-400 to-green-600",
      ring: "shadow-emerald-500/40",
      icon: <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />,
      emoji: "🎉",
    },
    PENDING: {
      title: "Payment processing",
      msg: "Your payment is on its way. We'll update this page as soon as it confirms.",
      gradient: "from-amber-400 to-orange-500",
      ring: "shadow-amber-500/40",
      icon: <Clock className="w-14 h-14 text-white" strokeWidth={2.5} />,
      emoji: "⏳",
    },
    FAILED: {
      title: "Payment unsuccessful",
      msg: "Something went wrong and the payment didn't go through. You can safely try again.",
      gradient: "from-rose-400 to-red-600",
      ring: "shadow-red-500/40",
      icon: <XCircle className="w-14 h-14 text-white" strokeWidth={2.5} />,
      emoji: "😕",
    },
    INVALID: {
      title: "Invalid transaction",
      msg: "This payment couldn't be verified. Please start a new payment to continue.",
      gradient: "from-rose-400 to-red-600",
      ring: "shadow-red-500/40",
      icon: <XCircle className="w-14 h-14 text-white" strokeWidth={2.5} />,
      emoji: "⚠️",
    },
    REVERSED: {
      title: "Payment reversed",
      msg: "This payment was reversed. If you believe this is a mistake, please contact support.",
      gradient: "from-slate-400 to-slate-600",
      ring: "shadow-slate-500/40",
      icon: <XCircle className="w-14 h-14 text-white" strokeWidth={2.5} />,
      emoji: "↩️",
    },
  };

  const c = config[status] || config.PENDING;
  const isSuccess = status === "COMPLETED";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute top-6 left-6 z-10">
        <Link href="/" data-testid="link-back-home" className="glass-pill rounded-full px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Wallet className="w-4 h-4" />
          PayFlow
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Confetti / sparkle for success */}
        {isSuccess && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <Sparkles
                key={i}
                className="absolute text-fuchsia-400/60 animate-pulse"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${12 + Math.random() * 16}px`,
                  height: `${12 + Math.random() * 16}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1.5 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="glass-strong rounded-3xl overflow-hidden">
          {/* Hero with status */}
          <div className="relative px-8 pt-10 pb-8 text-center">
            <div className="relative w-28 h-28 mx-auto mb-5">
              {isSuccess && (
                <div className={cn("absolute inset-0 rounded-full bg-gradient-to-br pulse-ring", c.gradient)} />
              )}
              <div className={cn(
                "relative w-28 h-28 rounded-full bg-gradient-to-br flex items-center justify-center shadow-2xl floating",
                c.gradient, c.ring
              )}>
                {c.icon}
              </div>
            </div>

            <div className="text-3xl mb-1" aria-hidden>{c.emoji}</div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              {c.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 max-w-sm mx-auto leading-relaxed">
              {c.msg}
            </p>

            {status === "PENDING" && pollCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 glass-pill rounded-full px-3 py-1 text-xs text-slate-600 dark:text-slate-300">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking… ({pollCount}/8)
              </div>
            )}
          </div>

          {/* Receipt */}
          {(orderTrackingId || merchantRef || details?.amount) && (
            <div className="px-6 pb-6">
              <div className="glass-pill rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                  <Receipt className="w-3.5 h-3.5" />
                  Receipt
                </div>
                {details?.amount > 0 && (
                  <Row label="Amount" value={`${details.currency || "KES"} ${Number(details.amount).toLocaleString()}`} highlight />
                )}
                {details?.paymentMethod && (
                  <Row label="Method" value={details.paymentMethod} />
                )}
                {merchantRef && (
                  <Row label="Reference" value={merchantRef} mono />
                )}
                {orderTrackingId && (
                  <Row label="Tracking ID" value={`${orderTrackingId.slice(0, 8)}…${orderTrackingId.slice(-6)}`} mono />
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pb-8 flex flex-col gap-3">
            {isSuccess ? (
              <>
                <Link href="/" data-testid="button-done" className="liquid-button w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2">
                  Done
                </Link>
                <Link href="/transactions" data-testid="button-view-transactions" className="glass-pill w-full h-12 rounded-2xl font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  View all transactions
                </Link>
              </>
            ) : status === "PENDING" || status === "loading" ? (
              <>
                <Link href="/transactions" data-testid="button-view-transactions" className="liquid-button w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2">
                  Track in transactions
                </Link>
                <Link href="/" data-testid="button-back-home" className="glass-pill w-full h-12 rounded-2xl font-semibold text-sm text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </Link>
              </>
            ) : (
              <>
                <Link href="/" data-testid="button-try-again" className="liquid-button w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2">
                  Try again
                </Link>
                <Link href="/transactions" data-testid="button-view-transactions" className="glass-pill w-full h-12 rounded-2xl font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  View transactions
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className={cn(
        "text-right",
        mono && "font-mono text-xs",
        highlight ? "text-lg font-bold text-slate-900 dark:text-white" : "text-sm font-semibold text-slate-800 dark:text-slate-100"
      )}>{value}</span>
    </div>
  );
}
