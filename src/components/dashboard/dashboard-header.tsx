"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-system";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const { data: session } = useSession();
  const router = useRouter();

  // Get user initials for avatar fallback
  const getInitials = (name?: string) => {
    return name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "U";
  };

  return (
    <div className="hidden h-14 items-center justify-between border-b px-4 lg:flex">
      {/* Empty div for spacing or future content */}
      <div className="flex-1"></div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center text-sm text-muted-foreground mr-2">
          <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
        </div>

        <ThemeToggle />

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={
                    session?.user?.image ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name}`
                  }
                  alt={session?.user?.name || "User"}
                />
                <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings/profile")}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}