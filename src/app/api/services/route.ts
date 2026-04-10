import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  durationMinutes: z.coerce.number().min(5),
  price: z.coerce.number().min(0).optional().nullable(),
  description: z.string().optional(),
  color: z.string().default("#18181b"),
  bufferBefore: z.coerce.number().min(0).default(0),
  bufferAfter: z.coerce.number().min(0).default(0),
});

async function getUser() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;
  return prisma.user.findUnique({ where: { authId: authUser.id } });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, ...rest } = parsed.data;
  const baseSlug = slugify(name);

  // Ensure unique slug per user
  let slug = baseSlug;
  let i = 1;
  while (await prisma.service.findUnique({ where: { userId_slug: { userId: user.id, slug } } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const service = await prisma.service.create({
    data: { userId: user.id, name, slug, ...rest },
  });

  return NextResponse.json(service, { status: 201 });
}
