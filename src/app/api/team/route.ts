export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            actionsAssigned: true,
            actionsQA: true,
            actionsPOC: true,
          },
        },
      },
    });
    return NextResponse.json({ members });
  } catch (e) {
    return NextResponse.json({ members: [] });
  }
}
