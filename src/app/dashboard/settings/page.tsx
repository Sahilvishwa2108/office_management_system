"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, KeyRound, Bell, Shield } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Update your personal information and profile details</p>
            <Link href="/dashboard/settings/profile">
              <Button className="w-full">Manage Profile</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Change your password and security settings</p>
            <Link href="/dashboard/settings/reset-password">
              <Button className="w-full">Change Password</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Manage how you receive notifications</p>
            <Link href="/dashboard/settings/notifications">
              <Button className="w-full">Manage Notifications</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}