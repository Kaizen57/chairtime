import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const PRICE_IDS: Record<string, string> = {
  SOLO: process.env.STRIPE_SOLO_PRICE_ID!,
  SHOP: process.env.STRIPE_SHOP_PRICE_ID!,
  PRO_SHOP: process.env.STRIPE_PRO_SHOP_PRICE_ID!,
};
