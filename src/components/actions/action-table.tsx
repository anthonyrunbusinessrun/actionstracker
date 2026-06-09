"use client";

import { useState } from "react";
import { MoreHorizontal, ExternalLink, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./status-badge";
import { TypeBadge } from "./type-badge";
import { formatDate, formatRelativeTime, isOverdue, isDueToday, cn } from "@/lib/utils";
import { ALL_STATUSES, STATUS_CONFIG } from "@/lib/constants";
import type { Action } from "@/types/action";

interface Props {
  actions: Action[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export function ActionTable({ actions, isLoading, onRowClick, onStatusChange }: Props) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg w-full" />
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <div className="text-4xl mb-3">◻️</div>
        <p className="text-sm font-medium">No actions found</p>
        <p className="text-xs mt-1">Adjust filters or create a new action</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-24">Code</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Title</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-32 hidden md:table-cell">Status</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-28 hidden lg:table-cell">Type</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-28 hidden xl:table-cell">Due</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-28 hidden xl:table-cell">Updated</th>
          <th className="w-10"></th>
        </tr>
      </thead>
      <tbody>
        {actions.map(action => {
          const overdue = action.accrueDate ? isOverdue(action.accrueDate) && !["ARCHIVE","SCRAPPED"].includes(action.status ?? "") : false;
          const today = action.accrueDate ? isDueToday(action.accrueDate) : false;

          return (
            <tr
              key={action.id}
              className={cn(
                "border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors group",
                hoveredRow === action.id ? "bg-slate-50 dark:bg-slate-800/40" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
              )}
              onMouseEnter={() => setHoveredRow(action.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onClick={() => onRowClick(action.id)}
            >
              {/* Code */}
              <td className="px-4 py-3">
                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  {action.code ?? `#${action.sequenceNo}`}
                </span>
              </td>

              {/* Title */}
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-slate-900 dark:text-slate-100 leading-tight line-clamp-1">
                    {action.title}
                  </span>
                  {action.contextTags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {action.contextTags.slice(0,3).map(tag => (
                        <span key={tag} className="text-[10px] text-slate-400 dark:text-slate-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3 hidden md:table-cell" onClick={e => e.stopPropagation()}>
                <StatusDropdown
                  currentStatus={action.status}
                  onChange={status => onStatusChange(action.id, status)}
                />
              </td>

              {/* Type */}
              <td className="px-4 py-3 hidden lg:table-cell">
                <TypeBadge type={action.actionType} />
              </td>

              {/* Due date */}
              <td className="px-4 py-3 hidden xl:table-cell">
                {action.accrueDate ? (
                  <span className={cn(
                    "text-xs",
                    overdue ? "text-red-600 dark:text-red-400 font-medium" :
                    today   ? "text-amber-600 dark:text-amber-400 font-medium" :
                              "text-slate-500 dark:text-slate-400"
                  )}>
                    {overdue ? "⚠ " : today ? "● " : ""}
                    {formatDate(action.accrueDate)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                )}
              </td>

              {/* Updated */}
              <td className="px-4 py-3 hidden xl:table-cell">
                <span className="text-xs text-slate-400">{formatRelativeTime(action.updatedAt)}</span>
              </td>

              {/* Actions menu */}
              <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                <RowMenu actionId={action.id} onOpen={() => onRowClick(action.id)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function StatusDropdown({ currentStatus, onChange }: { currentStatus: string | null; onChange: (s: string) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="focus:outline-none">
          <StatusBadge status={currentStatus} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-xl p-1 dark:border-slate-700 dark:bg-slate-900"
          sideOffset={4}
        >
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <DropdownMenu.Item
                key={s}
                onSelect={() => onChange(s)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer outline-none",
                  "hover:bg-slate-100 dark:hover:bg-slate-800",
                  currentStatus === s && "bg-slate-50 dark:bg-slate-800 font-medium"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                {cfg.label}
                {currentStatus === s && <span className="ml-auto text-blue-500">✓</span>}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function RowMenu({ actionId, onOpen }: { actionId: string; onOpen: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="invisible group-hover:visible p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="z-50 min-w-[140px] rounded-xl border border-slate-200 bg-white shadow-xl p-1 dark:border-slate-700 dark:bg-slate-900" sideOffset={4}>
          <DropdownMenu.Item
            onSelect={onOpen}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer outline-none hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Pencil className="h-3.5 w-3.5" /> Open / Edit
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
