"use client";

import { useState, useEffect } from "react";
import React from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCheck,
  Hourglass,
  CircleDashed,
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
  taskAssignments?: { task: Task }[];
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

  // Get task status icon
  const getTaskStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCheck className="h-4 w-4 text-green-500" />;
      case "in progress":
        return <Hourglass className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <CircleDashed className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="container mx-auto py-6 space-y-8 max-w-7xl px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboard/partner/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                  }
                  alt={user.name}
                />
                <AvatarFallback className="text-3xl font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Badge className={user.isActive !== false ? "bg-green-500" : "bg-red-500"}>
                {user.isActive !== false ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </p>
                <p className="text-xl font-semibold">{user.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </p>
                <Badge variant="outline" className="font-medium text-sm mt-1 px-3 py-1">
                  {formatRole(user.role)}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </p>
                <p className="text-lg break-all">{user.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </p>
                <p className="text-base">
                  {format(new Date(user.createdAt), "PP")}
                </p>
              </div>
            </div>
          </div>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <ClipboardList className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Tasks Assigned</p>
                <p className="text-xl font-bold">{user.taskAssignments?.length || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Clock className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-base">
                  {format(new Date(user.updatedAt), "PP")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Tasks Section */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Assigned Tasks
          </h2>
          <Badge variant="outline" className="text-sm py-1 px-3">
            {user.taskAssignments?.length || 0} Total
          </Badge>
        </div>

        {user.taskAssignments && user.taskAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.taskAssignments.map((assignment, index) => (
              <div 
                key={assignment.task.id} 
                className="task-card opacity-0 translate-y-4"
                style={{
                  animation: `fadeIn 0.5s ease forwards ${index * 0.05}s`
                }}
              >
                <Link 
                  href={`/dashboard/tasks/${assignment.task.id}`}
                  className="block h-full"
                >
                  <Card className="h-full border transition-all duration-300 hover:shadow-md hover:border-primary/20 cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-2">{assignment.task.title}</CardTitle>
                        <div className="flex items-center">
                          {getTaskStatusIcon(assignment.task.status)}
                        </div>
                      </div>
                      {assignment.task.dueDate && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(assignment.task.dueDate), "PP")}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {assignment.task.description || "No description provided."}
                      </p>
                    </CardContent>
                    
                    <CardFooter className="pt-0 flex justify-between items-center">
                      <Badge variant="outline">
                        {assignment.task.status}
                      </Badge>
                      <Badge variant={getPriorityVariant(assignment.task.priority)}>
                        {assignment.task.priority}
                      </Badge>
                    </CardFooter>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-muted/30 rounded-lg border border-dashed">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No Tasks Assigned</h3>
            <p className="text-muted-foreground">
              This user currently doesn't have any tasks assigned.
            </p>
          </div>
        )}
      </div>

      {/* Add CSS animations without framer-motion */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .task-card {
          will-change: opacity, transform;
        }
      `}</style>
    </div>
  );
}