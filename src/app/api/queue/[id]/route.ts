import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const { status } = await req.json();

  const entry = await prisma.waitlistEntry.findFirst({
    where: { id, barberId: user.id },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.waitlistEntry.update({
    where: { id },
    data: {
      status,
      calledAt: status === "CALLED" ? new Date() : undefined,
      servedAt: status === "SERVED" ? new Date() : undefined,
    },
  });

  return NextResponse.json(updated);
}
