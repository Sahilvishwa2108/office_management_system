"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, MoreVertical, Loader2, Search, Eye, Edit, Lock, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TaskProgress } from "@/components/dashboard/task-progress";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Format the role for display
  const formatRole = (role: string) => {
    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    try {
      let url = "/api/users";
      if (roleFilter && roleFilter !== "all") {
        url += `?role=${roleFilter}`;
      }
      const response = await axios.get(url);
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

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
        `User ${currentStatus ? "blocked" : "activated"} successfully`
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to update user status"
      );
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add this section for role statistics
  const getRoleStats = () => {
    if (!users.length) return [];
    
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return [
      { label: "Admins", value: roleCounts["ADMIN"] || 0, color: "bg-blue-500" },
      { label: "Partners", value: roleCounts["PARTNER"] || 0, color: "bg-purple-500" },
      { label: "Business Executives", value: roleCounts["BUSINESS_EXECUTIVE"] || 0, color: "bg-green-500" },
      { label: "Business Consultants", value: roleCounts["BUSINESS_CONSULTANT"] || 0, color: "bg-teal-500" },
      { label: "Permanent Clients", value: roleCounts["PERMANENT_CLIENT"] || 0, color: "bg-amber-500" },
      { label: "Guest Clients", value: roleCounts["GUEST_CLIENT"] || 0, color: "bg-orange-500" },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Title Row with Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users and their access levels</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/users/create">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New User
          </Link>
        </Button>
      </div>

      {/* New: Role distribution chart */}
      {!loading && users.length > 0 && (
        <Card className="p-4">
          <div className="mb-2">
            <h3 className="font-medium">User Role Distribution</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Overview of user distribution across different roles
            </p>
            <TaskProgress 
              items={getRoleStats()} 
              size="md"
            />
          </div>
        </Card>
      )}

      {/* Users list card with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="PARTNER">Partner</SelectItem>
                <SelectItem value="BUSINESS_EXECUTIVE">Business Executive</SelectItem>
                <SelectItem value="BUSINESS_CONSULTANT">Business Consultant</SelectItem>
                <SelectItem value="PERMANENT_CLIENT">Permanent Client</SelectItem>
                <SelectItem value="GUEST_CLIENT">Guest Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(user.id, user.isActive !== false)}
                              >
                                {user.isActive !== false ? (
                                  <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Block User
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Activate User
                                  </>
                                )}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}