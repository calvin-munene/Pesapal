import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Key, Globe, Info, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  async function testCredentials() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiRequest("GET", "/api/pesapal/test-credentials");
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Pesapal integration configuration</p>
      </div>

      <div className="glass rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
            <Key className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">API Credentials</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Stored securely as environment secrets</p>
          </div>
        </div>

        <div className="glass-pill rounded-2xl divide-y divide-white/30 dark:divide-white/10">
          <Item label="Consumer Key" sub="PESAPAL_CONSUMER_KEY" right="••••••••" />
          <Item label="Consumer Secret" sub="PESAPAL_CONSUMER_SECRET" right="••••••••" />
          <Item label="Environment" sub="PESAPAL_ENV" right={
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Production
            </span>
          } />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={testCredentials}
            disabled={testing}
            data-testid="button-test-credentials"
            className="liquid-button rounded-full px-5 h-11 inline-flex items-center gap-2 text-sm font-semibold disabled:opacity-70"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Test connection
          </button>
          {testResult && (
            <div className={cn(
              "flex items-center gap-2 text-sm font-semibold",
              testResult.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )} data-testid="text-test-result">
              {testResult.success ? <CheckCircle2 className="w-4.5 h-4.5" /> : <XCircle className="w-4.5 h-4.5" />}
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Globe className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">API Endpoints</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pesapal v3 endpoints in use</p>
          </div>
        </div>
        <div className="glass-pill rounded-2xl divide-y divide-white/30 dark:divide-white/10">
          <Item label="Production" sub="Live Pesapal v3" right={<code className="text-[11px] font-mono text-slate-600 dark:text-slate-300">pay.pesapal.com/v3</code>} />
          <Item label="Sandbox" sub="Test Pesapal v3" right={<code className="text-[11px] font-mono text-slate-600 dark:text-slate-300">cybqa.pesapal.com/pesapalv3</code>} />
          <Item label="IPN Callback" sub="Receives webhooks" right={<code className="text-[11px] font-mono text-slate-600 dark:text-slate-300">/api/pesapal/ipn</code>} />
        </div>
      </div>

      <div className="glass-pill rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-700 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">Your credentials are safe</p>
          <p className="mt-1">Keys are stored as encrypted environment secrets and never sent to the browser.</p>
        </div>
      </div>
    </div>
  );
}

function Item({ label, sub, right }: { label: string; sub: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</p>
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  );
}
