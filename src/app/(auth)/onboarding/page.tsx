"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Scissors, User, Users, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(30, "Max 30 characters")
    .regex(/^[a-z0-9_-]+$/, "Only lowercase letters, numbers, hyphens, underscores"),
  timezone: z.string().min(1, "Select a timezone"),
  accountType: z.enum(["SOLO", "SHOP"]),
  shopName: z.string().optional(),
  shopSlug: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: "SOLO", timezone: "America/New_York" },
  });

  const accountType = watch("accountType");
  const usernameValue = watch("username");

  useEffect(() => {
    if (!usernameValue || usernameValue.length < 3) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/availability/username-check?username=${usernameValue}`);
        const { available } = await res.json();
        setUsernameAvailable(available);
      } finally {
        setCheckingUsername(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [usernameValue]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to complete setup");
      }
      toast.success("Welcome to ChairTime!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">ChairTime</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                    step > s
                      ? "bg-zinc-900 text-white"
                      : step === s
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-400"
                  )}
                >
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 2 && <div className={cn("h-px w-12", step > s ? "bg-zinc-900" : "bg-zinc-200")} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Set up your profile</h2>
                  <p className="text-sm text-zinc-500 mt-1">This is how clients will find you.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <div className="flex items-center">
                    <span className="h-9 px-3 flex items-center text-sm text-zinc-500 border border-r-0 border-input rounded-l-md bg-zinc-50">
                      chairtime.app/
                    </span>
                    <Input
                      id="username"
                      className="rounded-l-none"
                      placeholder="yourname"
                      {...register("username")}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-500">{errors.username.message}</p>
                  )}
                  {!errors.username && usernameValue && usernameValue.length >= 3 && (
                    <p className={`text-xs ${checkingUsername ? "text-zinc-400" : usernameAvailable ? "text-green-600" : "text-red-500"}`}>
                      {checkingUsername ? "Checking..." : usernameAvailable ? "✓ Available" : "Already taken"}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register("timezone")}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="button" className="w-full" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Choose your account type</h2>
                  <p className="text-sm text-zinc-500 mt-1">You can always upgrade later.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("accountType", "SOLO")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all",
                      accountType === "SOLO"
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <User className="w-7 h-7" />
                    <div className="text-center">
                      <p className="font-semibold text-sm">Solo Barber</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Just me</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("accountType", "SHOP")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all",
                      accountType === "SHOP"
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <Users className="w-7 h-7" />
                    <div className="text-center">
                      <p className="font-semibold text-sm">Barbershop</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Team of barbers</p>
                    </div>
                  </button>
                </div>

                {accountType === "SHOP" && (
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="shopName">Shop name</Label>
                      <Input id="shopName" placeholder="Fade Factory" {...register("shopName")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="shopSlug">Shop URL</Label>
                      <div className="flex items-center">
                        <span className="h-9 px-3 flex items-center text-sm text-zinc-500 border border-r-0 border-input rounded-l-md bg-zinc-50">
                          chairtime.app/
                        </span>
                        <Input
                          id="shopSlug"
                          className="rounded-l-none"
                          placeholder="fade-factory"
                          {...register("shopSlug")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Finish setup
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
