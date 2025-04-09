"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
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
      { name: "Clients", href: "/dashboard/clients" }
    ];

    // Parse the path to add additional segments
    const pathParts = pathname.split('/');
    
    if (pathParts.length > 3) {
      if (pathParts[3] === 'create') {
        segments.push({ name: "Add Permanent Client", href: pathname });
      } 
      else if (pathParts[3] === 'guest' && pathParts[4] === 'create') {
        segments.push({ name: "Add Guest Client", href: pathname });
      }
      // Client ID path
      else if (pathParts[3]) {
        // This is a client ID
        if (pathParts.length > 4) {
          // Check if it's an edit path or other action
          if (pathParts[4] === 'edit') {
            segments.push({ name: "Client Details", href: `/dashboard/clients/${pathParts[3]}` });
            segments.push({ name: "Edit", href: pathname });
          } 
          else if (pathParts[4] === 'documents' && pathParts[5] === 'upload') {
            segments.push({ name: "Client Details", href: `/dashboard/clients/${pathParts[3]}` });
            segments.push({ name: "Upload Document", href: pathname });
          }
        } else {
          segments.push({ name: "Client Details", href: pathname });
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