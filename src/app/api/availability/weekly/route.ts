import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedule = await prisma.availabilitySchedule.findFirst({
    where: { userId: user.id, isDefault: true },
  });
  if (!schedule) return NextResponse.json({ error: "No schedule" }, { status: 404 });

  const { hours } = await req.json();

  await Promise.all(
    hours.map((h: { id: string; isAvailable: boolean; startTime: string | null; endTime: string | null }) =>
      prisma.weeklyHours.update({
        where: { id: h.id },
        data: {
          isAvailable: h.isAvailable,
          startTime: h.isAvailable ? h.startTime : null,
          endTime: h.isAvailable ? h.endTime : null,
        },
      })
    )
  );

  return NextResponse.json({ success: true });
}
