import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { PoolClient } from "./pool-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Open Pool" };

export default async function PoolPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) redirect("/onboarding");

  const [slots, services] = await Promise.all([
    prisma.poolSlot.findMany({
      where: {
        barberId: user.id,
        startTime: { gte: new Date() },
        status: { in: ["OPEN", "BOOKED"] },
      },
      include: { service: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.service.findMany({
      where: { userId: user.id, isActive: true },
    }),
  ]);

  return <PoolClient slots={slots} services={services} barberId={user.id} />;
}
