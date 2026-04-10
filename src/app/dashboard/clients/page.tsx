import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Mail, Phone, Calendar } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (!user) redirect("/onboarding");

  const contacts = await prisma.contact.findMany({
    where: { barberId: user.id },
    orderBy: { lastBookedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Clients</h1>
        <p className="text-sm text-zinc-500 mt-1">{contacts.length} total clients</p>
      </div>

      {contacts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No clients yet</p>
            <p className="text-xs text-zinc-400 mt-1">
              Clients appear here automatically after they book
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="text-sm">{getInitials(contact.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900">{contact.name}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {contact.email}
                    </span>
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-zinc-900">
                    {contact.totalBookings} visit{contact.totalBookings !== 1 ? "s" : ""}
                  </p>
                  {contact.lastBookedAt && (
                    <p className="text-xs text-zinc-400 flex items-center justify-end gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(contact.lastBookedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
