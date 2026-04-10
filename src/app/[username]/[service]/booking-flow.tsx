"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  Scissors, Clock, ChevronLeft, ChevronRight, CheckCircle, Loader2, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDuration, getInitials } from "@/lib/utils";
import {
  addDays, startOfDay, format, isSameDay, addMinutes, parseISO, isAfter,
} from "date-fns";
import type { AvailabilitySchedule, WeeklyHours, DateOverride } from "@/types";

const intakeSchema = z.object({
  attendeeName: z.string().min(1, "Name is required"),
  attendeeEmail: z.string().email("Valid email required"),
  attendeePhone: z.string().optional(),
  notes: z.string().optional(),
});
type IntakeData = z.infer<typeof intakeSchema>;

interface BarberInfo {
  id: string;
  name: string;
  username: string;
  photoUrl: string | null;
  timezone: string;
}

interface ServiceInfo {
  id: string;
  name: string;
  durationMinutes: number;
  price: number | null;
  color: string;
  bufferBefore: number;
  bufferAfter: number;
}

type ScheduleWithRelations = AvailabilitySchedule & {
  weeklyHours: WeeklyHours[];
  dateOverrides: DateOverride[];
} | null;

interface BookingFlowProps {
  barber: BarberInfo;
  service: ServiceInfo;
  schedule: ScheduleWithRelations;
}

const DAY_MAP: Record<number, string> = {
  0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
  4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
};

function getAvailableSlots(date: Date, service: ServiceInfo, schedule: ScheduleWithRelations): string[] {
  if (!schedule) return [];

  const dayName = DAY_MAP[date.getDay()];
  const override = schedule.dateOverrides.find((o) => o.date === format(date, "yyyy-MM-dd"));
  const weekDay = schedule.weeklyHours.find((h) => h.day === dayName);

  const isAvail = override ? override.isAvailable : (weekDay?.isAvailable ?? false);
  if (!isAvail) return [];

  const startStr = override?.startTime ?? weekDay?.startTime ?? "09:00";
  const endStr = override?.endTime ?? weekDay?.endTime ?? "18:00";

  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);

  const slots: string[] = [];
  let current = new Date(date);
  current.setHours(sh, sm, 0, 0);
  const end = new Date(date);
  end.setHours(eh, em, 0, 0);

  const total = service.durationMinutes + service.bufferBefore + service.bufferAfter;
  const now = new Date();

  while (isAfter(addMinutes(current, total), now) && addMinutes(current, total) <= end) {
    if (isAfter(current, now)) {
      slots.push(format(current, "HH:mm"));
    }
    current = addMinutes(current, 30);
  }

  return slots;
}

export function BookingFlow({ barber, service, schedule }: BookingFlowProps) {
  const [step, setStep] = useState<"date" | "time" | "details" | "confirmed">("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<{ attendeeName: string; startTime: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IntakeData>({ resolver: zodResolver(intakeSchema) });

  const today = startOfDay(new Date());
  const displayDays = Array.from({ length: 14 }, (_, i) => addDays(today, i + calendarOffset));
  const availableSlots = selectedDate ? getAvailableSlots(selectedDate, service, schedule) : [];

  function isDayAvailable(date: Date): boolean {
    return getAvailableSlots(date, service, schedule).length > 0;
  }

  async function onSubmit(data: IntakeData) {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      const [h, m] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(h, m, 0, 0);
      const endTime = addMinutes(startTime, service.durationMinutes);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId: barber.id,
          serviceId: service.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...data,
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      setConfirmedAppt({ attendeeName: data.attendeeName, startTime: startTime.toISOString() });
      setStep("confirmed");
    } catch {
      toast.error("Failed to book. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <Link href={`/${barber.username}`} className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm">ChairTime</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Service + Barber header */}
        <div className="bg-white rounded-xl border p-5 mb-6 flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={barber.photoUrl ?? undefined} />
            <AvatarFallback>{getInitials(barber.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-zinc-900">{service.name}</p>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
              <span>{barber.name}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> {formatDuration(service.durationMinutes)}
              </span>
              {service.price && <><span>·</span><span>${service.price}</span></>}
            </div>
          </div>
          <div
            className="ml-auto w-3 h-3 rounded-full"
            style={{ backgroundColor: service.color }}
          />
        </div>

        {/* Step: Date */}
        {step === "date" && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">Select a date</h2>
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" onClick={() => setCalendarOffset((o) => Math.max(0, o - 7))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-zinc-700">
                {format(displayDays[0], "MMM yyyy")}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setCalendarOffset((o) => o + 7)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {displayDays.slice(0, 7).map((day) => {
                const avail = isDayAvailable(day);
                const selected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    disabled={!avail}
                    onClick={() => { setSelectedDate(day); setStep("time"); }}
                    className={`flex flex-col items-center py-2 rounded-lg text-sm transition-colors ${
                      selected
                        ? "bg-zinc-900 text-white"
                        : avail
                        ? "hover:bg-zinc-100 text-zinc-700"
                        : "text-zinc-300 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-xs mb-0.5">{format(day, "EEE")}</span>
                    <span className="font-semibold">{format(day, "d")}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === "time" && selectedDate && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setStep("date")} className="text-zinc-400 hover:text-zinc-700">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-zinc-900">
                {format(selectedDate, "EEEE, MMMM d")}
              </h2>
            </div>
            {availableSlots.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-6">No available slots for this day.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => { setSelectedTime(slot); setStep("details"); }}
                    className="py-2 px-3 rounded-lg border text-sm font-medium text-zinc-700 hover:border-zinc-900 hover:bg-zinc-50 transition-colors"
                  >
                    {format(parseISO(`2000-01-01T${slot}`), "h:mm a")}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && selectedDate && selectedTime && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setStep("time")} className="text-zinc-400 hover:text-zinc-700">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-zinc-900">Your details</h2>
            </div>
            <div className="bg-zinc-50 rounded-lg p-3 mb-5 text-sm text-zinc-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(selectedDate, "EEEE, MMMM d")} at{" "}
                {format(parseISO(`2000-01-01T${selectedTime}`), "h:mm a")}
              </span>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input placeholder="Alex Johnson" {...register("attendeeName")} />
                  {errors.attendeeName && <p className="text-xs text-red-500">{errors.attendeeName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" {...register("attendeeEmail")} />
                  {errors.attendeeEmail && <p className="text-xs text-red-500">{errors.attendeeEmail.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone (optional)</Label>
                <Input type="tel" placeholder="(555) 000-0000" {...register("attendeePhone")} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any special requests..." {...register("notes")} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm booking
              </Button>
            </form>
          </div>
        )}

        {/* Step: Confirmed */}
        {step === "confirmed" && confirmedAppt && (
          <div className="bg-white rounded-xl border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">You&apos;re booked!</h2>
            <p className="text-zinc-500 mb-4">
              Hi {confirmedAppt.attendeeName.split(" ")[0]}! Your appointment is confirmed for{" "}
              <strong>{format(new Date(confirmedAppt.startTime), "EEEE, MMMM d 'at' h:mm a")}</strong>.
            </p>
            <p className="text-sm text-zinc-400 mb-6">
              A confirmation email is on its way.
            </p>
            <Button variant="outline" asChild>
              <Link href={`/${barber.username}`}>Back to {barber.name}&apos;s page</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
