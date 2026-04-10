import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/),
  timezone: z.string().min(1),
  accountType: z.enum(["SOLO", "SHOP"]),
  shopName: z.string().optional(),
  shopSlug: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { username, timezone, accountType, shopName, shopSlug } = parsed.data;

  // Check username uniqueness
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const name = authUser.user_metadata?.name ?? authUser.email?.split("@")[0] ?? "Barber";

  const user = await prisma.user.create({
    data: {
      authId: authUser.id,
      email: authUser.email!,
      name,
      username,
      timezone,
      plan: accountType === "SHOP" ? "SHOP" : "SOLO",
    },
  });

  // Create default availability schedule
  await prisma.availabilitySchedule.create({
    data: {
      userId: user.id,
      name: "Default Schedule",
      isDefault: true,
      timezone,
      weeklyHours: {
        create: [
          { day: "MONDAY", isAvailable: true, startTime: "09:00", endTime: "18:00" },
          { day: "TUESDAY", isAvailable: true, startTime: "09:00", endTime: "18:00" },
          { day: "WEDNESDAY", isAvailable: true, startTime: "09:00", endTime: "18:00" },
          { day: "THURSDAY", isAvailable: true, startTime: "09:00", endTime: "18:00" },
          { day: "FRIDAY", isAvailable: true, startTime: "09:00", endTime: "18:00" },
          { day: "SATURDAY", isAvailable: true, startTime: "09:00", endTime: "15:00" },
          { day: "SUNDAY", isAvailable: false },
        ],
      },
    },
  });

  // Create shop if needed
  if (accountType === "SHOP" && shopName) {
    const slug = shopSlug ? slugify(shopSlug) : slugify(shopName);
    await prisma.shop.create({
      data: {
        ownerId: user.id,
        name: shopName,
        slug,
        timezone,
        members: {
          create: { userId: user.id, isActive: true },
        },
      },
    });
  }

  return NextResponse.json({ success: true });
}
