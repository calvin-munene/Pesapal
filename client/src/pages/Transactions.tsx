import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CreditCard, ExternalLink } from "lucide-react";
import type { Transaction } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    FAILED: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    INVALID: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    REVERSED: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm", map[status] || map.PENDING)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function Transactions() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("ALL");

  const { data: transactions = [], isLoading, refetch } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const checkStatus = useMutation({
    mutationFn: async (orderTrackingId: string) => {
      const res = await apiRequest("GET", `/api/pesapal/status/${orderTrackingId}`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({ title: "Status refreshed" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to check status", description: err.message, variant: "destructive" });
    },
  });

  const filters = ["ALL", "PENDING", "COMPLETED", "FAILED"];
  const filtered = filter === "ALL" ? transactions : transactions.filter((t) => t.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{transactions.length} total payment{transactions.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => refetch()} data-testid="button-refresh" className="glass-pill rounded-full px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => {
          const count = f === "ALL" ? transactions.length : transactions.filter((t) => t.status === f).length;
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`filter-${f.toLowerCase()}`}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-all",
                active
                  ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30"
                  : "glass-pill text-slate-700 dark:text-slate-200"
              )}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()} · {count}
            </button>
          );
        })}
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">Loading transactions…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl glass-pill flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No transactions yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Start your first payment from the home page.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/30 dark:divide-white/10">
            {filtered.map((tx) => (
              <div key={tx.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 sm:px-6 py-4" data-testid={`row-transaction-${tx.id}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
                    {tx.firstName[0]}{tx.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{tx.firstName} {tx.lastName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{tx.email} · {format(new Date(tx.createdAt), "MMM d, HH:mm")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-900 dark:text-white whitespace-nowrap">{tx.currency} {tx.amount.toLocaleString()}</div>
                    <div className="text-[10px] font-mono text-slate-400">{tx.merchantReference}</div>
                  </div>
                  <StatusBadge status={tx.status} />
                  <div className="flex items-center gap-1.5">
                    {tx.orderTrackingId && tx.status === "PENDING" && (
                      <button
                        onClick={() => checkStatus.mutate(tx.orderTrackingId!)}
                        disabled={checkStatus.isPending}
                        data-testid={`button-check-status-${tx.id}`}
                        className="glass-pill rounded-full h-8 w-8 inline-flex items-center justify-center text-slate-700 dark:text-slate-200"
                        title="Check status"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", checkStatus.isPending && "animate-spin")} />
                      </button>
                    )}
                    {tx.pesapalPaymentUrl && tx.status === "PENDING" && (
                      <a href={tx.pesapalPaymentUrl} target="_blank" rel="noopener noreferrer" data-testid={`link-pay-${tx.id}`}
                         className="glass-pill rounded-full h-8 w-8 inline-flex items-center justify-center text-slate-700 dark:text-slate-200" title="Open checkout">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
