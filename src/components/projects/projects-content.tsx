"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderOpen, CheckSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/actions/status-badge";
import { cn } from "@/lib/utils";

interface FolioWithActions {
  id: string;
  name: string;
  narrative: string | null;
  _count: { actions: number };
  actions: {
    id: string; title: string; code: string | null;
    status: string | null; accrueDate: string | null;
  }[];
}

export function ProjectsContent() {
  const { data, isLoading } = useQuery<{ folios: FolioWithActions[] }>({
    queryKey: ["folios"],
    queryFn: () => fetch("/api/projects").then(r => r.json()),
  });

  const folios = data?.folios ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  if (!folios.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">No projects yet</p>
        <p className="text-xs mt-1">Projects (Folios) are synced from Airtable. Run a sync to load them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {folios.map(folio => {
          const total = folio._count.actions;
          const archived = folio.actions.filter(a => ["ARCHIVE","SCRAPPED"].includes(a.status ?? "")).length;
          const pct = total > 0 ? Math.round((archived / total) * 100) : 0;
          return (
            <Card key={folio.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{folio.name}</span>
                </CardTitle>
                {folio.narrative && (
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{folio.narrative}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500">{archived}/{total} complete</span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {folio.actions.slice(0, 3).map(a => (
                    <div key={a.id} className="flex items-center gap-2">
                      {a.status && <StatusBadge status={a.status} showDot />}
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{a.title}</p>
                    </div>
                  ))}
                  {total > 3 && (
                    <p className="text-[11px] text-slate-400">+{total - 3} more actions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
