"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
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

  // Build breadcrumb segments
  const getBreadcrumbSegments = () => {
    const segments = [
      { name: "Dashboard", href: getHomeDashboard() },
      { name: "Tasks", href: "/dashboard/tasks" }
    ];

    // Add task details segment if path contains ID
    const pathParts = pathname.split('/');
    if (pathParts.length > 3) { // More than /dashboard/tasks
      if (pathParts[3] === 'create') {
        segments.push({ name: "Create Task", href: pathname });
      } 
      else if (pathParts[3]) {
        // Handle task ID path
        if (pathParts.length > 4) {
          // This is a deeper path like edit or reassign
          const action = pathParts[4].charAt(0).toUpperCase() + pathParts[4].slice(1);
          segments.push({ name: "Task Details", href: `/dashboard/tasks/${pathParts[3]}` });
          segments.push({ name: action, href: pathname });
        } else {
          segments.push({ name: "Task Details", href: pathname });
        }
      }
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