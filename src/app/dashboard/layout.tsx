"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { 
  LayoutDashboard, Users, ClipboardList, MessageSquare, 
  Settings, LogOut, BellRing, FileText, Briefcase 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    // Initial check
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const adminNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
      role: ["ADMIN"],
    },
    {
      title: "User Management",
      href: "/dashboard/admin/users",
      icon: <Users className="h-5 w-5" />,
      role: ["ADMIN"],
    },
    {
      title: "Task Management",
      href: "/dashboard/admin/tasks",
      icon: <ClipboardList className="h-5 w-5" />,
      role: ["ADMIN"],
    },
    {
      title: "Client Management",
      href: "/dashboard/admin/clients",
      icon: <Briefcase className="h-5 w-5" />,
      role: ["ADMIN"],
    },
  ];

  const partnerNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard/partner",
      icon: <LayoutDashboard className="h-5 w-5" />,
      role: ["PARTNER"],
    },
    {
      title: "Junior Staff",
      href: "/dashboard/partner/users",
      icon: <Users className="h-5 w-5" />,
      role: ["PARTNER"],
    },
    {
      title: "Task Management",
      href: "/dashboard/partner/tasks",
      icon: <ClipboardList className="h-5 w-5" />,
      role: ["PARTNER"],
    },
  ];

  const juniorNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      role: ["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"],
    },
    {
      title: "My Tasks",
      href: "/dashboard/tasks",
      icon: <ClipboardList className="h-5 w-5" />,
      role: ["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"],
    },
  ];

  const clientNavItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard/client",
      icon: <LayoutDashboard className="h-5 w-5" />,
      role: ["PERMANENT_CLIENT", "GUEST_CLIENT"],
    },
    {
      title: "Documents",
      href: "/dashboard/client/documents",
      icon: <FileText className="h-5 w-5" />,
      role: ["PERMANENT_CLIENT", "GUEST_CLIENT"],
    },
  ];

  const commonNavItems: NavItem[] = [
    {
      title: "Chat",
      href: "/dashboard/chat",
      icon: <MessageSquare className="h-5 w-5" />,
      role: ["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT", "PERMANENT_CLIENT"],
    },
    {
      title: "Notifications",
      href: "/dashboard/notifications",
      icon: <BellRing className="h-5 w-5" />,
      role: ["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT", "PERMANENT_CLIENT", "GUEST_CLIENT"],
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      role: ["ADMIN", "PARTNER", "BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT", "PERMANENT_CLIENT", "GUEST_CLIENT"],
    },
  ];

  // Determine navigation items based on user role
  let navItems: NavItem[] = [];
  
  if (status === "authenticated" && session?.user?.role) {
    const userRole = session.user.role as string;
    
    if (userRole === "ADMIN") {
      navItems = [...adminNavItems, ...commonNavItems];
    } else if (userRole === "PARTNER") {
      navItems = [...partnerNavItems, ...commonNavItems];
    } else if (["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"].includes(userRole)) {
      navItems = [...juniorNavItems, ...commonNavItems];
    } else if (["PERMANENT_CLIENT", "GUEST_CLIENT"].includes(userRole)) {
      navItems = [...clientNavItems, ...commonNavItems];
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    toast.success("Logged out successfully");
    window.location.href = "/login";
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r bg-background p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">You need to be logged in to access this page</h1>
          <Button asChild>
            <a href="/login">Go to Login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar 
        navItems={navItems}
        pathname={pathname}
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        userName={session?.user?.name || "User"}
        userEmail={session?.user?.email || ""}
        userRole={session?.user?.role as string || ""}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}