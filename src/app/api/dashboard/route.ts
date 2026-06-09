export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [total, byStatus, overdueCount, dueTodayCount, dueThisWeekCount, byType, recentActions] =
      await Promise.all([
        prisma.action.count({ where: { isArchived: false } }),
        prisma.action.groupBy({
          by: ["status"], where: { isArchived: false }, _count: { _all: true },
        }),
        prisma.action.count({
          where: {
            isArchived: false,
            status: { notIn: ["ARCHIVE","SCRAPPED"] },
            accrueDate: { lt: todayStart, not: null },
          },
        }),
        prisma.action.count({
          where: {
            isArchived: false,
            accrueDate: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) },
          },
        }),
        prisma.action.count({
          where: { isArchived: false, accrueDate: { gte: todayStart, lt: weekEnd } },
        }),
        prisma.action.groupBy({
          by: ["actionType"],
          where: { isArchived: false, actionType: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { actionType: "desc" } },
          take: 10,
        }),
        prisma.action.findMany({
          where: { isArchived: false },
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: { id:true, title:true, code:true, status:true, actionType:true, accrueDate:true, updatedAt:true },
        }),
      ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) if (s.status) statusMap[s.status] = s._count._all;

    const activeStatuses = ["NOW","PRIORITY","QUEUE","SCHEDULED","WAITING_FOR","SOMEDAY_MAYBE","REVIEW","PROBLEM","DELEGATE","TENTATIVE","REMINDER","ONGOING","SNOOZED"];
    const activeCount = activeStatuses.reduce((sum, s) => sum + (statusMap[s] ?? 0), 0);
    const completedCount = (statusMap["ARCHIVE"] ?? 0) + (statusMap["SCRAPPED"] ?? 0);
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return NextResponse.json({
      total, active: activeCount, completed: completedCount,
      overdue: overdueCount, dueToday: dueTodayCount, dueThisWeek: dueThisWeekCount,
      completionRate, statusDistribution: statusMap,
      typeDistribution: byType.map((t: any) => ({ type: t.actionType ?? "Unknown", count: t._count._all })),
      recentActions,
    });
  } catch (e) {
    console.error("[dashboard]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
