"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, CheckSquare, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/actions/status-badge";
import { formatDate, formatRelativeTime, cn, initials } from "@/lib/utils";
import type { Action } from "@/types/action";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  _count: { actionsAssigned: number; actionsQA: number; actionsPOC: number };
}

export function TeamContent() {
  const { data: membersData, isLoading: loadingMembers } = useQuery<{ members: TeamMember[] }>({
    queryKey: ["team-members"],
    queryFn: () => fetch("/api/team").then(r => r.json()),
  });

  const { data: actionsData, isLoading: loadingActions } = useQuery<{ actions: Action[]; pagination: { total: number } }>({
    queryKey: ["actions", "limit=200&sortBy=accrueDate&sortDir=asc"],
    queryFn: () => fetch("/api/actions?limit=200&sortBy=accrueDate&sortDir=asc").then(r => r.json()),
  });

  const members = membersData?.members ?? [];
  const actions = actionsData?.actions ?? [];

  // Group actions by assignee
  const byAssignee = new Map<string, Action[]>();
  for (const action of actions) {
    for (const a of action.assignees ?? []) {
      const key = a.user.id;
      if (!byAssignee.has(key)) byAssignee.set(key, []);
      byAssignee.get(key)!.push(action);
    }
  }

  // Unassigned
  const unassigned = actions.filter(a => !a.assignees?.length);

  if (loadingMembers || loadingActions) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Team Members</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{members.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Actions</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{actions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Unassigned</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{unassigned.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
              <Clock className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Assigned</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{actions.length - unassigned.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team member cards */}
      {members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map(member => {
            const memberActions = byAssignee.get(member.id) ?? [];
            const active = memberActions.filter(a => !["ARCHIVE","SCRAPPED"].includes(a.status ?? ""));
            const overdue = active.filter(a => a.accrueDate && new Date(a.accrueDate) < new Date());
            return (
              <MemberCard
                key={member.id}
                member={member}
                actions={memberActions}
                activeCount={active.length}
                overdueCount={overdue.length}
              />
            );
          })}
        </div>
      ) : (
        /* No team members in DB yet — show action-based view */
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            All Actions <span className="text-xs font-normal text-slate-400 ml-1">(sync to populate team view)</span>
          </h2>
          <Card>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {actions.slice(0, 20).map(action => (
                <a key={action.id} href={`/actions?q=${encodeURIComponent(action.title)}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {action.code && <span className="font-mono text-[10px] text-slate-400">{action.code}</span>}
                      <p className="text-sm text-slate-800 dark:text-slate-200 truncate">{action.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {action.status && <StatusBadge status={action.status} />}
                    {action.accrueDate && <span className="text-xs text-slate-400">{formatDate(action.accrueDate)}</span>}
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, actions, activeCount, overdueCount }: {
  member: TeamMember;
  actions: Action[];
  activeCount: number;
  overdueCount: number;
}) {
  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    EXECUTIVE:   "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    MANAGER:     "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    TEAM_LEAD:   "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    EMPLOYEE:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    VIEWER:      "bg-slate-100 text-slate-500",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
            "bg-gradient-to-br from-slate-700 to-slate-900 text-white"
          )}>
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
            ) : initials(member.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{member.name}</p>
            <p className="text-xs text-slate-400 truncate">{member.email}</p>
            <span className={cn("inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full", roleColors[member.role] ?? roleColors.EMPLOYEE)}>
              {member.role.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{actions.length}</p>
            <p className="text-[10px] text-slate-400">Total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{activeCount}</p>
            <p className="text-[10px] text-slate-400">Active</p>
          </div>
          <div className={cn("text-center p-2 rounded-lg", overdueCount > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-slate-50 dark:bg-slate-800/50")}>
            <p className={cn("text-lg font-bold", overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400")}>{overdueCount}</p>
            <p className="text-[10px] text-slate-400">Overdue</p>
          </div>
        </div>

        {/* Recent actions */}
        <div className="space-y-1.5">
          {actions.slice(0, 3).map(a => (
            <div key={a.id} className="flex items-center gap-2 py-1">
              {a.status && <StatusBadge status={a.status} showDot />}
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">{a.title}</p>
            </div>
          ))}
          {actions.length > 3 && (
            <p className="text-[11px] text-slate-400 pl-1">+{actions.length - 3} more</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
