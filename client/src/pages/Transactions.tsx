import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CreditCard, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200" },
    PENDING: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    FAILED: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
    INVALID: { label: "Invalid", className: "bg-slate-100 text-slate-600 border-slate-200" },
    REVERSED: { label: "Reversed", className: "bg-orange-50 text-orange-700 border-orange-200" },
  };
  const cfg = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
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
      toast({ title: "Status refreshed", description: "Transaction status has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to check status", description: err.message, variant: "destructive" });
    },
  });

  const filters = ["ALL", "PENDING", "COMPLETED", "FAILED"];

  const filtered = filter === "ALL" ? transactions : transactions.filter((t) => t.status === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500 mt-1">{transactions.length} total transaction{transactions.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" className="gap-2 border-slate-200" onClick={() => refetch()} data-testid="button-refresh">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`filter-${f.toLowerCase()}`}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {f === "ALL" ? `All (${transactions.length})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${transactions.filter((t) => t.status === f).length})`}
          </button>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Loading transactions...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">No transactions found</p>
              <p className="text-xs text-slate-400">Try a different filter or initiate a new payment</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide rounded-t-xl">
                <span>Customer</span>
                <span>Reference</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <div key={tx.id} className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center gap-2 md:gap-4 px-6 py-4" data-testid={`row-transaction-${tx.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {tx.firstName[0]}{tx.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{tx.firstName} {tx.lastName}</p>
                        <p className="text-xs text-slate-400 truncate">{tx.email}</p>
                        <p className="text-xs text-slate-300 md:hidden">{format(new Date(tx.createdAt), "MMM d, yyyy HH:mm")}</p>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-500 whitespace-nowrap">{tx.merchantReference}</div>
                    <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {tx.currency} {tx.amount.toLocaleString()}
                    </div>
                    <StatusBadge status={tx.status} />
                    <div className="flex items-center gap-2">
                      {tx.orderTrackingId && tx.status === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs border-slate-200 gap-1"
                          onClick={() => checkStatus.mutate(tx.orderTrackingId!)}
                          disabled={checkStatus.isPending}
                          data-testid={`button-check-status-${tx.id}`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Check
                        </Button>
                      )}
                      {tx.pesapalPaymentUrl && tx.status === "PENDING" && (
                        <a href={tx.pesapalPaymentUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            Pay
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
