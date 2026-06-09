"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare, AlertCircle, Clock, TrendingUp,
  Zap, CalendarClock, RefreshCw, BarChart2,
} from "lucide-react";
import { StatCard } from "./stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/actions/status-badge";
import { TypeBadge } from "@/components/actions/type-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface DashStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number;
  statusDistribution: Record<string, number>;
  typeDistribution: { type: string; count: number }[];
  recentActions: {
    id: string; title: string; code: string | null;
    status: string | null; actionType: string | null;
    accrueDate: string | null; updatedAt: string;
  }[];
}

const STATUS_CHART_COLORS: Record<string, string> = {
  NOW: "#10b981", PRIORITY: "#f59e0b", QUEUE: "#3b82f6",
  SCHEDULED: "#06b6d4", WAITING_FOR: "#f97316", REVIEW: "#94a3b8",
  PROBLEM: "#ef4444", DELEGATE: "#8b5cf6", ONGOING: "#60a5fa",
  ARCHIVE: "#cbd5e1", TENTATIVE: "#fb923c", SNOOZED: "#14b8a6",
};

export function DashboardContent() {
  const { data, isLoading, error } = useQuery<DashStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard").then(r => r.json()),
    refetchInterval: 30_000, // poll every 30s
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <p className="text-red-500">Failed to load dashboard.</p>;

  // Prepare chart data
  const statusChartData = Object.entries(data.statusDistribution)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([k, v]) => ({
      name: STATUS_CONFIG[k as keyof typeof STATUS_CONFIG]?.label ?? k,
      value: v,
      color: STATUS_CHART_COLORS[k] ?? "#94a3b8",
    }));

  const typeChartData = data.typeDistribution
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Actions" value={data.total}        icon={CheckSquare}  color="default" />
        <StatCard label="Active"        value={data.active}       icon={Zap}          color="blue"    />
        <StatCard label="Overdue"       value={data.overdue}      icon={AlertCircle}  color="red"     />
        <StatCard label="Due Today"     value={data.dueToday}     icon={CalendarClock}color="amber"   />
        <StatCard label="This Week"     value={data.dueThisWeek}  icon={Clock}        color="default" />
        <StatCard label="Completion"    value={`${data.completionRate}%`} icon={TrendingUp} color="green" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Status Distribution — pie */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-slate-400" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [v, "Actions"]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Distribution — bar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-slate-400" />
              Actions by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeChartData} layout="vertical" margin={{ left: 60, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={55} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-slate-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentActions.map(action => (
              <a
                key={action.id}
                href={`/actions/${action.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {action.code && (
                      <span className="text-[10px] font-mono text-slate-400">{action.code}</span>
                    )}
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {action.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {action.status   && <StatusBadge status={action.status} />}
                    {action.actionType && <TypeBadge type={action.actionType} />}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{formatRelativeTime(action.updatedAt)}</p>
                  {action.accrueDate && (
                    <p className="text-[10px] text-slate-300 dark:text-slate-600">{formatDate(action.accrueDate)}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-5 gap-4">
        <Skeleton className="col-span-2 h-64 rounded-xl" />
        <Skeleton className="col-span-3 h-64 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
