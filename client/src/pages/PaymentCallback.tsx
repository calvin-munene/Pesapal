import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle2, XCircle, Clock, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

type PayStatus = "loading" | "COMPLETED" | "PENDING" | "FAILED" | "INVALID";

export default function PaymentCallback() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const orderTrackingId = params.get("OrderTrackingId") || params.get("orderTrackingId");
  const merchantRef = params.get("OrderMerchantReference") || params.get("merchantReference");

  const [status, setStatus] = useState<PayStatus>("loading");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!orderTrackingId) {
      setStatus("FAILED");
      return;
    }

    apiRequest("GET", `/api/pesapal/status/${orderTrackingId}`)
      .then((r) => r.json())
      .then((data) => {
        const s = (data.paymentStatusDescription || "FAILED").toUpperCase();
        setStatus(s as PayStatus);
        setDetails(data);
      })
      .catch(() => setStatus("FAILED"));
  }, [orderTrackingId]);

  const iconMap: Record<PayStatus, React.ReactNode> = {
    loading: <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />,
    COMPLETED: <CheckCircle2 className="w-10 h-10 text-green-500" />,
    PENDING: <Clock className="w-10 h-10 text-yellow-500" />,
    FAILED: <XCircle className="w-10 h-10 text-red-500" />,
    INVALID: <XCircle className="w-10 h-10 text-red-500" />,
  };

  const titleMap: Record<PayStatus, string> = {
    loading: "Verifying Payment...",
    COMPLETED: "Payment Successful!",
    PENDING: "Payment Pending",
    FAILED: "Payment Failed",
    INVALID: "Payment Invalid",
  };

  const msgMap: Record<PayStatus, string> = {
    loading: "Please wait while we confirm your transaction.",
    COMPLETED: "Your payment has been confirmed and processed successfully.",
    PENDING: "Your payment is being processed. We'll confirm shortly.",
    FAILED: "Your payment could not be processed. Please try again.",
    INVALID: "This transaction appears to be invalid or expired.",
  };

  const bgMap: Record<PayStatus, string> = {
    loading: "bg-blue-50",
    COMPLETED: "bg-green-50",
    PENDING: "bg-yellow-50",
    FAILED: "bg-red-50",
    INVALID: "bg-red-50",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg overflow-hidden">
        <div className={`${bgMap[status]} flex flex-col items-center justify-center px-8 py-10 text-center`}>
          <div className="mb-4">{iconMap[status]}</div>
          <h1 className="text-xl font-display font-bold text-slate-900">{titleMap[status]}</h1>
          <p className="text-sm text-slate-600 mt-2">{msgMap[status]}</p>
        </div>
        <CardContent className="p-6 space-y-4">
          {(orderTrackingId || merchantRef) && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
              {merchantRef && (
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-mono text-slate-700 text-xs">{merchantRef}</span>
                </div>
              )}
              {orderTrackingId && (
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Tracking ID</span>
                  <span className="font-mono text-slate-700 text-xs">{orderTrackingId}</span>
                </div>
              )}
              {details?.amount && (
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-semibold text-slate-800">{details.currency} {Number(details.amount).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link href="/transactions">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm gap-2" data-testid="button-view-transactions">
                View Transactions
              </Button>
            </Link>
            <Link href="/pay">
              <Button variant="outline" className="w-full border-slate-200 gap-2">
                <ArrowLeft className="w-4 h-4" />
                New Payment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
