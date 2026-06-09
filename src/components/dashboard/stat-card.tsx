"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "default" | "green" | "amber" | "red" | "blue";
  className?: string;
}

const colorMap = {
  default: {
    icon: "text-slate-500 bg-slate-100 dark:bg-slate-800",
    value: "text-slate-900 dark:text-white",
  },
  green: {
    icon: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
    value: "text-emerald-700 dark:text-emerald-400",
  },
  amber: {
    icon: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
    value: "text-amber-700 dark:text-amber-400",
  },
  red: {
    icon: "text-red-600 bg-red-50 dark:bg-red-950/50",
    value: "text-red-700 dark:text-red-400",
  },
  blue: {
    icon: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
    value: "text-blue-700 dark:text-blue-400",
  },
};

export function StatCard({ label, value, icon: Icon, trend, color = "default", className }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {label}
            </p>
            <p className={cn("mt-1.5 text-2xl font-bold tabular-nums", colors.value)}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {trend && (
              <p className={cn(
                "mt-1 text-xs",
                trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", colors.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
