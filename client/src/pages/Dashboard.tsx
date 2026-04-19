import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CreditCard, TrendingUp, CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@shared/schema";
import { format } from "date-fns";

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

export default function Dashboard() {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const completed = transactions.filter((t) => t.status === "COMPLETED");
  const pending = transactions.filter((t) => t.status === "PENDING");
  const failed = transactions.filter((t) => t.status === "FAILED");
  const completedAmount = completed.reduce((s, t) => s + t.amount, 0);

  const recent = transactions.slice(0, 5);

  const stats = [
    {
      label: "Total Volume",
      value: `KES ${total.toLocaleString()}`,
      sub: `${transactions.length} transactions`,
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Completed",
      value: `KES ${completedAmount.toLocaleString()}`,
      sub: `${completed.length} payments`,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Pending",
      value: `${pending.length}`,
      sub: "awaiting confirmation",
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Failed",
      value: `${failed.length}`,
      sub: "need attention",
      icon: AlertCircle,
      color: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of your Pesapal transactions</p>
        </div>
        <Link href="/pay">
          <a>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-sm" data-testid="button-new-payment">
              <CreditCard className="w-4 h-4" />
              New Payment
            </Button>
          </a>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-800">Recent Transactions</CardTitle>
          <Link href="/transactions">
            <a className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">No transactions yet</p>
              <p className="text-xs text-slate-400">Start by initiating a payment</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3.5" data-testid={`row-transaction-${tx.id}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                      {tx.firstName[0]}{tx.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{tx.firstName} {tx.lastName}</p>
                      <p className="text-xs text-slate-400 truncate">{tx.merchantReference}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <StatusBadge status={tx.status} />
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{tx.currency} {tx.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{format(new Date(tx.createdAt), "MMM d, HH:mm")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
