import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Transactions from "@/pages/Transactions";
import Settings from "@/pages/Settings";
import PaymentCallback from "@/pages/PaymentCallback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/payment/callback" component={PaymentCallback} />
      <Route>
        {() => (
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/pay" component={Home} />
              <Route path="/transactions" component={Transactions} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
