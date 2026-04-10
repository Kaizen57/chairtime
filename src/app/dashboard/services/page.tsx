import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ServicesClient } from "./services-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) redirect("/onboarding");

  const services = await prisma.service.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { appointments: true } } },
  });

  return <ServicesClient services={services} />;
}
