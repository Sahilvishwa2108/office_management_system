"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Get home dashboard path based on user role
  const getHomeDashboard = () => {
    switch (session?.user?.role) {
      case "ADMIN": return "/dashboard/admin";
      case "PARTNER": return "/dashboard/partner";
      case "BUSINESS_EXECUTIVE":
      case "BUSINESS_CONSULTANT": return "/dashboard/junior";
      default: return "/dashboard";
    }
  };

  // Build breadcrumb segments for chat pages
  const getBreadcrumbSegments = () => {
    const segments = [
      { name: "Dashboard", href: getHomeDashboard() },
      { name: "Chat Room", href: "/dashboard/chat" }
    ];

    // Add any deeper path segments if needed
    const pathParts = pathname.split('/');
    if (pathParts.length > 3 && pathParts[3]) {
      const pageName = pathParts[3].charAt(0).toUpperCase() + pathParts[3].slice(1);
      segments.push({ name: pageName, href: pathname });
    }
    
    return segments;
  };

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs 
        segments={getBreadcrumbSegments()} 
        className="px-1"
      />
      {children}
    </div>
  );
}