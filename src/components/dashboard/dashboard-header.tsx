"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { BellIcon } from "lucide-react"; // Removed Search import
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
import { NotificationPanel } from "@/components/dashboard/notification-panel";

export function DashboardHeader() {
  const { data: session } = useSession();
  
  // Mock notifications for demo - would be fetched from API in real app
  const mockNotifications = [
    {
      id: "1",
      title: "Task assigned to you",
      description: "Financial reporting task was assigned to you",
      type: "info",
      read: false,
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      title: "Task completed",
      description: "Client documentation task was completed",
      type: "success",
      read: false,
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: "3", 
      title: "Deadline approaching",
      description: "Task due in 24 hours",
      type: "warning",
      read: true,
      timestamp: new Date(Date.now() - 86400000),
    }
  ];
  
  // Get user initials for avatar fallback
  const getInitials = (name?: string) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };
  
  const handleMarkNotificationRead = (id: string) => {
    console.log("Marking notification as read:", id);
    // Implement notification read functionality
  };
  
  const handleMarkAllNotificationsRead = () => {
    console.log("Marking all notifications as read");
    // Implement mark all as read functionality
  };
  
  const handleViewAllNotifications = () => {
    console.log("Viewing all notifications");
    // Navigate to notifications page
  };
  
  return (
    <div className="hidden h-14 items-center border-b px-4 lg:flex justify-end">
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center text-sm text-muted-foreground mr-2">
          <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
        </div>
        
        <ThemeToggle />
        
        <NotificationPanel 
          notifications={mockNotifications}
          onMarkAsRead={handleMarkNotificationRead}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
          onViewAll={handleViewAllNotifications}
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name}`} />
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
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings/profile">Profile</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings">Settings</a>
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