"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerDashboard() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Partner Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Junior Staff Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Create and manage junior staff members</p>
            <Link href="/dashboard/partner/users/create">
              <Button className="w-full">Create Junior Staff</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tasks Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Assign and manage tasks for junior staff</p>
            <Link href="/dashboard/partner/tasks">
              <Button className="w-full">Manage Tasks</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Team Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Communicate with your team</p>
            <Link href="/dashboard/chat">
              <Button className="w-full">Open Chat</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, {session?.user?.name}!</p>
          <p>Role: {session?.user?.role}</p>
        </CardContent>
      </Card>
    </div>
  );
}