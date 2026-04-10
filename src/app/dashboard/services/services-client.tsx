"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Scissors, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatDuration } from "@/lib/utils";
import type { ServiceWithCount } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  durationMinutes: z.coerce.number().min(5, "At least 5 minutes"),
  price: z.coerce.number().min(0).optional().nullable(),
  description: z.string().optional(),
  color: z.string().default("#18181b"),
  bufferBefore: z.coerce.number().min(0).default(0),
  bufferAfter: z.coerce.number().min(0).default(0),
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const COLORS = [
  "#18181b", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
];

interface ServicesClientProps {
  services: ServiceWithCount[];
}

export function ServicesClient({ services: initialServices }: ServicesClientProps) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema), defaultValues: { color: "#18181b" } });

  const selectedColor = watch("color");

  function openCreate() {
    reset({ color: "#18181b", bufferBefore: 0, bufferAfter: 0 });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(s: ServiceWithCount) {
    reset({
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: s.price ?? undefined,
      description: s.description ?? "",
      color: s.color,
      bufferBefore: s.bufferBefore,
      bufferAfter: s.bufferAfter,
    });
    setEditingId(s.id);
    setShowForm(true);
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save service");
      toast.success(editingId ? "Service updated" : "Service created");
      setShowForm(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s))
    );
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service deleted");
    } else {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Services</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage what you offer clients</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add service
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-zinc-900 mb-4">
              {editingId ? "Edit service" : "New service"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="e.g. Fade & Line Up" {...register("name")} />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" min={5} step={5} placeholder="30" {...register("durationMinutes")} />
                  {errors.durationMinutes && <p className="text-xs text-red-500">{errors.durationMinutes.message}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Price (optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <Input className="pl-8" type="number" min={0} step={0.01} placeholder="0.00" {...register("price")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Input placeholder="Short description for clients" {...register("description")} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Buffer before (min)</Label>
                  <Input type="number" min={0} step={5} {...register("bufferBefore")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Buffer after (min)</Label>
                  <Input type="number" min={0} step={5} {...register("bufferAfter")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("color", c)}
                      className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? "ring-2 ring-offset-2 ring-zinc-900 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Save changes" : "Create service"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Services list */}
      {services.length === 0 && !showForm ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Scissors className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 mb-4">No services yet. Add what you offer.</p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> Add first service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className="w-3 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: service.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-900">{service.name}</p>
                    {!service.isActive && (
                      <Badge variant="outline" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(service.durationMinutes)}
                    </span>
                    {service.price && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${service.price}
                      </span>
                    )}
                    <span>{service._count.appointments} bookings</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={service.isActive}
                    onCheckedChange={() => toggleActive(service.id, service.isActive)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(service)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteService(service.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
