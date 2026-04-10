import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const slot = await prisma.poolSlot.findFirst({ where: { id, barberId: user.id } });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.poolSlot.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
