"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Create and manage users across all roles</p>
            <Link href="/dashboard/admin/users/create">
              <Button className="w-full">Create New User</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tasks Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and assign tasks to team members</p>
            <Link href="/dashboard/admin/tasks">
              <Button className="w-full">Manage Tasks</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Client Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and manage client information</p>
            <Link href="/dashboard/admin/clients">
              <Button className="w-full">Manage Clients</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, {session?.user?.name}!</p>
          <p>Role: {session?.user?.role}</p>
        </CardContent>
      </Card>
    </div>
  );
}