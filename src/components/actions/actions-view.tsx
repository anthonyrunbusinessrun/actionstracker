"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Search, Filter, SlidersHorizontal, X, LayoutList, Columns } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActionTable } from "./action-table";
import { ActionKanban } from "./action-kanban";
import { ActionDrawer } from "./action-drawer";
import { NewActionModal } from "./new-action-modal";
import { ALL_STATUSES, ACTION_TYPES, CONTEXT_TAGS, STATUS_CONFIG } from "@/lib/constants";
import type { Action } from "@/types/action";
import { cn } from "@/lib/utils";

type View = "table" | "kanban";

export interface ActionsFilters {
  q: string;
  status: string;
  type: string;
  context: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}

const EMPTY: ActionsFilters = { q:"", status:"", type:"", context:"", sortBy:"accrueDate", sortDir:"desc" };

export function ActionsView() {
  const qc = useQueryClient();
  const [view,       setView]       = useState<View>("table");
  const [filters,    setFilters]    = useState<ActionsFilters>(EMPTY);
  const [page,       setPage]       = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen,    setNewOpen]    = useState(false);
  const [syncing,    setSyncing]    = useState(false);
  const [showFilters,setShowFilters]= useState(false);

  const params = new URLSearchParams({
    page: String(page), limit: "100",
    ...(filters.q       && { q:       filters.q }),
    ...(filters.status  && { status:  filters.status }),
    ...(filters.type    && { type:    filters.type }),
    ...(filters.context && { context: filters.context }),
    sortBy:  filters.sortBy,
    sortDir: filters.sortDir,
  });

  const { data, isLoading, refetch } = useQuery<{ actions: Action[]; pagination: { total:number; pages:number } }>({
    queryKey: ["actions", params.toString()],
    queryFn:  () => fetch(`/api/actions?${params}`).then(r => r.json()),
    refetchInterval: 15_000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/actions/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Action deleted");
      setDrawerOpen(false);
    },
    onError: () => toast.error("Failed to delete action"),
  });

  // Status patch mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.result) {
        toast.success(`Synced — ${data.result.created} new, ${data.result.updated} updated`);
      }
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [qc]);

  const openAction = (id: string) => { setSelectedId(id); setDrawerOpen(true); };
  const onFilter = (key: keyof ActionsFilters, val: string) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };
  const clearFilters = () => { setFilters(EMPTY); setPage(1); };
  const hasFilters = filters.q || filters.status || filters.type || filters.context;

  const total = data?.pagination.total ?? 0;
  const actions = data?.actions ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-5 py-3 bg-white dark:bg-slate-950">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={filters.q}
            onChange={e => onFilter("q", e.target.value)}
            placeholder="Search title, code, brief…"
            className="pl-8 h-8 text-xs"
          />
          {filters.q && (
            <button onClick={() => onFilter("q", "")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filters toggle */}
        <Button variant={showFilters ? "secondary" : "ghost"} size="sm" onClick={() => setShowFilters(v => !v)}>
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filters
          {hasFilters && <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
            {[filters.status, filters.type, filters.context].filter(Boolean).length}
          </span>}
        </Button>

        <div className="flex-1" />

        {/* Total */}
        <span className="text-xs text-slate-400 hidden sm:block">
          {total.toLocaleString()} action{total !== 1 ? "s" : ""}
        </span>

        {/* View toggle */}
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setView("table")}
            className={cn("flex items-center gap-1 px-2 py-1.5 text-xs transition-colors",
              view === "table" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn("flex items-center gap-1 px-2 py-1.5 text-xs transition-colors border-l border-slate-200 dark:border-slate-700",
              view === "kanban" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Columns className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Sort */}
        <Select value={filters.sortBy} onValueChange={v => onFilter("sortBy", v)}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SlidersHorizontal className="h-3 w-3 mr-1.5 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accrueDate">Due Date</SelectItem>
            <SelectItem value="updatedAt">Last Updated</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="code">Code</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        {/* Sync */}
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", syncing && "animate-spin")} />
          Sync
        </Button>

        {/* New */}
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Action
        </Button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 bg-slate-50 dark:bg-slate-900/50 flex-wrap">
          <Select value={filters.status || "all"} onValueChange={v => onFilter("status", v === "all" ? "" : v)}>
            <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                    {STATUS_CONFIG[s].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.type || "all"} onValueChange={v => onFilter("type", v === "all" ? "" : v)}>
            <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.context || "all"} onValueChange={v => onFilter("context", v === "all" ? "" : v)}>
            <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="Context" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contexts</SelectItem>
              {CONTEXT_TAGS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {view === "table" ? (
          <ActionTable
            actions={actions}
            isLoading={isLoading}
            onRowClick={openAction}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          />
        ) : (
          <ActionKanban
            actions={actions}
            isLoading={isLoading}
            onCardClick={openAction}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          />
        )}
      </div>

      {/* Pagination (table view) */}
      {view === "table" && data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-3 bg-white dark:bg-slate-950">
          <span className="text-xs text-slate-400">Page {page} of {data.pagination.pages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p+1)} disabled={page >= data.pagination.pages}>Next</Button>
          </div>
        </div>
      )}

      {/* Action Detail Drawer */}
      <ActionDrawer
        actionId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onDelete={id => deleteMutation.mutate(id)}
      />

      {/* New Action Modal */}
      <NewActionModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["actions"] });
          qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
          setNewOpen(false);
        }}
      />
    </div>
  );
}
