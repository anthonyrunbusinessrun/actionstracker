"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Database, CheckCircle, XCircle, Clock, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatRelativeTime, cn } from "@/lib/utils";

interface SyncLog {
  id: string; status: string;
  recordsProcessed: number; recordsCreated: number;
  recordsUpdated: number; recordsSkipped: number;
  errorMessage: string | null; duration: number | null;
  startedAt: string; completedAt: string | null;
}

interface SyncStatus {
  logs: SyncLog[];
  stats: { total: number; synced: number; lastSyncAt: string | null };
}

export function SyncContent() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);

  const { data, isLoading, refetch } = useQuery<SyncStatus>({
    queryKey: ["sync-status"],
    queryFn: () => fetch("/api/sync").then(r => r.json()),
    refetchInterval: running ? 3000 : 15000,
  });

  async function runSync(fullSync = false) {
    setRunning(true);
    const tid = toast.loading(fullSync ? "Running full sync from Airtable…" : "Syncing from Airtable…");
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullSync }),
      });
      const json = await res.json();
      if (json.result) {
        toast.success(
          `Sync complete — ${json.result.created} new, ${json.result.updated} updated, ${json.result.skipped} unchanged`,
          { id: tid, duration: 5000 }
        );
      } else {
        toast.error(json.error ?? "Sync failed", { id: tid });
      }
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["sync-status"] });
      refetch();
    } catch (e) {
      toast.error("Network error during sync", { id: tid });
    } finally {
      setRunning(false);
    }
  }

  const statusIcon = (s: string) => {
    if (s === "SUCCESS") return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (s === "FAILED")  return <XCircle className="h-4 w-4 text-red-500" />;
    if (s === "PARTIAL") return <AlertCircle className="h-4 w-4 text-amber-500" />;
    return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Current state */}
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Database className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Local DB</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{data?.stats.total ?? 0}</p>
                  <p className="text-[10px] text-slate-400">actions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Zap className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-xs text-slate-500">Synced</p>
                  <p className="text-xl font-bold text-emerald-600">{data?.stats.synced ?? 0}</p>
                  <p className="text-[10px] text-slate-400">with Airtable</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Last Sync</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {data?.stats.lastSyncAt ? formatRelativeTime(data.stats.lastSyncAt) : "Never"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-slate-400" />
            Sync Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={() => runSync(false)} disabled={running} loading={running} className="flex-1">
              <RefreshCw className={cn("h-4 w-4 mr-2", running && "animate-spin")} />
              Pull Sync (Airtable → DB)
            </Button>
            <Button variant="outline" onClick={() => runSync(true)} disabled={running}>
              Full Resync
            </Button>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-700 dark:text-slate-300">Pull Sync</strong> fetches all records from your BOSS Airtable base and reconciles with the local database using hash-based change detection — only changed records are written.
              <br /><br />
              <strong className="text-slate-700 dark:text-slate-300">Create / Edit / Delete</strong> operations from the Actions page write to Airtable first, then mirror locally — so your Airtable is always the source of truth.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sync log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sync History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !data?.logs.length ? (
            <p className="text-xs text-slate-400 text-center py-8">No syncs run yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                  {statusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-semibold",
                        log.status === "SUCCESS" ? "text-emerald-600" :
                        log.status === "FAILED"  ? "text-red-600" :
                        log.status === "PARTIAL" ? "text-amber-600" : "text-blue-600"
                      )}>{log.status}</span>
                      {log.duration && <span className="text-[10px] text-slate-400">{(log.duration/1000).toFixed(1)}s</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {log.recordsCreated} new · {log.recordsUpdated} updated · {log.recordsSkipped} unchanged
                      {log.errorMessage && <span className="text-red-400"> · {log.errorMessage}</span>}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{formatRelativeTime(log.startedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Architecture note */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Sync Architecture</p>
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <span className="px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-medium">Airtable</span>
          <span>↔</span>
          <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-medium">Sync Service</span>
          <span>↔</span>
          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">PostgreSQL</span>
          <span>←</span>
          <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium">BOSS App</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">All writes go to Airtable first, then reflect locally. Reads come from the fast local DB.</p>
      </div>
    </div>
  );
}
