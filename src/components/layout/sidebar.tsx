"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CheckSquare, Users, FolderOpen,
  BarChart3, RefreshCw, Settings, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  {
    label: "PLATFORM",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/actions",   icon: CheckSquare,     label: "Actions"   },
      { href: "/team",      icon: Users,           label: "Team"      },
      { href: "/projects",  icon: FolderOpen,      label: "Projects"  },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { href: "/reports",   icon: BarChart3,  label: "Reports"  },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/sync",      icon: RefreshCw,  label: "Sync"     },
      { href: "/settings",  icon: Settings,   label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 dark:bg-white shadow-sm">
          <Zap className="h-3.5 w-3.5 text-white dark:text-slate-900" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">BOSS</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Actions Tracker</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {nav.map(group => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[10px] font-semibold tracking-widest text-slate-400 dark:text-slate-600">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-slate-100 text-slate-900 font-medium dark:bg-slate-800 dark:text-white"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-slate-700 dark:text-white" : "text-slate-400 dark:text-slate-500"
                      )} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">RL</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">Ray Land</p>
            <p className="truncate text-[10px] text-slate-400">Super Admin</p>
          </div>
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="Connected to Airtable" />
        </div>
      </div>
    </aside>
  );
}
