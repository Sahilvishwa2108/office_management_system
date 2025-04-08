"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const settingsTabs = [
    {
      value: "profile",
      label: "Profile",
      href: "/dashboard/settings/profile"
    },
    {
      value: "reset-password",
      label: "Password",
      href: "/dashboard/settings/reset-password"
    },
    {
      value: "notifications",
      label: "Notifications",
      href: "/dashboard/settings/notifications"
    },
    // Add other available settings tabs here
  ];

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue={pathname.split('/').pop()} className="space-y-6">
        <TabsList className="grid grid-cols-3 h-auto p-1">
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