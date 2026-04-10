import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendBarberBookingNotification } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  barberId: z.string(),
  serviceId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  clientTimezone: z.string(),
  attendeeName: z.string().min(1),
  attendeeEmail: z.string().email(),
  attendeePhone: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { barberId, serviceId, attendeeEmail, attendeeName, ...rest } = parsed.data;

  // Upsert contact
  const contact = await prisma.contact.upsert({
    where: { barberId_email: { barberId, email: attendeeEmail } },
    update: {
      totalBookings: { increment: 1 },
      lastBookedAt: new Date(),
      name: attendeeName,
    },
    create: {
      barberId,
      email: attendeeEmail,
      name: attendeeName,
      totalBookings: 1,
      lastBookedAt: new Date(),
    },
  });

  const appointment = await prisma.appointment.create({
    data: {
      barberId,
      serviceId,
      contactId: contact.id,
      attendeeName,
      attendeeEmail,
      startTime: new Date(rest.startTime),
      endTime: new Date(rest.endTime),
      clientTimezone: rest.clientTimezone,
      attendeePhone: rest.attendeePhone ?? null,
      notes: rest.notes ?? null,
      bookingMode: "APPOINTMENT",
    },
  });

  // Send confirmation emails (non-blocking)
  const barber = await prisma.user.findUnique({ where: { id: barberId } });
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (barber && service) {
    void sendBookingConfirmation({
      attendeeName,
      attendeeEmail,
      barberName: barber.name,
      serviceName: service.name,
      startTime: new Date(rest.startTime),
      duration: service.durationMinutes,
    }).catch(() => {});
    void sendBarberBookingNotification({
      barberEmail: barber.email,
      barberName: barber.name,
      attendeeName,
      attendeeEmail,
      attendeePhone: rest.attendeePhone,
      serviceName: service.name,
      startTime: new Date(rest.startTime),
    }).catch(() => {});
  }

  return NextResponse.json(appointment, { status: 201 });
}
