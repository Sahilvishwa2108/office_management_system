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
  Home,
  Users,
  ClipboardList,
  MessageSquare,
  FileText,
  Settings,
  Briefcase,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  LayoutDashboard,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  role: string[];
  category?: string; // Optional category for grouping
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Close mobile nav when route changes
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const userRole = session?.user?.role || "";

  // Navigation items based on user role with categories
  const navItems: NavItem[] = [
    // Main navigation
    {
      title: "Dashboard",
      href: getRoleDashboardPath(userRole),
      icon: <LayoutDashboard className="h-6 w-6" />,
      role: [
        "ADMIN",
        "PARTNER",
        "BUSINESS_CONSULTANT",
        "BUSINESS_EXECUTIVE",
        "PERMANENT_CLIENT",
        "GUEST_CLIENT",
      ],
      category: "main",
    },
    // Management
    {
      title: "Users",
      href:
        userRole === "ADMIN"
          ? "/dashboard/admin/users"
          : "/dashboard/partner/users",
      icon: <Users className="h-6 w-6" />,
      role: ["ADMIN", "PARTNER"],
      category: "management",
    },
    {
      title: "Tasks",
      href:
        userRole === "ADMIN"
          ? "/dashboard/admin/tasks"
          : userRole === "PARTNER"
          ? "/dashboard/partner/tasks"
          : "/dashboard/tasks",
      icon: <ClipboardList className="h-6 w-6" />,
      role: ["ADMIN", "PARTNER", "BUSINESS_CONSULTANT", "BUSINESS_EXECUTIVE"],
      category: "management",
    },
    {
      title: "Clients",
      href: "/dashboard/admin/clients",
      icon: <Briefcase className="h-6 w-6" />,
      role: ["ADMIN"],
      category: "management",
    },
    // Services and resources
    {
      title: "Services",
      href: "/dashboard/client/services",
      icon: <Briefcase className="h-6 w-6" />,
      role: ["PERMANENT_CLIENT", "GUEST_CLIENT"],
      category: "resources",
    },
    {
      title: "Documents",
      href:
        userRole === "ADMIN"
          ? "/dashboard/admin/documents"
          : userRole === "PARTNER"
          ? "/dashboard/partner/documents"
          : userRole.includes("CLIENT")
          ? "/dashboard/client/documents"
          : "/dashboard/documents",
      icon: <FileText className="h-6 w-6" />,
      role: [
        "ADMIN",
        "PARTNER",
        "BUSINESS_CONSULTANT",
        "BUSINESS_EXECUTIVE",
        "PERMANENT_CLIENT",
        "GUEST_CLIENT",
      ],
      category: "resources",
    },
    // Communication
    {
      title: "Team Chat",
      href: "/dashboard/chat",
      icon: <MessageSquare className="h-6 w-6" />,
      role: [
        "ADMIN",
        "PARTNER",
        "BUSINESS_CONSULTANT",
        "BUSINESS_EXECUTIVE",
        "PERMANENT_CLIENT",
        "GUEST_CLIENT",
      ],
      category: "communication",
    },
    // Preferences
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-6 w-6" />,
      role: [
        "ADMIN",
        "PARTNER",
        "BUSINESS_CONSULTANT",
        "BUSINESS_EXECUTIVE",
        "PERMANENT_CLIENT",
        "GUEST_CLIENT",
      ],
      category: "preferences",
    },
  ];

  // Function to get visible nav items
  const getVisibleNavItems = () => {
    return navItems.filter((item) => item.role.includes(userRole));
  };

  // Helper to get correct dashboard path for role
  function getRoleDashboardPath(role: string) {
    switch (role) {
      case "ADMIN":
        return "/dashboard/admin";
      case "PARTNER":
        return "/dashboard/partner";
      case "BUSINESS_CONSULTANT":
      case "BUSINESS_EXECUTIVE":
        return "/dashboard/junior";
      case "PERMANENT_CLIENT":
      case "GUEST_CLIENT":
        return "/dashboard/client";
      default:
        return "/dashboard";
    }
  }

  // Get initials for avatar
  const getInitials = (name?: string) => {
    return (
      name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "??"
    );
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

  // Modified function to determine if a nav item is active (only one at a time)
  const isActiveNavItem = (itemHref: string) => {
    // For dashboard root paths like /dashboard/admin, only highlight when exact match
    if (itemHref.split("/").length === 3) {
      // e.g., /dashboard/admin
      return pathname === itemHref;
    }

    // For nested paths like /dashboard/admin/users, highlight when current or child routes
    return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
  };

  // NavItem component with tooltip support for collapsed mode
  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-base transition-colors",
          sidebarCollapsed && "justify-center",
          isActiveNavItem(item.href)
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        {item.icon}
        {!sidebarCollapsed && <span>{item.title}</span>}
      </Link>
    );

    if (sidebarCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <div className="flex flex-1">
        {/* Fixed Sidebar */}
        <div
          className={cn(
            "hidden fixed top-0 bottom-0 flex-col border-r bg-card transition-all duration-300 lg:flex",
            sidebarCollapsed ? "w-20" : "w-64"
          )}
        >
          {/* Toggle collapse button - now centered vertically */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-6 w-6 -mr-3 rounded-full border bg-background shadow-sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>

          <div className="flex h-14 items-center border-b px-4">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 font-semibold",
                sidebarCollapsed && "justify-center w-full"
              )}
            >
              <Building2 className="h-6 w-6" />
              {!sidebarCollapsed && <span>Office Manager</span>}
            </Link>
          </div>

          <ScrollArea className="flex-1 py-2">
            <nav className="grid gap-1 px-2">
              {getVisibleNavItems().map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </nav>
          </ScrollArea>

          <div className="mt-auto border-t p-4">
            <div
              className={cn(
                "flex items-center gap-3 rounded-md p-2",
                sidebarCollapsed && "flex-col"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name}`}
                  alt={session?.user?.name}
                />
                <AvatarFallback>
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex flex-1 flex-col truncate">
                  <span className="truncate text-sm font-medium">
                    {session?.user?.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {session?.user?.email}
                  </span>
                </div>
              )}
              {sidebarCollapsed ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          signOut({ redirect: true, callbackUrl: "/login" })
                        }
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Log out</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Log out</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-8 w-8"
                  onClick={() =>
                    signOut({ redirect: true, callbackUrl: "/login" })
                  }
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Log out</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main content with margin to account for sidebar */}
        <div
          className={cn(
            "flex flex-1 flex-col",
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          )}
        >
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
                <Building2 className="h-6 w-6" />
                Office
              </Link>
            </div>
          </header>

          {/* Dashboard header */}
          <DashboardHeader />

          {/* Main content */}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>

        {/* Mobile navigation overlay */}
        <div
          className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
            isMobileNavOpen ? "block" : "hidden"
          )}
        >
          <div className="fixed left-0 top-0 h-full w-72 bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Building2 className="h-6 w-6" />
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
                {getVisibleNavItems().map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-base transition-colors",
                      item.href.split("/").length === 3
                        ? pathname === item.href
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`)
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
                    <AvatarFallback>
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
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
      </div>
    </div>
  );
}
