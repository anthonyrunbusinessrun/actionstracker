import { Header } from "@/components/layout/header";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" />
      <div className="flex-1 p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Airtable Connection</h2>
            <p className="text-xs text-slate-500 mb-3">Connected to BOSS base (app8QxH2cjt0fueuW) · Actions table</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">Connected · Bidirectional sync enabled</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Environment</h2>
            <div className="space-y-2 text-xs text-slate-500">
              <p>Set these in your Railway (or .env) environment variables:</p>
              <code className="block bg-slate-50 dark:bg-slate-800 rounded-lg p-3 font-mono text-[11px] leading-relaxed">
                DATABASE_URL=postgresql://...<br/>
                AIRTABLE_API_KEY=patXXXXXX<br/>
                BETTER_AUTH_SECRET=...<br/>
                NEXT_PUBLIC_APP_URL=https://...
              </code>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
