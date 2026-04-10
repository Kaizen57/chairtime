import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  serviceId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slot = await prisma.poolSlot.create({
    data: {
      barberId: user.id,
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
      serviceId: parsed.data.serviceId ?? null,
    },
  });

  return NextResponse.json(slot, { status: 201 });
}

// Public: get available pool slots for a shop or barber
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const barberId = searchParams.get("barberId");
  const shopId = searchParams.get("shopId");
  const serviceId = searchParams.get("serviceId");

  const slots = await prisma.poolSlot.findMany({
    where: {
      ...(barberId ? { barberId } : {}),
      status: "OPEN",
      startTime: { gte: new Date() },
      ...(serviceId ? { OR: [{ serviceId }, { serviceId: null }] } : {}),
    },
    include: { barber: { select: { id: true, name: true, photoUrl: true } }, service: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(slots);
}
