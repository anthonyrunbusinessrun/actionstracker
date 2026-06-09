"use client";

import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type ActionStatus } from "@/lib/constants";

interface StatusBadgeProps {
  status: ActionStatus | string | null | undefined;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  if (!status) return null;
  
  const config = STATUS_CONFIG[status as ActionStatus];
  if (!config) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        className
      )}>
        {showDot && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
        {status}
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
      config.bg,
      config.color,
      className
    )}>
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", config.dot)} />}
      {config.label}
    </span>
  );
}
