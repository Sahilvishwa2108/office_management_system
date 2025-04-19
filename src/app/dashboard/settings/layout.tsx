"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Get home dashboard path based on user role
  const getHomeDashboard = () => {
    switch (session?.user?.role) {
      case "ADMIN":
        return "/dashboard/admin";
      case "PARTNER":
        return "/dashboard/partner";
      case "BUSINESS_EXECUTIVE":
      case "BUSINESS_CONSULTANT":
        return "/dashboard/junior";
      default:
        return "/dashboard";
    }
  };

  // Build breadcrumb segments for settings pages
  const getBreadcrumbSegments = () => {
    const segments = [
      { name: "Dashboard", href: getHomeDashboard() },
      { name: "Settings", href: "/dashboard/settings" },
    ];

    // Add third level segment if needed
    const pathParts = pathname.split("/");
    if (pathParts.length > 3 && pathParts[3]) {
      const pageName =
        pathParts[3].charAt(0).toUpperCase() + pathParts[3].slice(1);
      const formattedName = pageName.replace(/-/g, " ");
      segments.push({ name: formattedName, href: pathname });
    }

    return segments;
  };

  const settingsTabs = [
    {
      value: "profile",
      label: "Profile",
      href: "/dashboard/settings/profile",
    },
    {
      value: "reset-password",
      label: "Password",
      href: "/dashboard/settings/reset-password",
    },
    {
      value: "notifications",
      label: "Notifications",
      href: "/dashboard/settings/notifications",
    },
    // Show the "Permissions" tab only if the user is an admin
    ...(session?.user?.role === "ADMIN"
      ? [
          {
            value: "permissions",
            label: "Permissions",
            href: "/dashboard/settings/permissions",
          },
        ]
      : []),
    // Add other available settings tabs here
  ];

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-8">
      {/* Add breadcrumbs at the top */}
      <Breadcrumbs segments={getBreadcrumbSegments()} className="px-1" />

      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue={pathname.split("/").pop()} className="space-y-6">
        <TabsList
          className={cn(
            `grid h-auto p-1`,
            `grid-cols-${settingsTabs.length}` // Dynamically set the number of columns
          )}
        >
          {settingsTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "py-2 data-[state=active]:shadow-none",
                pathname === tab.href && "bg-muted"
              )}
              asChild
            >
              <Link href={tab.href}>{tab.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
        <div>{children}</div>
      </Tabs>
    </div>
  );
}
