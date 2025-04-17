"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation"; // Remove useSearchParams from here
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
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
import { UserPlus, Search, Eye, Edit, Ban, CheckCircle, MoreHorizontal, KeyIcon, FilterX } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { UserCount } from "@/components/dashboard/user-count";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleFilter } from "@/components/ui/role-filter";
import React from "react"; // Make sure React is imported

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Client roles to exclude
const CLIENT_ROLES = ["PERMANENT_CLIENT", "GUEST_CLIENT"];

// Define role configurations
const roleConfigs = [
  { role: "ADMIN", label: "Admins", color: "bg-blue-500" },
  { role: "PARTNER", label: "Partners", color: "bg-purple-500" },
  { role: "BUSINESS_EXECUTIVE", label: "Business Executives", color: "bg-green-500" },
  { role: "BUSINESS_CONSULTANT", label: "Business Consultants", color: "bg-teal-500" },
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
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// UserListItem component
const UserListItem = ({ 
  user, 
  onToggleStatus 
}: { 
  user: User, 
  onToggleStatus: (id: string, status: boolean) => Promise<void> 
}) => {
  const router = useRouter();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const navigateToUser = () => {
    router.push(`/dashboard/admin/users/${user.id}`);
  };

  // Prevent row click when clicking on actions
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      onClick={navigateToUser}
      className="p-4 border rounded-lg mb-4 hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
              alt={user.name}
            />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {formatRole(user.role)}
              </Badge>
              {user.isActive !== false ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">Active</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Blocked</Badge>
              )}
            </div>
          </div>
        </div>

        <div 
          className="flex items-center gap-2"
          onClick={handleActionClick}
        >
          <p className="text-xs text-muted-foreground">
            {format(new Date(user.createdAt), 'PPP')}
          </p>
          <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="data-[state=open]:bg-muted"
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
              <DropdownMenuItem onClick={() => onToggleStatus(user.id, user.isActive !== false)}>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

// Create a separate content component that doesn't use useSearchParams
function UsersContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Load users - excluding clients and current user
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Use the new roles parameter
      const params: Record<string, string> = {};
      if (selectedRoles.length > 0) {
        params.roles = selectedRoles.join(",");
      }
      
      const response = await axios.get("/api/users", { params });
      
      // Filter out client users and the current logged-in user
      const filteredUsers = response.data.filter((user: User) => 
        !CLIENT_ROLES.includes(user.role) && 
        user.id !== session?.user?.id
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

  // Initial load
  useEffect(() => {
    if (session) {
      loadUsers();
    }
  }, [selectedRoles, session, loadUsers]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
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
    router.push('/dashboard/admin/users/create');
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
                  {Array(5).fill(0).map((_, i) => (
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
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
          <p className="text-muted-foreground">Manage users and their access levels</p>
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
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "card")} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="card">Cards</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "table" ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatRole(user.role)}</TableCell>
                        <TableCell>
                          {user.isActive !== false ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Blocked</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.createdAt), 'PPP')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="data-[state=open]:bg-muted"
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
                              <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.isActive !== false)}>
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <UserListItem 
                    key={user.id} 
                    user={user} 
                    onToggleStatus={handleToggleStatus} 
                  />
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground border rounded-md">
                  No users found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Dynamically import the search params component with SSR disabled
const SearchParamsHandler = dynamic(() => import("./search-params"), { 
  ssr: false 
});

// Main component with Suspense boundary
export default function UsersPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    }>
      <>
        <SearchParamsHandler />
        <UsersContent />
      </>
    </Suspense>
  );
}