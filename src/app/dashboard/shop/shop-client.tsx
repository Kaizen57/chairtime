"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Store, UserPlus, Loader2, Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

interface Member {
  id: string;
  isActive: boolean;
  user: { id: string; name: string; email: string; username: string; photoUrl: string | null };
}

interface Shop {
  id: string;
  name: string;
  slug: string;
  members: Member[];
}

interface ShopClientProps {
  shop: Shop | null;
  userId: string;
}

export function ShopClient({ shop: initialShop, userId }: ShopClientProps) {
  const [shop, setShop] = useState(initialShop);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  async function invite() {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch("/api/shop/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to invite");
      }
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to invite");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this barber from the shop?")) return;
    const res = await fetch(`/api/shop/members/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setShop((s) => s ? { ...s, members: s.members.filter((m) => m.user.id !== userId) } : s);
      toast.success("Member removed");
    }
  }

  const shopUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${shop?.slug}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Shop</h1>
        {shop && (
          <p className="text-sm text-zinc-500 mt-1">{shop.name}</p>
        )}
      </div>

      {shop && (
        <>
          {/* Shop URL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="w-4 h-4" /> Public shop page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2">
                <span className="text-sm text-zinc-600 flex-1 truncate">{shopUrl}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(shopUrl); toast.success("Copied!"); }}
                  className="text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Team members */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" /> Team ({shop.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invite */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="barber@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && invite()}
                />
                <Button onClick={invite} disabled={inviting}>
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Invite
                </Button>
              </div>

              {/* Members list */}
              <div className="space-y-2">
                {shop.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 py-1.5">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={member.user.photoUrl ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(member.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{member.user.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{member.user.email}</p>
                    </div>
                    {member.user.id === userId ? (
                      <Badge variant="secondary">Owner</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeMember(member.user.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
