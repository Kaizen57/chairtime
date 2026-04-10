import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ barberId: string }> }) {
  const { barberId } = await params;

  const waitingCount = await prisma.waitlistEntry.count({
    where: { barberId, status: { in: ["WAITING", "CALLED"] } },
  });

  return NextResponse.json({ waitingCount });
}
