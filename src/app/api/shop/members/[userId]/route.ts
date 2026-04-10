import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owner = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: { ownedShop: true },
  });
  if (!owner?.ownedShop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const { userId } = await params;
  if (userId === owner.id) return NextResponse.json({ error: "Cannot remove owner" }, { status: 400 });

  await prisma.shopMember.deleteMany({
    where: { shopId: owner.ownedShop.id, userId },
  });

  return new NextResponse(null, { status: 204 });
}
