import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, plan } = session.metadata ?? {};
      if (userId && plan) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: plan as "SOLO" | "SHOP" | "PRO_SHOP",
            stripeSubscriptionId: session.subscription as string,
          },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { plan: "SOLO", stripeSubscriptionId: null },
      });
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const PRICE_TO_PLAN: Record<string, string> = {
        [process.env.STRIPE_SOLO_PRICE_ID!]: "SOLO",
        [process.env.STRIPE_SHOP_PRICE_ID!]: "SHOP",
        [process.env.STRIPE_PRO_SHOP_PRICE_ID!]: "PRO_SHOP",
      };
      const plan = PRICE_TO_PLAN[priceId];
      if (plan) {
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { plan: plan as "SOLO" | "SHOP" | "PRO_SHOP" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
