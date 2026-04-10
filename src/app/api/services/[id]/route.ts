import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  durationMinutes: z.coerce.number().min(5).optional(),
  price: z.coerce.number().min(0).optional().nullable(),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
  bufferBefore: z.coerce.number().min(0).optional(),
  bufferAfter: z.coerce.number().min(0).optional(),
});

async function getUser() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;
  return prisma.user.findUnique({ where: { authId: authUser.id } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const service = await prisma.service.findFirst({ where: { id, userId: user.id } });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.service.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const service = await prisma.service.findFirst({ where: { id, userId: user.id } });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.service.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
