"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, ClipboardListIcon, BriefcaseIcon } from "lucide-react";

export default function AdminDashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Create and manage users across all roles</p>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/admin/users/create">
                <Button className="w-full">Create New User</Button>
              </Link>
              <Link href="/dashboard/admin/users">
                <Button variant="outline" className="w-full">View All Users</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ClipboardListIcon className="h-5 w-5" />
              Tasks Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and assign tasks to team members</p>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/admin/tasks/create">
                <Button className="w-full">Create New Task</Button>
              </Link>
              <Link href="/dashboard/admin/tasks">
                <Button variant="outline" className="w-full">View All Tasks</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5" />
              Client Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and manage client information</p>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard/admin/clients/create">
                <Button className="w-full">Add New Client</Button>
              </Link>
              <Link href="/dashboard/admin/clients">
                <Button variant="outline" className="w-full">View All Clients</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">Welcome, {session?.user?.name}!</p>
          <p className="text-muted-foreground">You are logged in as an Administrator</p>
        </CardContent>
      </Card>
    </div>
  );
}