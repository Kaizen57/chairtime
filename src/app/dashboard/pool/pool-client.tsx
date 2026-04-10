"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Zap, Plus, Trash2, Clock, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";
import { format } from "date-fns";
import type { PoolSlot, Service } from "@/types";

type SlotWithService = PoolSlot & { service: Service | null };

interface PoolClientProps {
  slots: SlotWithService[];
  services: Service[];
  barberId: string;
}

export function PoolClient({ slots: initialSlots, services, barberId }: PoolClientProps) {
  const router = useRouter();
  const [slots, setSlots] = useState(initialSlots);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    serviceId: "",
  });

  async function addSlot() {
    if (!form.date || !form.startTime || !form.endTime) {
      toast.error("Fill in date, start and end time");
      return;
    }
    setLoading(true);
    try {
      const startTime = new Date(`${form.date}T${form.startTime}`).toISOString();
      const endTime = new Date(`${form.date}T${form.endTime}`).toISOString();
      const res = await fetch("/api/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime,
          endTime,
          serviceId: form.serviceId || null,
        }),
      });
      if (!res.ok) throw new Error();
      const slot = await res.json();
      const service = services.find((s) => s.id === form.serviceId) ?? null;
      setSlots((prev) => [...prev, { ...slot, service }].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ));
      setShowForm(false);
      setForm({ date: "", startTime: "", endTime: "", serviceId: "" });
      toast.success("Pool slot added");
    } catch {
      toast.error("Failed to add slot");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSlot(id: string) {
    if (!confirm("Remove this pool slot?")) return;
    await fetch(`/api/pool/${id}`, { method: "DELETE" });
    setSlots((prev) => prev.filter((s) => s.id !== id));
    toast.success("Slot removed");
  }

  const openSlots = slots.filter((s) => s.status === "OPEN");
  const bookedSlots = slots.filter((s) => s.status === "BOOKED");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Open Pool</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Post your open slots — clients book a time and get auto-assigned to you
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Add slot
        </Button>
      </div>

      {/* Add Slot Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">New open slot</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Service (optional — limits to this service)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.serviceId}
                onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
              >
                <option value="">Any service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatDuration(s.durationMinutes)})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={addSlot} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add to pool
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Slots */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
          Open ({openSlots.length})
        </h2>
        {openSlots.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <Zap className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No open slots yet</p>
              <p className="text-xs text-zinc-400 mt-1">Add your available time blocks to the pool</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {openSlots.map((slot) => (
              <Card key={slot.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900 text-sm">
                      {format(new Date(slot.startTime), "EEE, MMM d")}
                    </p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {format(new Date(slot.startTime), "h:mm a")} –{" "}
                      {format(new Date(slot.endTime), "h:mm a")}
                      {slot.service && <span className="ml-1">· {slot.service.name}</span>}
                    </p>
                  </div>
                  <Badge variant="success">Open</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 shrink-0"
                    onClick={() => deleteSlot(slot.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booked Slots */}
      {bookedSlots.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Booked ({bookedSlots.length})
          </h2>
          <div className="space-y-2">
            {bookedSlots.map((slot) => (
              <Card key={slot.id} className="opacity-75">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900 text-sm">
                      {format(new Date(slot.startTime), "EEE, MMM d")}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {format(new Date(slot.startTime), "h:mm a")} –{" "}
                      {format(new Date(slot.endTime), "h:mm a")}
                    </p>
                  </div>
                  <Badge>Booked</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
