"use client";

import { useState, useEffect } from "react";
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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useRouter } from "next/navigation";
import { SunIcon, MoonIcon, CloudSunIcon, Maximize, Minimize } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeader() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === "loading";
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    
    // Initial check on mount
    setIsFullScreen(!!document.fullscreenElement);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      // Enter full screen
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      // Exit full screen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (name?: string | null) => {
    return name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "U";
  };

  // Get user's first name or username from email
  const getDisplayName = () => {
    if (session?.user?.name) {
      return session.user.name.split(" ")[0];
    } else if (session?.user?.email) {
      return session.user.email.split("@")[0];
    }
    return "User";
  };

  // Get greeting based on time of day (IST timezone)
  const getGreeting = () => {
    // Get current UTC time
    const now = new Date();
    
    // Calculate IST hour (UTC+5:30)
    let istHour = (now.getUTCHours() + 5) % 24;
    if (now.getUTCMinutes() + 30 >= 60) {
      istHour = (istHour + 1) % 24;
    }
    
    if (istHour < 12) return "Good morning";
    if (istHour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get time-appropriate icon
  const getGreetingIcon = () => {
    // Get current UTC time
    const now = new Date();
    
    // Calculate IST hour (UTC+5:30)
    let istHour = (now.getUTCHours() + 5) % 24;
    if (now.getUTCMinutes() + 30 >= 60) {
      istHour = (istHour + 1) % 24;
    }
    
    if (istHour < 12) return <SunIcon className="h-4 w-4 mr-2 text-amber-400" />;
    if (istHour < 17) return <CloudSunIcon className="h-4 w-4 mr-2 text-blue-400" />;
    return <MoonIcon className="h-4 w-4 mr-2 text-indigo-400" />;
  };

  return (
    <div className="hidden h-14 items-center border-b px-4 lg:flex">
      {/* Left section with greeting */}
      <div className="flex-1">
        <div className="inline-flex items-center px-4 py-1.5 text-muted-foreground">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <>
              {getGreetingIcon()}
              <span className="text-sm">
                {getGreeting()}, {getDisplayName()}!
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center justify-end gap-3">
        {/* Full Screen Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={toggleFullScreen}
          title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {isFullScreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
          </span>
        </Button>
        
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              {isLoading ? (
                <Skeleton className="h-9 w-9 rounded-full" />
              ) : (
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={
                      session?.user?.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name}`
                    }
                    alt={session?.user?.name || "User"}
                  />
                  <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
                </Avatar>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            {isLoading ? (
              <div className="px-2 py-1.5 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <>
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
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}