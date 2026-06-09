export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const folios = await prisma.folio.findMany({
      where: { isInactive: false },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { actions: true } },
        actions: {
          include: {
            action: {
              select: { id:true, title:true, code:true, status:true, accrueDate:true },
            },
          },
          take: 6,
        },
      },
    });

    const formatted = folios.map((f: any) => ({
      id:        f.id,
      name:      f.name,
      narrative: f.narrative,
      _count:    f._count,
      actions:   f.actions.map((fa: any) => fa.action),
    }));

    return NextResponse.json({ folios: formatted });
  } catch (e) {
    return NextResponse.json({ folios: [] });
  }
}
