import { useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function PesapalPayment() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !email || !firstName || !lastName) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call to Pesapal
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Initiating Payment",
        description: `Connecting to Pesapal for KES ${amount}...`,
      });
      // In a real app, this is where we'd redirect to the Pesapal iframe URL
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl border-slate-200 overflow-hidden">
        <div className="bg-blue-600 h-2 w-full"></div>
        <CardHeader className="space-y-1 text-center pb-6 pt-8">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-sm border border-blue-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Secure Checkout</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Pay safely via Pesapal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePayment} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-700 font-semibold text-sm">Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-500 font-bold">KES</span>
                <Input 
                  id="amount" 
                  type="number" 
                  min="1"
                  placeholder="0.00" 
                  className="pl-14 h-12 text-lg font-medium bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all shadow-sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700 font-medium text-sm">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="John" 
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-700 font-medium text-sm">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Doe" 
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john@example.com" 
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all mt-6 font-semibold text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pay KES {amount || "0.00"}
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-100 pt-5 pb-5 bg-slate-50/80 rounded-b-xl mt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Payments processed securely by Pesapal
          </div>
        </CardFooter>
      </Card>
      
      <div className="mt-8 text-center text-sm text-slate-400 max-w-xs">
        <p>This is a frontend mockup. Real payment processing requires a backend integration.</p>
      </div>
    </div>
  );
}
