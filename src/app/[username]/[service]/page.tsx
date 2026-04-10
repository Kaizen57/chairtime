import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "./booking-flow";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ username: string; service: string }> }): Promise<Metadata> {
  const { username, service } = await params;
  return { title: `Book ${service} with ${username} | ChairTime` };
}

export default async function BookingPage({ params }: { params: Promise<{ username: string; service: string }> }) {
  const { username, service: serviceSlug } = await params;

  const barber = await prisma.user.findUnique({ where: { username } });
  if (!barber) notFound();

  const service = await prisma.service.findFirst({
    where: { userId: barber.id, slug: serviceSlug, isActive: true },
  });
  if (!service) notFound();

  const schedule = await prisma.availabilitySchedule.findFirst({
    where: { userId: barber.id, isDefault: true },
    include: { weeklyHours: true, dateOverrides: true },
  });

  return (
    <BookingFlow
      barber={{ id: barber.id, name: barber.name, username: barber.username, photoUrl: barber.photoUrl, timezone: barber.timezone }}
      service={{ id: service.id, name: service.name, durationMinutes: service.durationMinutes, price: service.price, color: service.color, bufferBefore: service.bufferBefore, bufferAfter: service.bufferAfter }}
      schedule={schedule}
    />
  );
}
