import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedule = await prisma.availabilitySchedule.findFirst({
    where: { userId: user.id, isDefault: true },
  });
  if (!schedule) return NextResponse.json({ error: "No schedule" }, { status: 404 });

  const { date, isAvailable, startTime, endTime } = await req.json();

  const override = await prisma.dateOverride.upsert({
    where: { scheduleId_date: { scheduleId: schedule.id, date } },
    update: { isAvailable, startTime: startTime ?? null, endTime: endTime ?? null },
    create: { scheduleId: schedule.id, date, isAvailable, startTime: startTime ?? null, endTime: endTime ?? null },
  });

  return NextResponse.json(override, { status: 201 });
}
