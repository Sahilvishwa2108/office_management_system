"use client";

import { useState, useEffect } from "react";
import React from "react"; // Add this import
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface UserParams {
  id: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  assignedTasks: Task[];
}

export default function PartnerUserDetailsPage({
  params,
}: {
  params: Promise<UserParams> | UserParams;
}) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Properly unwrap params using React.use()
  const unwrappedParams = React.use(params as Promise<UserParams>);
  const userId = unwrappedParams.id;

  // Format the user role for display
  const formatRole = (role: string) => {
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Load user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setUser(response.data);
      } catch (error: unknown) {
        const typedError = error as { response?: { data?: { error?: string } } };
        toast.error("Failed to load user details");
        console.error(typedError);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error state if user not found
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The requested user does not exist or you don&apos;t have permission to
          view it.
        </p>
        <Button asChild>
          <Link href="/dashboard/partner/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  // Only show if user role is junior staff
  if (
    user.role !== "BUSINESS_EXECUTIVE" &&
    user.role !== "BUSINESS_CONSULTANT"
  ) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You can only view details of junior staff members.
        </p>
        <Button asChild>
          <Link href="/dashboard/partner/users">Back to Users</Link>
        </Button>
      </div>
    );
  }
  return (
    <>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/dashboard/partner/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">User Details</h1>
          </div>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Detailed information about this junior staff member
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* First Column: Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage
                    src={
                      user.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                    }
                    alt={user.name}
                  />
                  <AvatarFallback className="text-2xl">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
  
              {/* Second Column: Full Name and Role */}
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </p>
                <p className="text-lg">{user.name}</p>
  
                <p className="text-sm font-medium flex items-center gap-2 mt-4">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Role
                </p>
                <p className="text-lg">
                  <Badge variant="secondary" className="font-normal text-sm">
                    {formatRole(user.role)}
                  </Badge>
                </p>
              </div>
  
              {/* Third Column: Email and Created At */}
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </p>
                <p className="text-lg">{user.email}</p>
  
                <p className="text-sm font-medium flex items-center gap-2 mt-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Created At
                </p>
                <p className="text-lg">
                  {format(new Date(user.createdAt), "PPP")}
                </p>
              </div>
            </div>
  
            {/* Separator and Status Section */}
            <div className="mt-6">
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  <p>
                    {user.isActive !== false ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Assigned Tasks</p>
                  <p>
                    <Badge variant="secondary">
                      {user.assignedTasks.length} Task
                      {user.assignedTasks.length !== 1 ? "s" : ""}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  
      {/* Assigned Tasks Section */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Assigned Tasks</h2>
        {user.assignedTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.assignedTasks.map((task) => (
              <Card key={task.id} className="border">
                <CardHeader>
                  <CardTitle>{task.title}</CardTitle>
                  <CardDescription>
                    {task.dueDate
                      ? `Due: ${format(new Date(task.dueDate), "PPP")}`
                      : "No due date"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {task.description || "No description provided."}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "secondary"
                          : task.status === "pending"
                          ? "outline"
                          : "default"
                      }
                    >
                      {task.status}
                    </Badge>
                    <Badge variant="secondary">{task.priority}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No tasks assigned to this user.
          </p>
        )}
      </div>
    </>
  );
}