import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ShopClient } from "./shop-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: {
      ownedShop: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, username: true, photoUrl: true } } },
            where: { isActive: true },
          },
        },
      },
    },
  });
  if (!user) redirect("/onboarding");

  if (user.plan === "SOLO") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Shop</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-zinc-500 mb-2">Shop features require the Shop plan</p>
            <p className="text-sm text-zinc-400 mb-4">Upgrade to manage a team of barbers</p>
            <Button asChild>
              <Link href="/dashboard/settings?tab=billing">Upgrade to Shop — $49/mo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ShopClient shop={user.ownedShop} userId={user.id} />;
}
