"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Moon, Sun, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const qc = useQueryClient();

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.result) {
        toast.success(`Synced: ${data.result.created} new, ${data.result.updated} updated`, { duration: 4000 });
      }
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
        </div>
      </div>

      {/* Global search */}
      <form onSubmit={e => { e.preventDefault(); if (q) router.push(`/actions?q=${encodeURIComponent(q)}`); }} className="relative hidden md:block w-64">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search actions…"
          className="h-8 pl-8 text-xs"
        />
      </form>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={handleSync} disabled={syncing} title="Pull sync from Airtable">
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>
        <Button variant="ghost" size="icon-sm"><Bell className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}
