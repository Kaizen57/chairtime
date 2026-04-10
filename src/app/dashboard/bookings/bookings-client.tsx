"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import type { Appointment, Service } from "@/types";

type AppointmentWithService = Appointment & {
  service: Pick<Service, "name" | "color" | "durationMinutes">;
};

const STATUS_BADGE: Record<string, "default" | "success" | "destructive" | "secondary"> = {
  UPCOMING: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "secondary",
};

const FILTERS = ["UPCOMING", "COMPLETED", "CANCELLED", "ALL"];

interface BookingsClientProps {
  appointments: AppointmentWithService[];
  filter: string;
}

export function BookingsClient({ appointments: initial, filter }: BookingsClientProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initial);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function cancelAppointment(id: string) {
    if (!confirm("Cancel this appointment? The client will be notified.")) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error();
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status: "CANCELLED" as const } : a)
      );
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Failed to cancel");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Bookings</h1>

      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        {FILTERS.map((f) => (
          <a
            key={f}
            href={`/dashboard/bookings?filter=${f}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </a>
        ))}
      </div>

      {appointments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No {filter.toLowerCase()} bookings</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {appointments.map((appt) => (
            <Card key={appt.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className="w-1 h-12 rounded-full shrink-0"
                  style={{ backgroundColor: appt.service.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-zinc-900 text-sm">{appt.attendeeName}</p>
                    <Badge variant={STATUS_BADGE[appt.status]} className="text-xs">
                      {appt.status.charAt(0) + appt.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(appt.startTime), "EEE, MMM d")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(appt.startTime), "h:mm a")}
                    </span>
                    <span>{appt.service.name}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{appt.attendeeEmail}</p>
                </div>
                {appt.status === "UPCOMING" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 shrink-0"
                    onClick={() => cancelAppointment(appt.id)}
                    disabled={cancelling === appt.id}
                  >
                    <XCircle className="w-4 h-4" /> Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
