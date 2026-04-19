import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Settings2, CheckCircle2, XCircle, Loader2, Key, Globe, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  async function testCredentials() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiRequest("GET", "/api/pesapal/test-credentials");
      const data = await res.json();
      setTestResult({ success: true, message: data.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  }

  const env = import.meta.env.VITE_PESAPAL_ENV || "sandbox";
  const isSandbox = env !== "production";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Pesapal integration configuration</p>
      </div>

      {/* Credentials Info */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Key className="w-4.5 h-4.5 text-blue-600" />
            API Credentials
          </CardTitle>
          <CardDescription className="text-xs">
            Credentials are configured as environment secrets and are not exposed here for security.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-200">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Consumer Key</p>
                <p className="text-xs text-slate-400">PESAPAL_CONSUMER_KEY</p>
              </div>
              <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded">••••••••</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Consumer Secret</p>
                <p className="text-xs text-slate-400">PESAPAL_CONSUMER_SECRET</p>
              </div>
              <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded">••••••••</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Environment</p>
                <p className="text-xs text-slate-400">PESAPAL_ENV</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isSandbox ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                {isSandbox ? "Sandbox" : "Production"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-semibold">How to configure your keys</p>
              <p>Go to the <strong>Secrets</strong> tab in Replit and add:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><code className="font-mono bg-blue-100 px-1 rounded">PESAPAL_CONSUMER_KEY</code></li>
                <li><code className="font-mono bg-blue-100 px-1 rounded">PESAPAL_CONSUMER_SECRET</code></li>
                <li><code className="font-mono bg-blue-100 px-1 rounded">PESAPAL_ENV</code> — set to <code className="font-mono bg-blue-100 px-1 rounded">production</code> for live payments, or leave blank for sandbox</li>
              </ul>
            </div>
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-200 gap-2"
              onClick={testCredentials}
              disabled={testing}
              data-testid="button-test-credentials"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              Test Connection
            </Button>
            {testResult && (
              <div className={`flex items-center gap-2 text-sm font-medium ${testResult.success ? "text-green-600" : "text-red-600"}`}>
                {testResult.success
                  ? <CheckCircle2 className="w-4.5 h-4.5" />
                  : <XCircle className="w-4.5 h-4.5" />
                }
                {testResult.message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pesapal endpoints */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="w-4.5 h-4.5 text-blue-600" />
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-200 text-sm">
            <div className="px-4 py-3">
              <p className="font-medium text-slate-700">Sandbox</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">https://cybqa.pesapal.com/pesapalv3</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-medium text-slate-700">Production</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">https://pay.pesapal.com/v3</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-medium text-slate-700">IPN Callback</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">/api/pesapal/ipn</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
