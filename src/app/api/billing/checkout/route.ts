import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { stripe, PRICE_IDS } from "@/lib/stripe";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { plan } = await req.json();
  const priceId = PRICE_IDS[plan];
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  // Get or create Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings?tab=billing&success=1`,
    cancel_url: `${appUrl}/dashboard/settings?tab=billing`,
    metadata: { userId: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
