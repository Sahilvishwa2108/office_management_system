"use client";

import { useState, useEffect } from "react";
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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean; // Changed from isActive?: boolean
  createdAt: string;
  updatedAt: string;
}

// For partner page showing only team members
const partnerRoleConfigs = [
  { role: "BUSINESS_EXECUTIVE", label: "Business Executives", color: "bg-green-500" },
  { role: "BUSINESS_CONSULTANT", label: "Business Consultants", color: "bg-teal-500" },
];

export default function PartnerUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Format the role for display
  const formatRole = (role: string) => {
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Load junior employees only
  const loadUsers = async () => {
    setLoading(true);
    try {
      // Add role parameter for filtering on the server side
      const response = await axios.get("/api/users", {
        params: {
          role: roleFilter !== "all" ? roleFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      // Filter for junior staff only on the client side as well
      let filtered = response.data.filter(
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
  };

  // Initial load
  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear filters
  const clearFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
  };

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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="BUSINESS_EXECUTIVE">
                    Business Executive
                  </SelectItem>
                  <SelectItem value="BUSINESS_CONSULTANT">
                    Business Consultant
                  </SelectItem>
                </SelectContent>
              </Select>

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

              {(roleFilter !== "all" || statusFilter !== "all" || searchTerm) && (
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
                {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                  ? "No results match your search criteria. Try adjusting your filters."
                  : "No junior staff have been added yet."}
              </p>

              {!searchTerm && roleFilter === "all" && statusFilter === "all" && (
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
