"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, User as UserIcon, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/types";
import type { User } from "@/types";

const profileSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string(),
});
type ProfileData = z.infer<typeof profileSchema>;

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Phoenix", "America/Anchorage", "Pacific/Honolulu",
];

interface SettingsClientProps {
  user: User;
  defaultTab?: "profile" | "billing";
  billingSuccess?: boolean;
}

export function SettingsClient({ user: initialUser, defaultTab = "profile", billingSuccess = false }: SettingsClientProps) {
  const [tab, setTab] = useState<"profile" | "billing">(defaultTab);

  useEffect(() => {
    if (billingSuccess) toast.success("Subscription activated!");
  }, [billingSuccess]);
  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialUser.name,
      bio: initialUser.bio ?? "",
      phone: initialUser.phone ?? "",
      timezone: initialUser.timezone,
    },
  });

  async function saveProfile(data: ProfileData) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function openBillingPortal() {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error("Failed to open billing portal");
      setBillingLoading(false);
    }
  }

  async function subscribe(plan: "SOLO" | "SHOP" | "PRO_SHOP") {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error("Failed to start checkout");
      setBillingLoading(false);
    }
  }

  const currentPlan = PLANS[initialUser.plan as keyof typeof PLANS];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        {(["profile", "billing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(saveProfile)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input {...register("name")} />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Username</Label>
                  <div className="flex items-center">
                    <span className="h-9 px-3 flex items-center text-sm text-zinc-500 border border-r-0 border-input rounded-l-md bg-zinc-50">
                      chairtime.app/
                    </span>
                    <Input
                      className="rounded-l-none"
                      value={initialUser.username}
                      disabled
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Bio (shown on your public page)</Label>
                <Input placeholder="Tell clients about yourself..." {...register("bio")} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input type="tel" placeholder="(555) 000-0000" {...register("phone")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register("timezone")}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Billing Tab */}
      {tab === "billing" && (
        <div className="space-y-4">
          {/* Current plan */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Current plan</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xl font-bold text-zinc-900">{currentPlan.label}</p>
                    <Badge variant="secondary">${currentPlan.price}/mo</Badge>
                  </div>
                </div>
                {initialUser.stripeSubscriptionId && (
                  <Button variant="outline" onClick={openBillingPortal} disabled={billingLoading}>
                    {billingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <CreditCard className="w-4 h-4" /> Manage billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan options */}
          <div className="grid sm:grid-cols-3 gap-4">
            {(["SOLO", "SHOP", "PRO_SHOP"] as const).map((plan) => {
              const info = PLANS[plan];
              const isCurrent = initialUser.plan === plan;
              return (
                <Card key={plan} className={isCurrent ? "border-zinc-900" : ""}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-zinc-900">{info.label}</p>
                      {isCurrent && <CheckCircle className="w-4 h-4 text-zinc-900" />}
                    </div>
                    <p className="text-2xl font-bold text-zinc-900 mb-3">
                      ${info.price}<span className="text-sm font-normal text-zinc-500">/mo</span>
                    </p>
                    <p className="text-xs text-zinc-500 mb-4">
                      {info.maxBarbers === Infinity ? "Unlimited" : `Up to ${info.maxBarbers}`} barber{info.maxBarbers !== 1 ? "s" : ""}
                    </p>
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => subscribe(plan)}
                        disabled={billingLoading}
                      >
                        {initialUser.plan === "SOLO" && plan !== "SOLO" ? "Upgrade" : "Switch"}
                      </Button>
                    )}
                    {isCurrent && (
                      <p className="text-xs text-center text-zinc-400">Current plan</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
