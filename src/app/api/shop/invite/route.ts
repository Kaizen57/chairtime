import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owner = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: { ownedShop: true },
  });
  if (!owner?.ownedShop) return NextResponse.json({ error: "No shop found" }, { status: 404 });
  if (owner.plan === "SOLO") return NextResponse.json({ error: "Upgrade required" }, { status: 403 });

  const { email } = await req.json();
  if (!z.string().email().safeParse(email).success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) {
    const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup`;
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@chairtime.app",
      to: email,
      subject: `${owner.name} invited you to join ${owner.ownedShop.name} on ChairTime`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <h2 style="font-size:20px;font-weight:700;color:#18181b;margin-bottom:12px;">You've been invited</h2>
          <p style="color:#52525b;margin-bottom:16px;">${owner.name} invited you to join <strong>${owner.ownedShop.name}</strong> on ChairTime.</p>
          <a href="${signupUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Accept invite</a>
          <p style="color:#a1a1aa;font-size:12px;margin-top:24px;">Powered by ChairTime</p>
        </div>
      `,
    }).catch(() => {});
    return NextResponse.json({ message: "Invite sent" });
  }

  const existing = await prisma.shopMember.findFirst({
    where: { shopId: owner.ownedShop.id, userId: invitee.id },
  });
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  await prisma.shopMember.create({
    data: { shopId: owner.ownedShop.id, userId: invitee.id },
  });

  return NextResponse.json({ success: true });
}
