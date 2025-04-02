"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function JuniorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Current page from pathname
  const getCurrentPageName = () => {
    const path = pathname.split('/').filter(Boolean);
    const currentPage = path[path.length - 1];
    return currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs 
        segments={[
          { name: "Dashboard", href: "/dashboard/junior" },
          { name: getCurrentPageName(), href: pathname }
        ]} 
        className="px-1"
      />
      {children}
    </div>
  );
}