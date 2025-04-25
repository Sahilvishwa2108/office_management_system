"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  UserPlus,
  Search,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  MoreHorizontal,
  KeyIcon,
  FilterX,
  Trash,
  ClipboardPlus, // Add this import
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { UserCount } from "@/components/dashboard/user-count";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleFilter } from "@/components/ui/role-filter";
import React from "react";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { AssignTaskButton } from "@/components/tasks/assign-task-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  assignedTaskCount: number; // Changed from assignedTasksCount
}

// Client roles to exclude
const CLIENT_ROLES = ["PERMANENT_CLIENT", "GUEST_CLIENT"];

// Define role configurations
const roleConfigs = [
  { role: "ADMIN", label: "Admins", color: "bg-blue-500" },
  { role: "PARTNER", label: "Partners", color: "bg-purple-500" },
  {
    role: "BUSINESS_EXECUTIVE",
    label: "Business Executives",
    color: "bg-green-500",
  },
  {
    role: "BUSINESS_CONSULTANT",
    label: "Business Consultants",
    color: "bg-teal-500",
  },
];

// Format the role for display
const formatRole = (role: string) => {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

// UserCard component for card view
const UserCard = ({
  user,
  onToggleStatus,
  onDeleteUser,
}: {
  user: User;
  onToggleStatus: (id: string, status: boolean) => Promise<void>;
  onDeleteUser: (id: string, name: string) => Promise<void>;
}) => {
  const router = useRouter();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const navigateToUser = () => {
    router.push(`/dashboard/admin/users/${user.id}`);
  };

  // Prevent card click when clicking on or focusing on actions
  const handleActionClick = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      onClick={navigateToUser}
      className="group cursor-pointer hover:shadow-lg transition-shadow border rounded-xl flex flex-col items-center p-6 relative"
      tabIndex={0}
      role="button"
      aria-label={`View details for ${user.name}`}
    >
      <div className="flex flex-col items-center w-full">
        <Avatar className="h-20 w-20 mb-3 ring-2 ring-primary/20 group-hover:ring-primary mx-auto">
          <AvatarImage
            src={
              user.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
            }
            alt={user.name}
          />
          <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="text-center w-full">
          <p className="font-semibold text-lg">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">
            {formatRole(user.role)}
          </Badge>
          {user.isActive !== false ? (
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 text-xs"
            >
              Active
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Blocked
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {user.assignedTaskCount} Tasks
          </Badge>
        </div>
        <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <AssignTaskButton 
            userId={user.id} 
            userName={user.name} 
            onAssigned={() => router.refresh()}
          />
        </div>
      </div>
      <div
        className="absolute top-4 right-4 z-10"
        onClick={handleActionClick}
        onFocus={handleActionClick}
      >
        <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="data-[state=open]:bg-muted"
              tabIndex={-1}
              aria-label="Open user actions"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/admin/users/${user.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/admin/users/${user.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </Link>
            </DropdownMenuItem>
            {/* Removed redundant Assign Task button */}
            <DropdownMenuItem
              onClick={() => onToggleStatus(user.id, user.isActive !== false)}
            >
              {user.isActive !== false ? (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Block User
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate User
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/admin/users/${user.id}/reset-password`}>
                <KeyIcon className="w-4 h-4 mr-2" />
                Reset Password
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteUser(user.id, user.name);
              }}
              className="text-red-600 focus:text-red-600 hover:text-red-700"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-full flex justify-center mt-4">
        <span className="text-xs text-muted-foreground">
          Joined {format(new Date(user.createdAt), "PPP")}
        </span>
      </div>
    </Card>
  );
};

// Main component
export default function UsersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);

  // Check for URL parameters only on client side in useEffect
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        const role = url.searchParams.get("role");
        const view = url.searchParams.get("view");

        // Apply URL parameters if present
        if (role) {
          setSelectedRoles([role]);
        }

        if (view === "table" || view === "card") {
          setViewMode(view);
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Check for mobile viewport on component mount
    if (typeof window !== "undefined") {
      const isMobileView = window.innerWidth < 768;
      if (isMobileView) {
        setViewMode("card");
      }
      
      // Also handle window resize
      const handleResize = () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile && viewMode === "table") {
          setViewMode("card");
        }
      };
      
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [viewMode]);

  // Load users - excluding clients and current user
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedRoles.length > 0) {
        params.roles = selectedRoles.join(",");
      }

      const response = await axios.get("/api/users", { params });

      // Fix: Access the users array from the response object
      const filteredUsers = response.data.users.filter(
        (user: User) =>
          !CLIENT_ROLES.includes(user.role) && user.id !== session?.user?.id
      );

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [selectedRoles, session?.user?.id]);

  // Handle toggle status
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/users/${userId}/status`, {
        isActive: !currentStatus,
      });

      // Update the user in the list
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return { ...user, isActive: !currentStatus };
          }
          return user;
        })
      );

      toast.success(
        `User ${!currentStatus ? "activated" : "blocked"} successfully`
      );
    } catch (error: unknown) {
      const typedError = error as { response?: { data?: { error?: string } } };
      toast.error(
        typedError.response?.data?.error || "Failed to update user status"
      );
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    // Open dialog instead of using confirm
    setUserToDelete({ id: userId, name: userName });
    setDeleteDialogOpen(true);
  };

  // Add a new function to perform the actual deletion
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await axios.delete(`/api/users/${userToDelete.id}`);
      // Remove user from the list
      setUsers(users.filter(user => user.id !== userToDelete.id));
      toast.success(`User ${userToDelete.name} deleted successfully`);
    } catch (error: unknown) {
      const typedError = error as { response?: { data?: { error?: string } } };
      toast.error(
        typedError.response?.data?.error || "Failed to delete user"
      );
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Initial load
  useEffect(() => {
    if (session) {
      loadUsers();
    }
  }, [selectedRoles, session, loadUsers]);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Define the roles available for filtering
  const availableRoles = [
    { value: "ADMIN", label: "Admin" },
    { value: "PARTNER", label: "Partner" },
    { value: "BUSINESS_EXECUTIVE", label: "Business Executive" },
    { value: "BUSINESS_CONSULTANT", label: "Business Consultant" },
  ];

  const navigateToCreate = () => {
    router.push("/dashboard/admin/users/create");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-40 w-full" />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-7 w-28" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-72" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={`skeleton-${i}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-32 mb-1" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-36" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-20 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Row with Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and their access levels
          </p>
        </div>
        <Button onClick={navigateToCreate}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Role distribution chart */}
      {users.length > 0 && (
        <UserCount
          users={users}
          excludeRoles={CLIENT_ROLES}
          roleConfigs={roleConfigs}
          showTotal={true}
        />
      )}

      {/* Users list card with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <RoleFilter
                  roles={availableRoles}
                  selectedRoles={selectedRoles}
                  onChange={setSelectedRoles}
                />

                {(selectedRoles.length > 0 || searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRoles([]);
                      setSearchTerm("");
                    }}
                  >
                    <FilterX className="h-4 w-4 mr-2" />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            {/* View toggle */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "table" | "card")}
              className="w-[200px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="card">Cards</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "table" ? (
            <div className="border rounded-md overflow-x-auto">
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Tasks 
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                          tabIndex={0}
                          aria-label={`View details for ${user.name}`}
                        >
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{formatRole(user.role)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{user.assignedTaskCount}</span>
                              <div 
                                className="cursor-pointer hover:bg-muted rounded-full p-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <AssignTaskButton
                                  userId={user.id}
                                  userName={user.name}
                                  onAssigned={() => router.refresh()}
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-muted"
                                >
                                  <ClipboardPlus className="h-3.5 w-3.5" />
                                </AssignTaskButton>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.isActive !== false ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800"
                              >
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="destructive">Blocked</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.createdAt), "PPP")}
                          </TableCell>
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                            className="!pr-0"
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="data-[state=open]:bg-muted"
                                  tabIndex={-1}
                                  aria-label="Open user actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-[160px]"
                              >
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/admin/users/${user.id}`}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/admin/users/${user.id}/edit`}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit User
                                  </Link>
                                </DropdownMenuItem>
                                {/* Removed Assign Task button from here */}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleToggleStatus(
                                      user.id,
                                      user.isActive !== false
                                    )
                                  }
                                >
                                  {user.isActive !== false ? (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Block User
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Activate User
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/dashboard/admin/users/${user.id}/reset-password`}
                                  >
                                    <KeyIcon className="w-4 h-4 mr-2" />
                                    Reset Password
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  className="text-red-600 focus:text-red-600 hover:text-red-700"
                                >
                                  <Trash className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onToggleStatus={handleToggleStatus}
                    onDeleteUser={handleDeleteUser}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground border rounded-md col-span-full">
                  No users found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm User Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}