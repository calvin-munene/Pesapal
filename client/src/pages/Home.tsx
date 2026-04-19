import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Smartphone, CreditCard, Globe, Building2,
  Loader2, AlertCircle, CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Required"),
  amount: z.string().min(1, "Required").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be positive"),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const methods = [
  { id: "mpesa", name: "M-Pesa", desc: "Mobile money", icon: Smartphone, gradient: "from-emerald-400 to-green-600" },
  { id: "card", name: "Card", desc: "Visa & Mastercard", icon: CreditCard, gradient: "from-sky-400 to-blue-600" },
  { id: "airtel", name: "Airtel Money", desc: "Mobile money", icon: Smartphone, gradient: "from-rose-400 to-red-600" },
  { id: "bank", name: "Bank", desc: "Direct transfer", icon: Building2, gradient: "from-amber-400 to-orange-600" },
] as const;

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000];

export default function Home() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<string>("mpesa");
  const [step, setStep] = useState<"method" | "details" | "ready">("method");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [orderTrackingId, setOrderTrackingId] = useState("");

  const {
    register, handleSubmit, formState: { errors }, watch, setValue,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const amount = watch("amount");

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/pesapal/initiate", {
        ...data,
        amount: Number(data.amount),
        paymentMethod: selected.name,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        setPaymentUrl(data.redirectUrl);
        setOrderTrackingId(data.orderTrackingId);
        setStep("ready");
      } else {
        toast({ title: "Could not start payment", description: data.message || "Try again", variant: "destructive" });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Payment failed to initiate", description: err.message, variant: "destructive" });
    },
  });

  const selected = methods.find((m) => m.id === selectedMethod)!;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <section className="text-center mb-8 mt-2 sm:mt-6">
        <div className="inline-flex items-center gap-2 glass-pill rounded-full px-4 py-1.5 mb-5">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Live · Pesapal Production</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
          Pay anyone.{" "}
          <span className="text-gradient">Anywhere.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mt-4 max-w-xl mx-auto">
          Choose how you'd like to pay. We'll take care of the rest with a fast, secure checkout.
        </p>
      </section>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT: Method picker + summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">Payment method</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Tap to select</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {methods.map((m) => {
                const Icon = m.icon;
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setSelectedMethod(m.id); if (step === "method") setStep("details"); }}
                    data-testid={`button-method-${m.id}`}
                    className={cn(
                      "liquid-method rounded-2xl p-4 text-left",
                      active && "selected"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br shadow-md", m.gradient)}>
                      <Icon className="w-5 h-5 text-white" strokeWidth={2.4} />
                    </div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-5 border-t border-white/30 dark:border-white/10">
              <div className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p>Your details are protected by Pesapal's PCI-DSS Level 1 secure infrastructure.</p>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300 mt-2">
                <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p>Most payments confirm within seconds. You'll see the result instantly here.</p>
              </div>
            </div>
          </div>

          {/* Live summary */}
          <div className="glass rounded-3xl p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Summary</h3>
            <div className="space-y-2.5 text-sm">
              <Row label="Method" value={selected.name} />
              <Row label="Currency" value="KES" />
              <Row label="Amount" value={amount ? `KES ${Number(amount).toLocaleString()}` : "—"} bold />
            </div>
          </div>
        </div>

        {/* RIGHT: Form OR Ready state */}
        <div className="lg:col-span-3">
          <div className="glass-strong rounded-3xl p-6 sm:p-8">
            {step === "ready" ? (
              <ReadyState
                amount={amount}
                method={selected.name}
                paymentUrl={paymentUrl}
                orderTrackingId={orderTrackingId}
                onNew={() => { setStep("details"); setPaymentUrl(""); setOrderTrackingId(""); }}
                onView={() => navigate("/transactions")}
              />
            ) : (
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Pay with {selected.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Enter the amount and your details to continue.</p>
                  </div>
                  <div className={cn("hidden sm:flex w-12 h-12 rounded-2xl items-center justify-center bg-gradient-to-br shadow-md", selected.gradient)}>
                    <selected.icon className="w-6 h-6 text-white" strokeWidth={2.4} />
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">KES</span>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      className="liquid-input h-16 pl-16 text-3xl font-bold tracking-tight rounded-2xl"
                      {...register("amount")}
                      data-testid="input-amount"
                    />
                  </div>
                  {errors.amount && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.amount.message}</p>}

                  {/* Quick amounts */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {QUICK_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setValue("amount", String(a), { shouldValidate: true })}
                        className="glass-pill rounded-full px-3.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:scale-105 transition"
                        data-testid={`button-quick-${a}`}
                      >
                        KES {a.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="First name" id="firstName" placeholder="John" register={register("firstName")} error={errors.firstName?.message} testid="input-first-name" />
                  <Field label="Last name" id="lastName" placeholder="Doe" register={register("lastName")} error={errors.lastName?.message} testid="input-last-name" />
                </div>
                <Field label="Email" id="email" type="email" placeholder="you@example.com" register={register("email")} error={errors.email?.message} testid="input-email" />
                <Field label="Phone" id="phone" placeholder="2547XXXXXXXX" register={register("phone")} error={errors.phone?.message} testid="input-phone" />
                <Field label="Description (optional)" id="description" placeholder="What's this payment for?" register={register("description")} testid="input-description" />

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-pay"
                  className="liquid-button w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {mutation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Preparing your payment…</>
                  ) : (
                    <>Continue to pay {amount ? `KES ${Number(amount).toLocaleString()}` : ""}<ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={cn("text-slate-900 dark:text-white", bold ? "font-bold text-base" : "font-medium")}>{value}</span>
    </div>
  );
}

function Field({ label, id, placeholder, register, error, type = "text", testid }: any) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} className="liquid-input h-12 rounded-xl" {...register} data-testid={testid} />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function ReadyState({ amount, method, paymentUrl, orderTrackingId, onNew, onView }: any) {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 pulse-ring" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/40">
          <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">Ready to pay</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Tap below to open the secure Pesapal checkout for your <span className="font-semibold">{method}</span> payment.</p>
      </div>
      <div className="glass-pill rounded-2xl p-5 text-left space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Amount</span>
          <span className="font-bold text-slate-900 dark:text-white">KES {Number(amount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Method</span>
          <span className="font-semibold text-slate-900 dark:text-white">{method}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Reference</span>
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all">{orderTrackingId.slice(0, 16)}…</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <a
          href={paymentUrl}
          rel="noopener noreferrer"
          data-testid="link-pesapal-checkout"
          className="liquid-button w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
        >
          <Globe className="w-5 h-5" />
          Open Pesapal Checkout
        </a>
        <div className="flex gap-3">
          <button onClick={onView} className="flex-1 glass-pill rounded-2xl h-12 font-semibold text-sm text-slate-700 dark:text-slate-200" data-testid="button-view-tx">
            View Transactions
          </button>
          <button onClick={onNew} className="flex-1 glass-pill rounded-2xl h-12 font-semibold text-sm text-slate-700 dark:text-slate-200" data-testid="button-new-payment">
            New Payment
          </button>
        </div>
      </div>
    </div>
  );
}
