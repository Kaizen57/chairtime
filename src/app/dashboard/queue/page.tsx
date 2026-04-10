import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { QueueClient } from "./queue-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Walk-in Queue" };

export default async function QueuePage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: { ownedShop: true },
  });
  if (!user) redirect("/onboarding");

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      barberId: user.id,
      status: { in: ["WAITING", "CALLED"] },
    },
    orderBy: { position: "asc" },
  });

  return (
    <QueueClient
      userId={user.id}
      shopId={user.ownedShop?.id ?? null}
      initialEntries={entries}
    />
  );
}
