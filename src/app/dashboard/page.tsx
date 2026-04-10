import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, Clock, Zap, ArrowRight, Copy } from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";
import type { Metadata } from "next";
import type { Service } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: {
      services: { where: { isActive: true }, take: 3 },
      _count: {
        select: {
          appointments: true,
          contacts: true,
          waitlistEntries: true,
        },
      },
    },
  });
  if (!user) redirect("/onboarding");

  const upcomingCount = await prisma.appointment.count({
    where: { barberId: user.id, status: "UPCOMING" },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayCount = await prisma.appointment.count({
    where: {
      barberId: user.id,
      status: "UPCOMING",
      startTime: { gte: todayStart, lte: todayEnd },
    },
  });

  const waitingCount = await prisma.waitlistEntry.count({
    where: { barberId: user.id, status: "WAITING" },
  });

  const stats = [
    { label: "Today's appointments", value: todayCount, icon: CalendarDays },
    { label: "Upcoming total", value: upcomingCount, icon: Clock },
    { label: "In queue now", value: waitingCount, icon: Users },
    { label: "Total clients", value: user._count.contacts, icon: Zap },
  ];

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username}`;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Good {getGreeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-zinc-50 border rounded-lg px-3 py-2">
          <span className="text-zinc-500 text-xs">{publicUrl}</span>
          <button className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-zinc-500">{stat.label}</p>
                <stat.icon className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-900">Active services</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/services">
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>

        {user.services.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-zinc-500 text-sm mb-3">No services yet</p>
              <Button size="sm" asChild>
                <Link href="/dashboard/services">Add your first service</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(user.services as Service[]).map((service) => (
              <Card key={service.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-3 h-3 rounded-full mt-1 mr-2 shrink-0"
                      style={{ backgroundColor: service.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-zinc-900 truncate">{service.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {formatDuration(service.durationMinutes)}
                        {service.price ? ` · $${service.price}` : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link href="/dashboard/queue">
            <Card className="hover:border-zinc-400 transition-colors cursor-pointer">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" /> Manage walk-in queue
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/pool">
            <Card className="hover:border-zinc-400 transition-colors cursor-pointer">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Add open pool slots
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/dashboard/availability">
            <Card className="hover:border-zinc-400 transition-colors cursor-pointer">
              <CardHeader className="p-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Update availability
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
