import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CreditCard, Loader2, AlertCircle, CheckCircle2, Phone, Mail, User, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  amount: z.string().min(1, "Amount is required").refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be a positive number"),
  currency: z.string().default("KES"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Pay() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"form" | "redirect">("form");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [orderTrackingId, setOrderTrackingId] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { currency: "KES" } });

  const amount = watch("amount");

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/pesapal/initiate", {
        ...data,
        amount: Number(data.amount),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        setPaymentUrl(data.redirectUrl);
        setOrderTrackingId(data.orderTrackingId);
        setStep("redirect");
      }
    },
    onError: (err: Error) => {
      toast({
        title: "Payment failed to initiate",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (step === "redirect") {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card className="border-slate-200 shadow-sm text-center">
          <CardContent className="p-10 space-y-5">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900">Payment Ready</h2>
              <p className="text-sm text-slate-500 mt-2">
                Your order has been submitted. Click below to proceed to the Pesapal payment page.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-semibold text-slate-800">KES {Number(amount).toLocaleString()}</span>
              </div>
              {orderTrackingId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tracking ID</span>
                  <span className="font-mono text-xs text-slate-700 break-all">{orderTrackingId}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2 shadow-sm" data-testid="button-proceed-payment">
                  <CreditCard className="w-4 h-4" />
                  Proceed to Payment
                </Button>
              </a>
              <Button variant="outline" onClick={() => { setStep("form"); navigate("/transactions"); }} className="w-full">
                View Transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Initiate Payment</h1>
        <p className="text-sm text-slate-500 mt-1">Send a Pesapal payment request</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CreditCard className="w-4.5 h-4.5 text-blue-600" />
            Payment Details
          </CardTitle>
          <CardDescription className="text-xs">The customer will receive a prompt on their phone to confirm.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-medium text-slate-700">Amount (KES)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="0.00"
                  className="pl-9 border-slate-200 focus:border-blue-500"
                  {...register("amount")}
                  data-testid="input-amount"
                />
              </div>
              {errors.amount && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.amount.message}</p>}
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <Input id="firstName" placeholder="John" className="pl-9 border-slate-200 focus:border-blue-500" {...register("firstName")} data-testid="input-first-name" />
                </div>
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name</Label>
                <Input id="lastName" placeholder="Doe" className="border-slate-200 focus:border-blue-500" {...register("lastName")} data-testid="input-last-name" />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input id="email" type="email" placeholder="john@example.com" className="pl-9 border-slate-200 focus:border-blue-500" {...register("email")} data-testid="input-email" />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone <span className="text-slate-400 font-normal">(optional)</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input id="phone" placeholder="254712345678" className="pl-9 border-slate-200 focus:border-blue-500" {...register("phone")} data-testid="input-phone" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input id="description" placeholder="Payment for services..." className="border-slate-200 focus:border-blue-500" {...register("description")} data-testid="input-description" />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 shadow-sm font-semibold mt-2 gap-2"
              disabled={mutation.isPending}
              data-testid="button-submit-payment"
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Initiating...</>
              ) : (
                <><CreditCard className="w-4 h-4" />Pay KES {Number(amount || 0).toLocaleString()}</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
