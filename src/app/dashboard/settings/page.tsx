"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserIcon, KeyIcon, BellIcon, SettingsIcon, ChevronRightIcon } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
      
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Manage your personal information and how it appears across the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/settings/profile" className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded">
                      <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Profile Information</p>
                      <p className="text-sm text-muted-foreground">Manage your profile details</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </Link>
                
                <Link href="/dashboard/settings/reset-password" className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900 rounded">
                      <KeyIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">Update your password</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Show security section for admins/partners */}
          {(session?.user?.role === "ADMIN" || session?.user?.role === "PARTNER") && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage security-related settings and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/dashboard/settings/security" className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 dark:bg-red-900 rounded">
                        <SettingsIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium">Security Settings</p>
                        <p className="text-sm text-muted-foreground">Manage security preferences</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  
                  <Link href="/dashboard/settings/access-logs" className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 dark:bg-green-900 rounded">
                        <SettingsIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">Access Logs</p>
                        <p className="text-sm text-muted-foreground">View system access history</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>User Interface Preferences</CardTitle>
              <CardDescription>
                Customize how the application looks and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/settings/appearance" className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900 rounded">
                      <SettingsIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">Appearance</p>
                      <p className="text-sm text-muted-foreground">Customize theme and layout</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </Link>
                
                <Link href="/dashboard/settings/dashboard" className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900 rounded">
                      <SettingsIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium">Dashboard Layout</p>
                      <p className="text-sm text-muted-foreground">Customize your dashboard</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/settings/notifications/system" className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded">
                      <BellIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">System Notifications</p>
                      <p className="text-sm text-muted-foreground">In-app notification settings</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </Link>
                
                <Link href="/dashboard/settings/notifications/email" className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900 rounded">
                      <BellIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Email delivery preferences</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}