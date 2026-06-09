"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./status-badge";
import { TypeBadge } from "./type-badge";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import { ALL_STATUSES, STATUS_CONFIG } from "@/lib/constants";
import type { Action } from "@/types/action";

interface Props {
  actions: Action[];
  isLoading: boolean;
  onCardClick: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

// Kanban only shows the "working" statuses
const KANBAN_COLS = ["NOW","PRIORITY","QUEUE","SCHEDULED","WAITING_FOR","REVIEW","PROBLEM","DELEGATE","ONGOING"] as const;

export function ActionKanban({ actions, isLoading, onCardClick, onStatusChange }: Props) {
  const byStatus = useMemo(() => {
    const map: Record<string, Action[]> = {};
    for (const col of KANBAN_COLS) map[col] = [];
    for (const action of actions) {
      const s = action.status ?? "QUEUE";
      if (s in map) map[s].push(action);
      else map["QUEUE"].push(action);
    }
    return map;
  }, [actions]);

  if (isLoading) {
    return (
      <div className="flex gap-3 p-4 overflow-x-auto h-full">
        {KANBAN_COLS.map(col => (
          <div key={col} className="flex-shrink-0 w-64">
            <Skeleton className="h-6 w-32 mb-3 rounded" />
            {Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-24 mb-2 rounded-xl" />)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 p-4 overflow-x-auto h-full items-start">
      {KANBAN_COLS.map(col => {
        const cfg = STATUS_CONFIG[col];
        const items = byStatus[col] ?? [];
        return (
          <div key={col} className="flex-shrink-0 w-[260px]">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{cfg.label}</span>
              <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5">
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 h-16 flex items-center justify-center">
                  <span className="text-[11px] text-slate-300 dark:text-slate-700">Empty</span>
                </div>
              )}
              {items.map(action => (
                <KanbanCard
                  key={action.id}
                  action={action}
                  onClick={() => onCardClick(action.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ action, onClick }: { action: Action; onClick: () => void }) {
  const overdue = action.accrueDate ? isOverdue(action.accrueDate) && !["ARCHIVE","SCRAPPED"].includes(action.status ?? "") : false;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-white dark:bg-slate-900 p-3 cursor-pointer transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        overdue
          ? "border-red-200 dark:border-red-900/50"
          : "border-slate-200 dark:border-slate-800"
      )}
    >
      {action.code && (
        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 block mb-1">
          {action.code}
        </span>
      )}
      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 mb-2">
        {action.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {action.actionType && <TypeBadge type={action.actionType} />}
        {action.accrueDate && (
          <span className={cn(
            "text-[10px]",
            overdue ? "text-red-500 font-medium" : "text-slate-400"
          )}>
            {overdue ? "⚠ " : ""}{formatDate(action.accrueDate)}
          </span>
        )}
      </div>
      {action.contextTags.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {action.contextTags.slice(0,3).map(tag => (
            <span key={tag} className="text-[9px] text-slate-400"># {tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
