"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Trash2,
  Lock,
  Ban,
  Edit,
  ClipboardList,
  Clock,
  AlertCircle,
  CheckCheck,
  Hourglass,
  CircleDashed,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserDetailSkeleton } from "@/components/loading/user-skeleton";
import React from "react";

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

export default function UserDetailsPage({
  params,
}: {
  params: Promise<UserParams>;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Properly unwrap params using React.use()
  const unwrappedParams = React.use(params);
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
        
        // Keep the original isActive value, don't convert it
        setUser(response.data);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        toast.error(errorMessage);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserDetails();
  }, [userId]);

  // Handle user deletion
  const handleDeleteUser = async () => {
    setActionLoading(true);
    try {
      await axios.delete(`/api/users/${userId}`);
      toast.success("User deleted successfully");
      router.push("/dashboard/admin/users");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle user status toggle (block/unblock)
  const handleToggleUserStatus = async () => {
    if (!user) return;
  
    setActionLoading(true);
    
    // Using the same pattern as in the user list page
    const currentStatus = user.isActive !== false;
    const newStatus = !currentStatus;
    
    try {
      await axios.patch(`/api/users/${userId}/status`, { isActive: newStatus });
      setUser({ ...user, isActive: newStatus });
      
      toast.success(
        `User ${newStatus ? "activated" : "blocked"} successfully`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return <UserDetailSkeleton />;
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
          <Link href="/dashboard/admin/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-7xl px-4">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/dashboard/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild className="group">
            <Link href={`/dashboard/admin/users/${userId}/edit`}>
              <Edit className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" /> Edit User
            </Link>
          </Button>

          <Button
  variant={user.isActive !== false ? "outline" : "secondary"}
  onClick={handleToggleUserStatus}
  disabled={actionLoading}
  className="transition-all"
>
  {actionLoading ? (
    <Loader2 className="h-4 w-4 animate-spin mr-2" />
  ) : user.isActive !== false ? (
    <Ban className="h-4 w-4 mr-2" />
  ) : (
    <CheckCheck className="h-4 w-4 mr-2" />
  )}
  {user.isActive !== false ? "Block User" : "Activate User"}
</Button>

          <Button variant="outline" asChild className="group">
            <Link href={`/dashboard/admin/users/${userId}/reset-password`}>
              <Lock className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" /> Reset Password
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" /> Delete User
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete this user and cannot be
                  undone. All associated data will be transferred to your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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
  {user.isActive !== false ? "Active" : "Blocked"}
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
                <p className="text-xl font-bold">{user.assignedTasks.length}</p>
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
            {user.assignedTasks.length} Total
          </Badge>
        </div>

        {user.assignedTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.assignedTasks.map((task, index) => (
              <div 
                key={task.id} 
                className="task-card opacity-0 translate-y-4"
                style={{
                  animation: `fadeIn 0.5s ease forwards ${index * 0.05}s`
                }}
              >
                <Link 
                  href={`/dashboard/tasks/${task.id}`}
                  className="block h-full"
                >
                  <Card className="h-full border transition-all duration-300 hover:shadow-md hover:border-primary/20 cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
                        <div className="flex items-center">
                          {getTaskStatusIcon(task.status)}
                        </div>
                      </div>
                      {task.dueDate && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.dueDate), "PP")}
                        </CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {task.description || "No description provided."}
                      </p>
                    </CardContent>
                    
                    <CardFooter className="pt-0 flex justify-between items-center">
                      <Badge variant="outline">
                        {task.status}
                      </Badge>
                      <Badge variant={getPriorityVariant(task.priority)}>
                        {task.priority}
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
              This user currently doesn&apos;t have any tasks assigned.
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
