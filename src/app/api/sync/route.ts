export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { syncActionsFromAirtable } from "@/services/airtable-sync";
import { prisma } from "@/lib/prisma";

export const maxDuration = 300; // 5 min for full sync

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await syncActionsFromAirtable({ limit: body?.limit });
    return NextResponse.json({ success: true, result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [logs, total, synced, lastSync] = await Promise.all([
      prisma.syncLog.findMany({ orderBy: { startedAt: "desc" }, take: 5 }),
      prisma.action.count(),
      prisma.action.count({ where: { airtableId: { not: null } } }),
      prisma.syncLog.findFirst({
        where: { status: { in: ["SUCCESS","PARTIAL"] } },
        orderBy: { completedAt: "desc" },
      }),
    ]);
    return NextResponse.json({ logs, stats: { total, synced, lastSyncAt: lastSync?.completedAt ?? null } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
