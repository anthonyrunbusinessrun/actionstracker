"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X, ExternalLink, Trash2, Save, RotateCcw, Calendar,
  Clock, Tag, FileText, MapPin, User, MessageSquare,
  Paperclip, History, ChevronDown, Check, Edit3, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./status-badge";
import { TypeBadge } from "./type-badge";
import { formatDate, formatDateTime, formatRelativeTime, cn } from "@/lib/utils";
import { ALL_STATUSES, STATUS_CONFIG, ACTION_TYPES, CONTEXT_TAGS } from "@/lib/constants";
import type { Action, ActivityLogEntry } from "@/types/action";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface Props {
  actionId: string | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function ActionDrawer({ actionId, open, onClose, onDelete }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState<Partial<Action>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"details"|"comments"|"activity">("details");

  // Fetch action
  const { data: action, isLoading } = useQuery<Action>({
    queryKey: ["action", actionId],
    queryFn: () => fetch(`/api/actions/${actionId}`).then(r => r.json()),
    enabled: !!actionId && open,
    refetchOnWindowFocus: false,
  });

  // Reset dirty state when action changes
  useEffect(() => {
    setDirty({});
    setEditing(false);
  }, [actionId]);

  // Save mutation (writes to Airtable + local DB)
  const saveMutation = useMutation({
    mutationFn: async (changes: Partial<Action>) => {
      setSaving(true);
      const res = await fetch(`/api/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action", actionId] });
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setDirty({});
      setEditing(false);
      toast.success("Saved to Airtable ✓");
    },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
    onSettled: () => setSaving(false),
  });

  // Quick status change (no edit mode needed)
  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      fetch(`/api/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action", actionId] });
      qc.invalidateQueries({ queryKey: ["actions"] });
      toast.success("Status updated in Airtable ✓");
    },
    onError: () => toast.error("Failed to update status"),
  });

  function patch<K extends keyof Action>(key: K, val: Action[K]) {
    setDirty(d => ({ ...d, [key]: val }));
    setEditing(true);
  }

  const current = action ? { ...action, ...dirty } : null;
  const hasDirty = Object.keys(dirty).length > 0;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col",
        "bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800",
        "transform transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5">
          {current?.code && (
            <span className="font-mono text-xs text-slate-400 shrink-0">{current.code}</span>
          )}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <Skeleton className="h-5 w-64" />
            ) : (
              <span className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                {current?.title ?? "Action"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {hasDirty && (
              <>
                <Button size="sm" variant="ghost" onClick={() => { setDirty({}); setEditing(false); }}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Discard
                </Button>
                <Button size="sm" onClick={() => saveMutation.mutate(dirty)} loading={saving}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              </>
            )}
            {action?.airtableId && (
              <a
                href={`https://airtable.com/${action.airtableId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                title="Open in Airtable"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={() => { if (action && window.confirm("Delete this action?")) onDelete(action.id); }}
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5">
          {(["details","comments","activity"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-1 py-2.5 mr-5 text-xs font-medium border-b-2 transition-colors capitalize",
                tab === t
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {t}
              {t === "comments" && action?._count?.comments && action._count.comments > 0 && (
                <span className="ml-1.5 text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                  {action._count.comments}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-5 space-y-4">
              {Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : current ? (
            tab === "details" ? (
              <DetailsTab action={current} onPatch={patch} onStatusChange={s => statusMutation.mutate(s)} />
            ) : tab === "comments" ? (
              <CommentsTab action={current} actionId={actionId!} />
            ) : (
              <ActivityTab action={current} />
            )
          ) : null}
        </div>

        {/* Sync indicator */}
        {current?.airtableId && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-slate-400">
              Synced with Airtable · Updated {formatRelativeTime(current.airtableUpdatedAt)}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Details Tab ─────────────────────────────────────────────
function DetailsTab({
  action,
  onPatch,
  onStatusChange,
}: {
  action: Action;
  onPatch: <K extends keyof Action>(k: K, v: Action[K]) => void;
  onStatusChange: (s: string) => void;
}) {
  return (
    <div className="p-5 space-y-5">
      {/* Title */}
      <Field label="Title" icon={<Edit3 className="h-3.5 w-3.5" />}>
        <input
          className={cn(
            "w-full text-sm font-medium text-slate-900 dark:text-white bg-transparent",
            "border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700",
            "focus:border-blue-500 focus:outline-none py-1 transition-colors"
          )}
          value={action.title}
          onChange={e => onPatch("title", e.target.value)}
        />
      </Field>

      {/* Status + Type row */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          <StatusDropdown status={action.status} onChange={onStatusChange} />
        </Field>
        <Field label="Type">
          <TypeDropdown type={action.actionType} onChange={v => onPatch("actionType", v)} />
        </Field>
      </div>

      {/* Date row */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Due Date" icon={<Calendar className="h-3.5 w-3.5" />}>
          <input
            type="date"
            className="text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none py-1 w-full transition-colors"
            value={action.accrueDate ? action.accrueDate.split("T")[0] : ""}
            onChange={e => onPatch("accrueDate", e.target.value || null)}
          />
        </Field>
        <Field label="Stage">
          <input
            className="text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none py-1 w-full transition-colors"
            value={action.stage ?? ""}
            onChange={e => onPatch("stage", e.target.value || null)}
            placeholder="e.g. (1) Phase I"
          />
        </Field>
      </div>

      {/* Start / End */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start" icon={<Clock className="h-3.5 w-3.5" />}>
          <input
            type="datetime-local"
            className="text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none py-1 w-full transition-colors"
            value={action.startAt ? action.startAt.slice(0,16) : ""}
            onChange={e => onPatch("startAt", e.target.value || null)}
          />
        </Field>
        <Field label="End">
          <input
            type="datetime-local"
            className="text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none py-1 w-full transition-colors"
            value={action.endAt ? action.endAt.slice(0,16) : ""}
            onChange={e => onPatch("endAt", e.target.value || null)}
          />
        </Field>
      </div>

      {/* WBS */}
      <Field label="WBS Code">
        <input
          className="text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none py-1 w-full font-mono transition-colors"
          value={action.wbs ?? ""}
          onChange={e => onPatch("wbs", e.target.value || null)}
          placeholder="Work breakdown code"
        />
      </Field>

      {/* Context Tags */}
      <Field label="Context" icon={<Tag className="h-3.5 w-3.5" />}>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {CONTEXT_TAGS.map(tag => {
            const active = action.contextTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => {
                  const next = active
                    ? action.contextTags.filter(t => t !== tag)
                    : [...action.contextTags, tag];
                  onPatch("contextTags", next);
                }}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border",
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Brief */}
      <Field label="Brief" icon={<FileText className="h-3.5 w-3.5" />}>
        <textarea
          className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 resize-none focus:border-blue-500 focus:outline-none transition-colors hover:border-slate-300 dark:hover:border-slate-600 mt-1"
          rows={4}
          value={action.brief ?? ""}
          onChange={e => onPatch("brief", e.target.value || null)}
          placeholder="Action brief…"
        />
      </Field>

      {/* Business Terms */}
      <Field label="Business Terms">
        <textarea
          className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 resize-none focus:border-blue-500 focus:outline-none transition-colors hover:border-slate-300 dark:hover:border-slate-600 mt-1"
          rows={3}
          value={action.businessTerms ?? ""}
          onChange={e => onPatch("businessTerms", e.target.value || null)}
          placeholder="Business terms…"
        />
      </Field>

      {/* Place / Period of Performance */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Place of Perform" icon={<MapPin className="h-3.5 w-3.5" />}>
          <input
            className="text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none py-1 w-full transition-colors"
            value={action.placeOfPerform ?? ""}
            onChange={e => onPatch("placeOfPerform", e.target.value || null)}
          />
        </Field>
        <Field label="Period of Perform">
          <input
            className="text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:outline-none py-1 w-full transition-colors"
            value={action.periodOfPerform ?? ""}
            onChange={e => onPatch("periodOfPerform", e.target.value || null)}
          />
        </Field>
      </div>

      {/* Folio links (read-only display) */}
      {action.folioLinks && action.folioLinks.length > 0 && (
        <Field label="Projects">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {action.folioLinks.map(fl => (
              <span key={fl.folio.id} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                {fl.folio.name}
              </span>
            ))}
          </div>
        </Field>
      )}

      {/* Attachments (read-only display) */}
      {action.attachments && action.attachments.length > 0 && (
        <Field label="Attachments" icon={<Paperclip className="h-3.5 w-3.5" />}>
          <div className="space-y-1 mt-1">
            {action.attachments.map(att => (
              <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                <Paperclip className="h-3 w-3" />
                {att.fileName}
                {att.fileSize && <span className="text-slate-400">({Math.round(att.fileSize/1024)}KB)</span>}
              </a>
            ))}
          </div>
        </Field>
      )}

      {/* Metadata */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
        {action.createdAt && (
          <p className="text-[11px] text-slate-400">Created {formatDateTime(action.airtableCreatedAt ?? action.createdAt)}</p>
        )}
        {action.airtableUpdatedAt && (
          <p className="text-[11px] text-slate-400">Last modified {formatRelativeTime(action.airtableUpdatedAt)}</p>
        )}
        {action.airtableId && (
          <p className="text-[11px] text-slate-300 dark:text-slate-600 font-mono">ID: {action.airtableId}</p>
        )}
        {action.durationHours != null && !isNaN(action.durationHours) && (
          <p className="text-[11px] text-slate-400">Duration: {action.durationHours}h</p>
        )}
      </div>
    </div>
  );
}

// ─── Comments Tab ─────────────────────────────────────────────
function CommentsTab({ action, actionId }: { action: Action; actionId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const addComment = useMutation({
    mutationFn: () =>
      fetch(`/api/actions/${actionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["action", actionId] });
      setText("");
      toast.success("Comment added");
    },
    onError: () => toast.error("Failed to add comment"),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-5 space-y-4 overflow-y-auto">
        {!action.comments?.length && (
          <p className="text-xs text-slate-400 text-center py-8">No comments yet.</p>
        )}
        {action.comments?.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300">
              {c.author.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{c.author.name}</span>
                <span className="text-[10px] text-slate-400">{formatRelativeTime(c.createdAt)}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 p-4">
        <textarea
          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 resize-none focus:outline-none focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors"
          rows={3}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment…"
        />
        <Button size="sm" className="mt-2" onClick={() => addComment.mutate()} disabled={!text.trim()} loading={addComment.isPending}>
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          Comment
        </Button>
      </div>
    </div>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────
function ActivityTab({ action }: { action: Action }) {
  return (
    <div className="p-5 space-y-3">
      {!action.activityLogs?.length && (
        <p className="text-xs text-slate-400 text-center py-8">No activity logged.</p>
      )}
      {action.activityLogs?.map((log: ActivityLogEntry) => (
        <div key={log.id as string} className="flex gap-3 items-start">
          <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <History className="h-3 w-3 text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium">{(log.user as {name:string}|null)?.name ?? "System"}</span>
              {" "}{eventLabel(log.event as string)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{formatRelativeTime(log.createdAt as string)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function eventLabel(event: string) {
  const map: Record<string,string> = {
    CREATED:        "created this action",
    UPDATED:        "updated this action",
    STATUS_CHANGED: "changed the status",
    ASSIGNED:       "was assigned",
    COMMENTED:      "added a comment",
    ARCHIVED:       "archived this action",
    SYNCED:         "synced from Airtable",
  };
  return map[event] ?? event.toLowerCase().replace("_"," ");
}

// ─── Field wrapper ────────────────────────────────────────────
function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Status dropdown ──────────────────────────────────────────
function StatusDropdown({ status, onChange }: { status: string | null; onChange: (s: string) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 focus:outline-none hover:opacity-80 transition-opacity">
          <StatusBadge status={status} />
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="z-[60] min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-xl p-1 dark:border-slate-700 dark:bg-slate-900" sideOffset={4}>
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <DropdownMenu.Item
                key={s}
                onSelect={() => onChange(s)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer outline-none hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                {cfg.label}
                {status === s && <Check className="ml-auto h-3 w-3 text-blue-500" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Type dropdown ────────────────────────────────────────────
function TypeDropdown({ type, onChange }: { type: string | null; onChange: (v: string | null) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 focus:outline-none hover:opacity-80 transition-opacity">
          <TypeBadge type={type} />
          {!type && <span className="text-xs text-slate-400">None</span>}
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="z-[60] min-w-[160px] max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl p-1 dark:border-slate-700 dark:bg-slate-900" sideOffset={4}>
          <DropdownMenu.Item onSelect={() => onChange(null)} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer outline-none hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="text-slate-400">None</span>
            {!type && <Check className="ml-auto h-3 w-3 text-blue-500" />}
          </DropdownMenu.Item>
          {ACTION_TYPES.map(t => (
            <DropdownMenu.Item key={t} onSelect={() => onChange(t)} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs cursor-pointer outline-none hover:bg-slate-100 dark:hover:bg-slate-800">
              {t}
              {type === t && <Check className="ml-auto h-3 w-3 text-blue-500" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
