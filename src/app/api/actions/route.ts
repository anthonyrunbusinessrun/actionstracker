export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createActionInAirtable } from "@/services/airtable-sync";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page     = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const limit    = Math.min(200, parseInt(sp.get("limit") ?? "100"));
    const skip     = (page - 1) * limit;
    const status   = sp.get("status");
    const type     = sp.get("type");
    const q        = sp.get("q");
    const context  = sp.get("context");
    const archived = sp.get("archived") === "true";
    const sortBy   = sp.get("sortBy") ?? "accrueDate";
    const sortDir  = (sp.get("sortDir") ?? "desc") as "asc" | "desc";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { isArchived: archived };
    if (status)  where.status     = status;
    if (type)    where.actionType = type;
    if (context) where.contextTags = { has: context };
    if (q) where.OR = [
      { title:       { contains: q, mode: "insensitive" } },
      { code:        { contains: q, mode: "insensitive" } },
      { brief:       { contains: q, mode: "insensitive" } },
      { wbs:         { contains: q, mode: "insensitive" } },
    ];

    const validSorts: Record<string, string> = {
      accrueDate: "accrueDate", title: "title", status: "status",
      code: "sequenceNo", updatedAt: "updatedAt", createdAt: "createdAt",
    };
    const orderField = validSorts[sortBy] ?? "updatedAt";

    const [actions, total] = await Promise.all([
      prisma.action.findMany({
        where, skip, take: limit,
        orderBy: [{ [orderField]: sortDir }, { updatedAt: "desc" }],
        include: {
          assignees:   { include: { user: { select: { id:true, name:true, email:true, avatarUrl:true } } } },
          pocContacts: { include: { user: { select: { id:true, name:true } } } },
          folioLinks:  { include: { folio: { select: { id:true, name:true } } } },
          _count: { select: { comments:true, attachments:true } },
        },
      }),
      prisma.action.count({ where }),
    ]);

    return NextResponse.json({ actions, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
  } catch (e) {
    console.error("[GET /api/actions]", e);
    return NextResponse.json({ error: "Failed to list actions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = await createActionInAirtable({
      title:          body.title || "Untitled Action",
      actionType:     body.actionType  ?? null,
      status:         body.status      ?? "QUEUE",
      accrueDate:     body.accrueDate  ?? null,
      brief:          body.brief       ?? null,
      startAt:        body.startAt     ?? null,
      endAt:          body.endAt       ?? null,
      wbs:            body.wbs         ?? null,
      businessTerms:  body.businessTerms ?? null,
      placeOfPerform: body.placeOfPerform ?? null,
      periodOfPerform:body.periodOfPerform ?? null,
      stage:          body.stage       ?? null,
      sort:           body.sort        ?? null,
      contextTags:    body.contextTags ?? [],
    });
    return NextResponse.json(action, { status: 201 });
  } catch (e) {
    console.error("[POST /api/actions]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
