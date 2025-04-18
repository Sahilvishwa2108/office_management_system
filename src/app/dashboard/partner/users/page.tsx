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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// For partner page showing only team members
const partnerRoleConfigs = [
  { role: "BUSINESS_EXECUTIVE", label: "Business Executives", color: "bg-green-500" },
  { role: "BUSINESS_CONSULTANT", label: "Business Consultants", color: "bg-teal-500" },
];

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

  // Format the role for display
  const formatRole = (role: string) => {
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Get URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        
        // Get roles from URL
        const rolesParam = url.searchParams.get('roles');
        if (rolesParam) {
          setSelectedRoles(rolesParam.split(','));
        }
        
        // Get status from URL
        const statusParam = url.searchParams.get('status');
        if (statusParam && ['all', 'active', 'inactive'].includes(statusParam)) {
          setStatusFilter(statusParam);
        }
        
        // Get search term from URL
        const searchParam = url.searchParams.get('search');
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
    if (typeof window !== 'undefined' && !pageLoading) {
      const url = new URL(window.location.href);
      
      // Update roles in URL
      if (selectedRoles.length > 0) {
        url.searchParams.set('roles', selectedRoles.join(','));
      } else {
        url.searchParams.delete('roles');
      }
      
      // Update status in URL
      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter);
      } else {
        url.searchParams.delete('status');
      }
      
      // Update search in URL
      if (searchTerm) {
        url.searchParams.set('search', searchTerm);
      } else {
        url.searchParams.delete('search');
      }
      
      // Update URL without page reload
      window.history.replaceState({}, '', url.toString());
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
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              {Array(5).fill(0).map((_, i) => (
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
        users={users.map(user => ({
          ...user,
          isActive: user.isActive !== false // Ensures isActive is a boolean, defaulting to true if undefined
        }))}
        title="Team Members"
        description="Your team distribution by role"
        includeRoles={["BUSINESS_EXECUTIVE", "BUSINESS_CONSULTANT"]}
        roleConfigs={partnerRoleConfigs}
        showTotal={true}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatRole(user.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive !== false ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Blocked</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
