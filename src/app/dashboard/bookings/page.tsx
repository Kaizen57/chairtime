import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { BookingsClient } from "./bookings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bookings" };

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) redirect("/onboarding");

  const { filter = "UPCOMING" } = await searchParams;

  const appointments = await prisma.appointment.findMany({
    where: {
      barberId: user.id,
      ...(filter !== "ALL" ? { status: filter as "UPCOMING" | "COMPLETED" | "CANCELLED" } : {}),
    },
    include: {
      service: { select: { name: true, color: true, durationMinutes: true } },
    },
    orderBy: { startTime: filter === "UPCOMING" ? "asc" : "desc" },
    take: 50,
  });

  return <BookingsClient appointments={appointments} filter={filter} />;
}
