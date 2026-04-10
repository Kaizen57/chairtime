"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Scissors, Users, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  attendeeName: z.string().min(1, "Name is required"),
  attendeeEmail: z.string().email("Valid email required"),
  attendeePhone: z.string().optional(),
  serviceNote: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface QueueStatus {
  position: number;
  estimatedWait: number;
  status: string;
  attendeeName: string;
}

export default function PublicQueuePage({ params }: { params: Promise<{ barberId: string }> }) {
  const { barberId } = use(params);
  const [step, setStep] = useState<"join" | "waiting">("join");
  const [entry, setEntry] = useState<QueueStatus | null>(null);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Real-time position updates
  useEffect(() => {
    if (step !== "waiting" || !entry) return;
    const supabase = createClient();
    const channel = supabase
      .channel("queue-public")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "WaitlistEntry",
        filter: `barberId=eq.${barberId}`,
      }, async () => {
        const res = await fetch(`/api/queue/public/${barberId}`);
        const data = await res.json();
        setTotalWaiting(data.waitingCount);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [step, entry, barberId]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barberId, ...data }),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      setEntry({
        position: result.position,
        estimatedWait: result.estimatedWait,
        status: result.status,
        attendeeName: result.attendeeName,
      });
      setTotalWaiting(result.position);
      setStep("waiting");
    } catch {
      toast.error("Failed to join queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">ChairTime</span>
          </div>
        </div>

        {step === "join" && (
          <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-zinc-600" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900">Join the Queue</h1>
              <p className="text-sm text-zinc-500 mt-1">We&apos;ll notify you when it&apos;s your turn</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Your name</Label>
                <Input placeholder="Alex Johnson" {...register("attendeeName")} />
                {errors.attendeeName && <p className="text-xs text-red-500">{errors.attendeeName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" {...register("attendeeEmail")} />
                {errors.attendeeEmail && <p className="text-xs text-red-500">{errors.attendeeEmail.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone (optional)</Label>
                <Input type="tel" placeholder="(555) 000-0000" {...register("attendeePhone")} />
              </div>
              <div className="space-y-1.5">
                <Label>What do you need? (optional)</Label>
                <Input placeholder="e.g. Fade, beard trim..." {...register("serviceNote")} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Join queue
              </Button>
            </form>
          </div>
        )}

        {step === "waiting" && entry && (
          <div className="bg-white rounded-xl border border-zinc-200 p-8 shadow-sm text-center">
            {entry.status === "CALLED" ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">It&apos;s your turn!</h2>
                <p className="text-zinc-500">Head to the chair — the barber is ready for you.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{entry.position}</span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-1">You&apos;re in the queue</h2>
                <p className="text-zinc-500 mb-6">Hi {entry.attendeeName.split(" ")[0]}!</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-zinc-900">{entry.position}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Position</p>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-zinc-900 flex items-center justify-center gap-1">
                      <Clock className="w-5 h-5" />
                      {entry.estimatedWait}m
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">Est. wait</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-400">
                  Keep this page open — we&apos;ll update your position in real time.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
