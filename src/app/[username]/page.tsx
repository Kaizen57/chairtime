import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, Clock, Users, Zap } from "lucide-react";
import { formatDuration, getInitials } from "@/lib/utils";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `Book with ${username} | ChairTime` };
}

export default async function BarberPublicPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const barber = await prisma.user.findUnique({
    where: { username },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!barber) notFound();

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center">
            <Scissors className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm">ChairTime</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* Barber Profile */}
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={barber.photoUrl ?? undefined} />
            <AvatarFallback className="text-lg">{getInitials(barber.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{barber.name}</h1>
            {barber.bio && <p className="text-zinc-500 mt-0.5">{barber.bio}</p>}
          </div>
        </div>

        {/* Booking options */}
        <div className="space-y-3">
          {/* Walk-in queue link */}
          <Link href={`/queue/${barber.id}`}>
            <Card className="hover:border-zinc-400 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-zinc-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-900">Join Walk-in Queue</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Check in and wait your turn</p>
                </div>
                <Badge variant="outline">Walk-in</Badge>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Services */}
        {barber.services.length > 0 && (
          <div>
            <h2 className="font-semibold text-zinc-900 mb-3">Book an appointment</h2>
            <div className="space-y-2">
              {barber.services.map((service) => (
                <Link key={service.id} href={`/${username}/${service.slug}`}>
                  <Card className="hover:border-zinc-400 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div
                        className="w-3 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: service.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900">{service.name}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(service.durationMinutes)}
                          </span>
                          {service.price && <span>· ${service.price}</span>}
                          {service.description && <span>· {service.description}</span>}
                        </div>
                      </div>
                      <span className="text-zinc-400 text-sm">→</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
