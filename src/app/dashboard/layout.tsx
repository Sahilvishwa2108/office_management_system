"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { 
  Home, Users, ClipboardList, MessageSquare, FileText, 
  Settings, Briefcase, LogOut, ChevronDown, Menu, X
} from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  role: string[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Close mobile nav when route changes
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const userRole = session?.user?.role || "";
  
  // Navigation items based on user role
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: getRoleDashboardPath(userRole),
      icon: <Home className="h-5 w-5" />,
      role: ["ADMIN", "PARTNER", "BUSINESS_CONSULTANT", "BUSINESS_EXECUTIVE", "PERMANENT_CLIENT", "GUEST_CLIENT"],
    },
    {
      title: "Users",
      href: userRole === "ADMIN" ? "/dashboard/admin/users" : "/dashboard/partner/users",
      icon: <Users className="h-5 w-5" />,
      role: ["ADMIN", "PARTNER"],
    },
    {
      title: "Tasks",
      href: userRole === "ADMIN" ? "/dashboard/admin/tasks" : 
            userRole === "PARTNER" ? "/dashboard/partner/tasks" : "/dashboard/tasks",
      icon: <ClipboardList className="h-5 w-5" />,
      role: ["ADMIN", "PARTNER", "BUSINESS_CONSULTANT", "BUSINESS_EXECUTIVE"],
    },
    {
      title: "Clients",
      href: "/dashboard/admin/clients",
      icon: <Briefcase className="h-5 w-5" />,
      role: ["ADMIN"],
    },
    {
      title: "Services",
      href: "/dashboard/client/services",
      icon: <Briefcase className="h-5 w-5" />,
      role: ["PERMANENT_CLIENT", "GUEST_CLIENT"],
    },
    {
      title: "Documents",
      href: userRole === "ADMIN" ? "/dashboard/admin/documents" : 
            userRole === "PARTNER" ? "/dashboard/partner/documents" :
            userRole.includes("CLIENT") ? "/dashboard/client/documents" : "/dashboard/documents",
      icon: <FileText className="h-5 w-5" />,
      role: ["ADMIN", "PARTNER", "BUSINESS_CONSULTANT", "BUSINESS_EXECUTIVE", "PERMANENT_CLIENT", "GUEST_CLIENT"],
    },
    {
      title: "Messages",
      href: "/dashboard/chat",
      icon: <MessageSquare className="h-5 w-5" />,
      role: ["ADMIN", "PARTNER", "BUSINESS_CONSULTANT", "BUSINESS_EXECUTIVE", "PERMANENT_CLIENT", "GUEST_CLIENT"],
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      role: ["ADMIN", "PARTNER", "BUSINESS_CONSULTANT", "BUSINESS_EXECUTIVE", "PERMANENT_CLIENT", "GUEST_CLIENT"],
    },
  ];

  // Helper to get correct dashboard path for role
  function getRoleDashboardPath(role: string) {
    switch(role) {
      case "ADMIN": return "/dashboard/admin";
      case "PARTNER": return "/dashboard/partner";
      case "BUSINESS_CONSULTANT": 
      case "BUSINESS_EXECUTIVE": return "/dashboard/junior";
      case "PERMANENT_CLIENT":
      case "GUEST_CLIENT": return "/dashboard/client";
      default: return "/dashboard";
    }
  }
  
  // Get initials for avatar
  const getInitials = (name?: string) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not authenticated - shouldn't happen due to middleware
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <div className="hidden w-64 flex-col border-r bg-card lg:flex">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Office Manager</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 py-2">
            <nav className="grid gap-1 px-2">
              {navItems
                .filter((item) => item.role.includes(userRole))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
            </nav>
          </ScrollArea>
          <div className="mt-auto border-t p-4">
            <div className="flex items-center gap-3 rounded-md p-2">
              <Avatar className="h-9 w-9">
                <AvatarImage 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name}`} 
                  alt={session?.user?.name} 
                />
                <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col truncate">
                <span className="truncate text-sm font-medium">
                  {session?.user?.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8"
                onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile navigation */}
        <div className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
          isMobileNavOpen ? "block" : "hidden"
        )}>
          <div className="fixed left-0 top-0 h-full w-72 bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Office Manager</span>
              </Link>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100%-64px)]">
              <nav className="grid gap-1">
                {navItems
                  .filter((item) => item.role.includes(userRole))
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        pathname === item.href || pathname.startsWith(`${item.href}/`)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  ))}
              </nav>
              <div className="mt-6 border-t pt-4">
                <div className="flex items-center gap-3 rounded-md p-2">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name}`} 
                      alt={session?.user?.name} 
                    />
                    <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col truncate">
                    <span className="truncate text-sm font-medium">
                      {session?.user?.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.user?.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-2 w-full justify-start gap-2"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    signOut({ redirect: true, callbackUrl: "/login" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </ScrollArea>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background lg:hidden">
            <div className="flex items-center gap-2 px-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
              <Link href="/" className="flex items-center gap-1 font-semibold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Office
              </Link>
            </div>
          </header>
          
          {/* Desktop header */}
          <DashboardHeader />
          
          {/* Main content area */}
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}