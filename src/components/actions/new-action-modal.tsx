"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ALL_STATUSES, ACTION_TYPES, CONTEXT_TAGS, STATUS_CONFIG } from "@/lib/constants";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewActionModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    title:       "",
    status:      "QUEUE",
    actionType:  "",
    accrueDate:  "",
    brief:       "",
    wbs:         "",
    stage:       "",
    contextTags: [] as string[],
  });

  const createMutation = useMutation({
    mutationFn: () =>
      fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          accrueDate:  form.accrueDate  || null,
          actionType:  form.actionType  || null,
          wbs:         form.wbs         || null,
          stage:       form.stage       || null,
          brief:       form.brief       || null,
        }),
      }).then(async r => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      }),
    onSuccess: () => {
      toast.success("Action created in Airtable ✓");
      setForm({ title:"", status:"QUEUE", actionType:"", accrueDate:"", brief:"", wbs:"", stage:"", contextTags:[] });
      onCreated();
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const toggle = (tag: string) =>
    setForm(f => ({
      ...f,
      contextTags: f.contextTags.includes(tag)
        ? f.contextTags.filter(t => t !== tag)
        : [...f.contextTags, tag],
    }));

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">New Action</h2>
              <p className="text-xs text-slate-400 mt-0.5">Writes directly to BOSS Airtable</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <div className="p-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Title *</label>
              <Input
                autoFocus
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Action title…"
              />
            </div>

            {/* Status + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Status</label>
                <select
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Type</label>
                <select
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.actionType}
                  onChange={e => setForm(f => ({ ...f, actionType: e.target.value }))}
                >
                  <option value="">— Select type —</option>
                  {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Due date + WBS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Due Date</label>
                <Input type="date" value={form.accrueDate} onChange={e => setForm(f => ({ ...f, accrueDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">WBS Code</label>
                <Input value={form.wbs} onChange={e => setForm(f => ({ ...f, wbs: e.target.value }))} placeholder="WBS code" className="font-mono" />
              </div>
            </div>

            {/* Brief */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Brief</label>
              <textarea
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                rows={3}
                value={form.brief}
                onChange={e => setForm(f => ({ ...f, brief: e.target.value }))}
                placeholder="Brief description…"
              />
            </div>

            {/* Context Tags */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Context Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {CONTEXT_TAGS.map(tag => {
                  const active = form.contextTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggle(tag)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border",
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-5 py-3">
            <p className="text-[11px] text-slate-400">
              Syncs immediately to Airtable
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={!form.title.trim() || createMutation.isPending}
                loading={createMutation.isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Action
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
