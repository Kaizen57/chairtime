import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AvailabilityClient } from "./availability-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Availability" };

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) redirect("/onboarding");

  const schedule = await prisma.availabilitySchedule.findFirst({
    where: { userId: user.id, isDefault: true },
    include: {
      weeklyHours: { orderBy: { day: "asc" } },
      dateOverrides: { orderBy: { date: "asc" } },
    },
  });

  return <AvailabilityClient schedule={schedule} />;
}
