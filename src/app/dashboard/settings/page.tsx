import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) redirect("/onboarding");

  const { tab, success } = await searchParams;

  return <SettingsClient user={user} defaultTab={(tab as "profile" | "billing") ?? "profile"} billingSuccess={success === "1"} />;
}
