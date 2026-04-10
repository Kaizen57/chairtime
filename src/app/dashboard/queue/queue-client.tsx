"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, Bell, CheckCircle, UserX, Clock, QrCode, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { WaitlistEntry } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface QueueClientProps {
  userId: string;
  shopId: string | null;
  initialEntries: WaitlistEntry[];
}

export function QueueClient({ userId, shopId, initialEntries }: QueueClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [loading, setLoading] = useState<string | null>(null);

  // Real-time updates via Supabase
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "WaitlistEntry",
          filter: `barberId=eq.${userId}`,
        },
        () => {
          // Refresh queue on any change
          fetch("/api/queue")
            .then((r) => r.json())
            .then((data) => setEntries(data));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function callNext() {
    const waiting = entries.find((e) => e.status === "WAITING");
    if (!waiting) return;
    await updateStatus(waiting.id, "CALLED");
    toast.success(`Calling ${waiting.attendeeName}`);
  }

  async function markServed(id: string) {
    await updateStatus(id, "SERVED");
  }

  async function markLeft(id: string) {
    await updateStatus(id, "LEFT");
  }

  async function updateStatus(id: string, status: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setEntries((prev) =>
        prev
          .map((e) => (e.id === id ? { ...e, status: status as WaitlistEntry["status"] } : e))
          .filter((e) => e.status === "WAITING" || e.status === "CALLED")
      );
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(null);
    }
  }

  const waiting = entries.filter((e) => e.status === "WAITING");
  const called = entries.filter((e) => e.status === "CALLED");
  const queueUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/queue/${userId}`;

  function copyQueueLink() {
    navigator.clipboard.writeText(queueUrl);
    toast.success("Queue link copied!");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Walk-in Queue</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {entries.length === 0
              ? "No one in queue"
              : `${waiting.length} waiting · ${called.length} called`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyQueueLink}>
            <QrCode className="w-4 h-4" /> Copy check-in link
          </Button>
          <Button size="sm" onClick={callNext} disabled={waiting.length === 0}>
            <Bell className="w-4 h-4" /> Call next
          </Button>
        </div>
      </div>

      {/* Called */}
      {called.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">Now serving</h2>
          <div className="space-y-2">
            {called.map((entry) => (
              <Card key={entry.id} className="border-green-200 bg-green-50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {entry.attendeeName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-900">{entry.attendeeName}</p>
                    <p className="text-xs text-zinc-500">
                      {entry.attendeePhone && <span className="mr-2">{entry.attendeePhone}</span>}
                      {entry.serviceNote && <span>{entry.serviceNote}</span>}
                    </p>
                  </div>
                  <Badge variant="success">Called</Badge>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => markServed(entry.id)} disabled={loading === entry.id}>
                      <CheckCircle className="w-3.5 h-3.5" /> Done
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => markLeft(entry.id)} disabled={loading === entry.id}>
                      <UserX className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Waiting */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
          Waiting ({waiting.length})
        </h2>
        {waiting.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Queue is empty</p>
              <p className="text-xs text-zinc-400 mt-1">
                Share your check-in link so clients can join
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={copyQueueLink}>
                <Copy className="w-3.5 h-3.5" /> Copy check-in link
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {waiting.map((entry, index) => (
              <Card key={entry.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-500 shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900">{entry.attendeeName}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(entry.checkedInAt), { addSuffix: true })}
                      </span>
                      {entry.serviceNote && <span>· {entry.serviceNote}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markLeft(entry.id)}
                    disabled={loading === entry.id}
                  >
                    <UserX className="w-3.5 h-3.5" /> Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
