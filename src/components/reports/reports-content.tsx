"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, BarChart3, TrendingUp, Calendar, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_CONFIG } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";

interface DashStats {
  total: number; active: number; completed: number; overdue: number;
  completionRate: number; statusDistribution: Record<string, number>;
  typeDistribution: { type: string; count: number }[];
  recentActions: { id: string; title: string; status: string | null; actionType: string | null; accrueDate: string | null; updatedAt: string }[];
}

export function ReportsContent() {
  const { data, isLoading } = useQuery<DashStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard").then(r => r.json()),
  });

  const { data: actionsData } = useQuery<{ actions: { id:string;title:string;status:string|null;actionType:string|null;accrueDate:string|null;createdAt:string;contextTags:string[] }[] }>({
    queryKey: ["actions-all-report"],
    queryFn: () => fetch("/api/actions?limit=200&sortBy=createdAt&sortDir=asc").then(r => r.json()),
  });

  async function exportCSV() {
    const res = await fetch("/api/actions?limit=2000");
    const data = await res.json();
    const actions = data.actions ?? [];

    const headers = ["Code","Title","Status","Type","Due Date","Context Tags","WBS","Stage","Created","Updated"];
    const rows = actions.map((a: any) => [
      a.code ?? "",
      `"${(a.title ?? "").replace(/"/g, '""')}"`,
      a.status ?? "",
      a.actionType ?? "",
      a.accrueDate ? formatDate(a.accrueDate) : "",
      (a.contextTags ?? []).join(";"),
      a.wbs ?? "",
      a.stage ?? "",
      formatDate(a.createdAt),
      formatDate(a.updatedAt),
    ]);

    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `boss-actions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  // Build monthly creation chart from actions
  const monthlyData = (() => {
    const actions = actionsData?.actions ?? [];
    const map = new Map<string, number>();
    for (const a of actions) {
      if (!a.createdAt) continue;
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month: month.slice(5) + "/" + month.slice(2,4), count }));
  })();

  const statusChartData = Object.entries(data?.statusDistribution ?? {})
    .filter(([,v]) => v > 0)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 12)
    .map(([k,v]) => ({
      name: STATUS_CONFIG[k as keyof typeof STATUS_CONFIG]?.label ?? k,
      count: v,
    }));

  if (isLoading) return (
    <div className="space-y-4">
      {Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Export toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Analytics Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">Based on {data?.total?.toLocaleString()} total actions</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Actions", value: data?.total ?? 0, color: "text-slate-900 dark:text-white" },
          { label: "Active", value: data?.active ?? 0, color: "text-blue-600 dark:text-blue-400" },
          { label: "Overdue", value: data?.overdue ?? 0, color: "text-red-600 dark:text-red-400" },
          { label: "Completion Rate", value: `${data?.completionRate ?? 0}%`, color: "text-emerald-600 dark:text-emerald-400" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold tabular-nums", kpi.color)}>{typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}</p>
              <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly creations */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              Actions Created (Monthly)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="Actions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusChartData} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0,4,4,0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Type breakdown */}
      {(data?.typeDistribution?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-slate-400" />
              Top Action Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data!.typeDistribution.slice(0,8)} layout="vertical" margin={{ left: 70 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={65} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0,4,4,0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
