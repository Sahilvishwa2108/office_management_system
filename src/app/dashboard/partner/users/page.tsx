"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Loader2,
  FilterX,
  ClipboardList,
  ClipboardPlus,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { UserCount } from "@/components/dashboard/user-count";
import { RoleFilter } from "@/components/ui/role-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { AssignTaskButton } from "@/components/tasks/assign-task-button";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  assignedTaskCount: number;
  avatar?: string;
}

// For partner page showing only team members
const partnerRoleConfigs = [
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

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

// Format the role for display
const formatRole = (role: string) => {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// UserCard component for card view (aligned with admin version)
const UserCard = ({
  user,
}: {
  user: User;
}) => {
  const router = useRouter();
  
  const navigateToUser = () => {
    router.push(`/dashboard/partner/users/${user.id}`);
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
      <div className="w-full flex justify-center mt-4">
        <span className="text-xs text-muted-foreground">
          Joined {format(new Date(user.createdAt), "PPP")}
        </span>
      </div>
    </Card>
  );
};

// Main component
export default function PartnerUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Check for mobile viewport on component mount
  useEffect(() => {
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

  // Get URL parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);

        // Get roles from URL
        const rolesParam = url.searchParams.get("roles");
        if (rolesParam) {
          setSelectedRoles(rolesParam.split(","));
        }

        // Get status from URL
        const statusParam = url.searchParams.get("status");
        if (
          statusParam &&
          ["all", "active", "inactive"].includes(statusParam)
        ) {
          setStatusFilter(statusParam);
        }

        // Get search term from URL
        const searchParam = url.searchParams.get("search");
        if (searchParam) {
          setSearchTerm(searchParam);
        }
        
        // Get view mode from URL
        const view = url.searchParams.get("view");
        if (view === "table" || view === "card") {
          setViewMode(view);
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
    }
  }, []);

  // Wrap loadUsers in useCallback
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Add role parameters for filtering on the server side
      const response = await axios.get("/api/users", {
        params: {
          roles: selectedRoles.length > 0 ? selectedRoles.join(",") : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      const usersArray = Array.isArray(response.data) 
      ? response.data 
      : response.data.users || response.data.data || [];  

      // Filter for junior staff only on the client side as well
      const filtered = usersArray.filter(
        (user: User) =>
          user.role === "BUSINESS_EXECUTIVE" ||
          user.role === "BUSINESS_CONSULTANT"
      );

      setUsers(filtered);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedRoles, statusFilter]);

  // Initial load
  useEffect(() => {
    if (session) {
      loadUsers();
    }
  }, [selectedRoles, statusFilter, session, loadUsers]);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear filters
  const clearFilters = () => {
    setSelectedRoles([]);
    setStatusFilter("all");
    setSearchTerm("");
  };

  // Define the roles available for filtering
  const availableRoles = [
    { value: "BUSINESS_EXECUTIVE", label: "Business Executive" },
    { value: "BUSINESS_CONSULTANT", label: "Business Consultant" },
  ];

  // Show loading skeleton during initial page load
  if (loading && users.length === 0) {
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
          <h1 className="text-2xl font-bold tracking-tight">Junior Staff</h1>
          <p className="text-muted-foreground">
            Manage team members and their access levels
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/partner/users/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Role distribution chart */}
      {users.length > 0 && (
        <UserCount
          users={users.map((user) => ({
            ...user,
            isActive: user.isActive !== false, // Ensures isActive is a boolean, defaulting to true if undefined
          }))}
          roleConfigs={partnerRoleConfigs}
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {(selectedRoles.length > 0 || statusFilter !== "all" || searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
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
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : viewMode === "table" ? (
            <div className="border rounded-md overflow-x-auto">
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="whitespace-nowrap">Tasks</TableHead>
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
                          onClick={() => router.push(`/dashboard/partner/users/${user.id}`)}
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
                                  className="data-[state=open]:bg-muted cursor-pointer"
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
                                    href={`/dashboard/partner/users/${user.id}`}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Link>
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
    </div>
  );
}
