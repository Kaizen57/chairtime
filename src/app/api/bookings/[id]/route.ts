import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendCancellationEmail } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const appt = await prisma.appointment.findFirst({ where: { id, barberId: user.id } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, cancellationReason } = await req.json();

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status, cancellationReason: cancellationReason ?? null },
    include: { service: true },
  });

  if (status === "CANCELLED") {
    void sendCancellationEmail({
      attendeeEmail: appt.attendeeEmail,
      attendeeName: appt.attendeeName,
      barberName: user.name,
      serviceName: updated.service.name,
      startTime: appt.startTime,
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}
