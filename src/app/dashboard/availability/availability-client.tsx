"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAY_LABELS } from "@/types";
import type { AvailabilitySchedule, WeeklyHours, DateOverride, DayOfWeek } from "@/types";

const DAY_ORDER: DayOfWeek[] = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
];

type ScheduleWithRelations = AvailabilitySchedule & {
  weeklyHours: WeeklyHours[];
  dateOverrides: DateOverride[];
};

interface AvailabilityClientProps {
  schedule: ScheduleWithRelations | null;
}

export function AvailabilityClient({ schedule: initialSchedule }: AvailabilityClientProps) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [hours, setHours] = useState<WeeklyHours[]>(initialSchedule?.weeklyHours ?? []);
  const [overrides, setOverrides] = useState<DateOverride[]>(initialSchedule?.dateOverrides ?? []);
  const [saving, setSaving] = useState(false);
  const [newOverrideDate, setNewOverrideDate] = useState("");

  function updateDay(day: DayOfWeek, field: keyof WeeklyHours, value: unknown) {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, [field]: value } : h))
    );
  }

  function getDay(day: DayOfWeek): WeeklyHours | undefined {
    return hours.find((h) => h.day === day);
  }

  async function saveWeeklyHours() {
    setSaving(true);
    try {
      const res = await fetch("/api/availability/weekly", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      if (!res.ok) throw new Error();
      toast.success("Availability saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function addOverride() {
    if (!newOverrideDate) return;
    try {
      const res = await fetch("/api/availability/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newOverrideDate, isAvailable: false }),
      });
      if (!res.ok) throw new Error();
      const override = await res.json();
      setOverrides((prev) => [...prev, override]);
      setNewOverrideDate("");
      toast.success("Date blocked");
    } catch {
      toast.error("Failed to add override");
    }
  }

  async function removeOverride(id: string) {
    await fetch(`/api/availability/overrides/${id}`, { method: "DELETE" });
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Availability</h1>
        <p className="text-sm text-zinc-500 mt-1">Set your weekly working hours and block off days</p>
      </div>

      {/* Weekly Hours */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" /> Weekly schedule
            </CardTitle>
            <Button size="sm" onClick={saveWeeklyHours} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAY_ORDER.map((day) => {
            const h = getDay(day);
            if (!h) return null;
            return (
              <div key={day} className="flex items-center gap-4">
                <div className="w-28 shrink-0">
                  <Switch
                    checked={h.isAvailable}
                    onCheckedChange={(val) => updateDay(day, "isAvailable", val)}
                  />
                  <span className="ml-2 text-sm font-medium text-zinc-700">{DAY_LABELS[day].slice(0, 3)}</span>
                </div>
                {h.isAvailable ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={h.startTime ?? "09:00"}
                      onChange={(e) => updateDay(day, "startTime", e.target.value)}
                      className="w-32"
                    />
                    <span className="text-zinc-400 text-sm">to</span>
                    <Input
                      type="time"
                      value={h.endTime ?? "18:00"}
                      onChange={(e) => updateDay(day, "endTime", e.target.value)}
                      className="w-32"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-zinc-400">Unavailable</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Date Overrides */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Blocked dates / Holidays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="date"
              value={newOverrideDate}
              onChange={(e) => setNewOverrideDate(e.target.value)}
              className="w-48"
              min={new Date().toISOString().split("T")[0]}
            />
            <Button variant="outline" size="sm" onClick={addOverride}>
              <Plus className="w-4 h-4" /> Block date
            </Button>
          </div>
          {overrides.length === 0 ? (
            <p className="text-sm text-zinc-400">No blocked dates</p>
          ) : (
            <div className="space-y-2">
              {overrides.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-1.5 px-3 bg-zinc-50 rounded-md">
                  <span className="text-sm text-zinc-700">
                    {new Date(o.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700"
                    onClick={() => removeOverride(o.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
