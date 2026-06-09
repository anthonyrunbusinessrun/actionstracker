export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    // Find or create a system user for now (auth pending)
    let user = await prisma.user.findFirst({ where: { email: "system@boss.app" } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: "system@boss.app", name: "System", role: "EMPLOYEE" },
      });
    }

    const comment = await prisma.comment.create({
      data: { actionId: id, authorId: user.id, content: content.trim() },
      include: { author: { select: { id:true, name:true, avatarUrl:true } } },
    });

    await prisma.activityLog.create({
      data: { actionId: id, userId: user.id, event: "COMMENTED", entityType: "Comment", entityId: comment.id },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
