"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scissors,
  CalendarDays,
  LayoutDashboard,
  Clock,
  Zap,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import type { User } from "@/types";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/services", label: "Services", icon: Scissors },
  { href: "/dashboard/availability", label: "Availability", icon: Clock },
  { href: "/dashboard/queue", label: "Walk-in Queue", icon: Users },
  { href: "/dashboard/pool", label: "Open Pool", icon: Zap },
  { href: "/dashboard/clients", label: "Clients", icon: BookOpen },
  { href: "/dashboard/shop", label: "Shop", icon: Store },
];

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base">ChairTime</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-0.5">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>

        <div className="flex items-center gap-3 px-3 py-2 mt-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.photoUrl ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 truncate">@{user.username}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-zinc-400 hover:text-zinc-700 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
