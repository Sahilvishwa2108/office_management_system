"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardListIcon, MessageSquareIcon, BellIcon } from "lucide-react";

export default function JuniorDashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ClipboardListIcon className="h-5 w-5" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and update your assigned tasks</p>
            <Link href="/dashboard/tasks">
              <Button className="w-full">View Tasks</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5" />
              Team Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Communicate with your team</p>
            <Link href="/dashboard/chat">
              <Button className="w-full">Open Chat</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View your notifications</p>
            <Link href="/dashboard/notifications">
              <Button className="w-full">View Notifications</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">Welcome, {session?.user?.name}!</p>
          <p className="text-muted-foreground">You are logged in as a {session?.user?.role?.toLowerCase().replace('_', ' ')}</p>
        </CardContent>
      </Card>
    </div>
  );
}