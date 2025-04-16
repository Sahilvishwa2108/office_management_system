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
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
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

  // Load user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setUser(response.data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
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
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle user status toggle (block/unblock)
  const handleToggleUserStatus = async () => {
    if (!user) return;

    setActionLoading(true);

    // Determine what action we're performing based on current status
    // If user.isActive isn't false, the button says "Block User"
    const isBlocking = user.isActive !== false;
    // Toggle the status as before
    const newStatus = !user.isActive;

    try {
      await axios.patch(`/api/users/${userId}/status`, { isActive: newStatus });
      setUser({ ...user, isActive: newStatus });

      // Use the action we're performing to determine the toast message
      // rather than the new status value
      toast.success(`User ${isBlocking ? "blocked" : "activated"} successfully`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
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
          The requested user does not exist or you don&apos;t have permission to view
          it.
        </p>
        <Button asChild>
          <Link href="/dashboard/admin/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/dashboard/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/admin/users/${userId}/edit`}>
              <Edit className="h-4 w-4 mr-2" /> Edit User
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={handleToggleUserStatus}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Ban className="h-4 w-4 mr-2" />
            )}
            {user.isActive !== false ? "Block User" : "Unblock User"}
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/dashboard/admin/users/${userId}/reset-password`}>
              <Lock className="h-4 w-4 mr-2" /> Reset Password
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Delete User
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete this user and cannot be
                  undone.
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

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Detailed information about this user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </p>
              <p className="text-lg">{user.name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </p>
              <p className="text-lg">{user.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Role
              </p>
              <p className="text-lg">
                <Badge variant="secondary" className="font-normal text-sm">
                  {formatRole(user.role)}
                </Badge>
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Created At
              </p>
              <p className="text-lg">
                {format(new Date(user.createdAt), "PPP")}
              </p>
            </div>
          </div>

          <Separator />

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
        </CardContent>
      </Card>
    </div>
  );
}
