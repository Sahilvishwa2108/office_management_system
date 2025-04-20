"use client";

import { useState, useEffect, useCallback } from "react";
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Loader2,
  FilterX,
} from "lucide-react";
import Link from "next/link";
import { UserCount } from "@/components/dashboard/user-count";
import { RoleFilter } from "@/components/ui/role-filter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveTable } from "@/components/ui/responsive-table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  assignedTasksCount: number;
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

// UserCard component for card view (partner version, no admin/partner actions)
const UserCard = ({
  user,
}: {
  user: User;
}) => {
  const router = useRouter();
  const navigateToUser = () => {
    router.push(`/dashboard/partner/users/${user.id}`);
  };
  const formatRole = (role: string): React.ReactNode => {
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
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
            {user.assignedTasksCount} Tasks
          </Badge>
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

// Simplified - no Suspense or separate components
export default function PartnerUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageLoading, setPageLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Format the role for display
  const formatRole = (role: string) => {
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

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
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      } finally {
        setPageLoading(false);
      }
    }
  }, []);

  // Update URL when filters change
  useEffect(() => {
    if (typeof window !== "undefined" && !pageLoading) {
      const url = new URL(window.location.href);

      // Update roles in URL
      if (selectedRoles.length > 0) {
        url.searchParams.set("roles", selectedRoles.join(","));
      } else {
        url.searchParams.delete("roles");
      }

      // Update status in URL
      if (statusFilter !== "all") {
        url.searchParams.set("status", statusFilter);
      } else {
        url.searchParams.delete("status");
      }

      // Update search in URL
      if (searchTerm) {
        url.searchParams.set("search", searchTerm);
      } else {
        url.searchParams.delete("search");
      }

      // Update URL without page reload
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedRoles, statusFilter, searchTerm, pageLoading]);

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

      // Filter for junior staff only on the client side as well
      const filtered = response.data.filter(
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
    if (!pageLoading) {
      loadUsers();
    }
  }, [loadUsers, pageLoading]);

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [router, session]);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      (user.role === "BUSINESS_EXECUTIVE" || user.role === "BUSINESS_CONSULTANT") &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle search input with URL update
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

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
  if (pageLoading) {
    return (
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
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Row with Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Junior Staff</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>

        <Button asChild>
          <Link href="/dashboard/partner/users/create">
            <Plus className="h-4 w-4 mr-2" /> Add New Staff
          </Link>
        </Button>
      </div>

      <UserCount
        users={users.map((user) => ({
          ...user,
          isActive: user.isActive !== false, // Ensures isActive is a boolean, defaulting to true if undefined
        }))}
        title="Team Members"
        description="Your team distribution by role"
        includeRoles={["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"]}
        roleConfigs={partnerRoleConfigs}
        showTotal={true}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex gap-2">
                <RoleFilter
                  roles={availableRoles}
                  selectedRoles={selectedRoles}
                  onChange={setSelectedRoles}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {(selectedRoles.length > 0 || statusFilter !== "all" || searchTerm) && (
                  <Button variant="outline" onClick={clearFilters} size="icon">
                    <FilterX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
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
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-background">
              <h3 className="text-lg font-medium mb-2">No staff found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || selectedRoles.length > 0 || statusFilter !== "all"
                  ? "No results match your search criteria. Try adjusting your filters."
                  : "No junior staff have been added yet."}
              </p>
              {!searchTerm && selectedRoles.length === 0 && statusFilter === "all" && (
                <Button asChild>
                  <Link href="/dashboard/partner/users/create">
                    <Plus className="h-4 w-4 mr-2" /> Add New Staff
                  </Link>
                </Button>
              )}
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
                      <TableHead>Assigned Tasks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/dashboard/partner/users/${user.id}`)}
                        tabIndex={0}
                        aria-label={`View details for ${user.name}`}
                      >
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatRole(user.role)}</Badge>
                        </TableCell>
                        <TableCell>{user.assignedTasksCount}</TableCell>
                        <TableCell>
                          {user.isActive !== false ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Blocked</Badge>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                tabIndex={-1}
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/partner/users/${user.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
