export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateActionInAirtable, deleteActionInAirtable } from "@/services/airtable-sync";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        assignees:   { include: { user: { select: { id:true, name:true, email:true, avatarUrl:true, role:true } } } },
        qaReviewers: { include: { user: { select: { id:true, name:true, email:true } } } },
        pocContacts: { include: { user: { select: { id:true, name:true, email:true } } } },
        folioLinks:  { include: { folio: true } },
        outcomes:    { include: { outcome: true } },
        attachments: true,
        comments: {
          include: { author: { select: { id:true, name:true, avatarUrl:true } } },
          orderBy: { createdAt: "asc" },
        },
        activityLogs: {
          include: { user: { select: { id:true, name:true, avatarUrl:true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        createdBy: { select: { id:true, name:true, avatarUrl:true } },
        _count: { select: { comments:true, attachments:true } },
      },
    });
    if (!action) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(action);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();

    const action = await updateActionInAirtable(id, {
      title:           body.title,
      actionType:      body.actionType,
      status:          body.status,
      accrueDate:      body.accrueDate,
      brief:           body.brief,
      startAt:         body.startAt,
      endAt:           body.endAt,
      wbs:             body.wbs,
      businessTerms:   body.businessTerms,
      placeOfPerform:  body.placeOfPerform,
      periodOfPerform: body.periodOfPerform,
      stage:           body.stage,
      sort:            body.sort,
      number:          body.number,
      contextTags:     body.contextTags,
      boardPosition:   body.boardPosition,
    });

    return NextResponse.json(action);
  } catch (e) {
    console.error("[PATCH /api/actions/[id]]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteActionInAirtable(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/actions/[id]]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
