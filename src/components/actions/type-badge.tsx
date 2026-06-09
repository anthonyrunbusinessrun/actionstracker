"use client";

import { cn } from "@/lib/utils";
import { TYPE_COLORS } from "@/lib/constants";

interface TypeBadgeProps {
  type: string | null | undefined;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  if (!type) return null;
  
  const colorClass = TYPE_COLORS[type] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
      colorClass,
      className
    )}>
      {type}
    </span>
  );
}
