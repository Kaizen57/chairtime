import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const joinSchema = z.object({
  barberId: z.string().optional(),
  shopId: z.string().optional(),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
  serviceNote: z.string().optional(),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.waitlistEntry.findMany({
    where: { barberId: user.id, status: { in: ["WAITING", "CALLED"] } },
    orderBy: { position: "asc" },
  });
  return NextResponse.json(entries);
}

// Public: join queue
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { barberId, shopId, ...rest } = parsed.data;
  if (!barberId && !shopId) {
    return NextResponse.json({ error: "barberId or shopId required" }, { status: 400 });
  }

  // Get current max position
  const last = await prisma.waitlistEntry.findFirst({
    where: {
      ...(barberId ? { barberId } : { shopId }),
      status: { in: ["WAITING", "CALLED"] },
    },
    orderBy: { position: "desc" },
  });

  const position = (last?.position ?? 0) + 1;
  const estimatedWait = position * 20; // rough 20min per person

  const entry = await prisma.waitlistEntry.create({
    data: { barberId: barberId ?? null, shopId: shopId ?? null, position, estimatedWait, ...rest },
  });

  return NextResponse.json(entry, { status: 201 });
}
