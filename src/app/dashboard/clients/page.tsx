"use client";

import { useState, useEffect, useCallback, useMemo, useTransition, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, isAfter } from "date-fns";
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Building,
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
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  id: string;
  contactPerson: string; // This is not optional
  companyName?: string;
  email?: string;
  phone?: string;
  isGuest: boolean;
  accessExpiry?: string;
  createdAt: string;
  updatedAt: string;
  activeTasks: number;
  completedTasks: number;
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Memoize expensive computations
  const filteredClients = useMemo(() => {
    if (!clients) return [];

    return clients.filter((client) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const contactPerson = client.contactPerson?.toLowerCase() || "";
        const companyName = client.companyName?.toLowerCase() || "";
        const email = client.email?.toLowerCase() || "";
        const phone = client.phone?.toLowerCase() || "";

        return (
          contactPerson.includes(searchLower) ||
          companyName.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower)
        );
      }

      if (activeTab === "permanent" && client.isGuest) return false;
      if (activeTab === "guest" && !client.isGuest) return false;

      return true;
    });
  }, [clients, searchTerm, activeTab]);

  // Optimize search handling with transitions
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Use startTransition to avoid blocking UI during filtering
    startTransition(() => {
      setSearchTerm(value);
    });
  }, []);

  // Function to load clients with search and filtering
  const loadClients = async () => {
    setLoading(true);
    setDataError(null);

    try {
      let url = `/api/clients?page=${page}&limit=10`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      if (activeTab === "permanent") {
        url += "&isGuest=false";
      } else if (activeTab === "guest") {
        url += "&isGuest=true";
      }

      const response = await axios.get(url);

      // Validate response data structure
      if (!response.data || !Array.isArray(response.data.clients)) {
        setDataError("Invalid response format from server");
        setClients([]);
        return;
      }

      // Process clients to ensure data integrity
      const processedClients = response.data.clients.map((client: any) => ({
        id: client.id || "unknown-id",
        // Ensure contactPerson always has a fallback value
        contactPerson: client.contactPerson || "Unnamed Client",
        companyName: client.companyName || null,
        email: client.email || null,
        phone: client.phone || null,
        isGuest: Boolean(client.isGuest),
        accessExpiry: client.accessExpiry || null,
        createdAt: client.createdAt || new Date().toISOString(),
        updatedAt: client.updatedAt || new Date().toISOString(),
        activeTasks: typeof client.activeTasks === "number" ? client.activeTasks : 0,
        completedTasks: typeof client.completedTasks === "number" ? client.completedTasks : 0,
      }));

      setClients(processedClients);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalClients(response.data.pagination?.total || processedClients.length);
    } catch (error) {
      console.error("Error loading clients:", error);
      setDataError("Failed to load clients");
      toast.error("Failed to load clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when dependencies change
  useEffect(() => {
    loadClients();
  }, [page, searchTerm, activeTab]);

  // Handler for client deletion
  const confirmDelete = (clientId: string) => {
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
  };

  const deleteClient = async () => {
    if (!clientToDelete) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`/api/clients/${clientToDelete}`);
      toast.success("Client deleted successfully");
      setDeleteDialogOpen(false);
      loadClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
    } finally {
      setDeleteLoading(false);
      setClientToDelete(null);
    }
  };

  // Check if a client is expired
  const isClientExpired = (client: Client) => {
    if (!client.isGuest || !client.accessExpiry) return false;
    return isAfter(new Date(), new Date(client.accessExpiry));
  };

  // Get formatted text for display
  const getDisplayName = (client: Client): string => {
    // Ensure we have a valid string even if data is inconsistent
    return client?.contactPerson || "Unnamed Client";
  };

  // Add proper skeleton state for loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 w-full sm:w-72" />
              <div className="flex-1 flex justify-end">
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1">
                        <Skeleton className="h-6 w-40 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title and action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">Manage client information and tasks</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild>
            <Link href="/dashboard/clients/create">
              <Building className="mr-2 h-4 w-4" />
              Add Permanent Client
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/clients/guest/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Guest Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Client tabs and search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Clients</CardTitle>
          <CardDescription>View and manage client records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Tabs
                defaultValue="all"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Clients</TabsTrigger>
                  <TabsTrigger value="permanent">Permanent</TabsTrigger>
                  <TabsTrigger value="guest">Guest</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {dataError ? (
              <div className="text-center py-12 border rounded-md bg-background">
                <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                <h3 className="text-lg font-medium mb-2">Error loading clients</h3>
                <p className="text-muted-foreground mb-6">{dataError}</p>
                <Button onClick={loadClients}>Try Again</Button>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12 border rounded-md bg-background">
                <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                <h3 className="text-lg font-medium mb-2">No clients found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm
                    ? "No clients match your search criteria"
                    : activeTab === "permanent"
                    ? "No permanent clients have been added yet"
                    : activeTab === "guest"
                    ? "No guest clients have been added yet"
                    : "No clients have been added yet"}
                </p>
                <div className="flex justify-center gap-3">
                  <Button asChild>
                    <Link href="/dashboard/clients/create">Add Permanent Client</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/clients/guest/create">Add Guest Client</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {/* Add robust name rendering with fallback */}
                          {getDisplayName(client)}
                        </TableCell>
                        <TableCell>
                          {client.companyName || (
                            <span className="text-muted-foreground italic">Not provided</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.email || client.phone || (
                            <span className="text-muted-foreground italic">No contact</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.isGuest ? (
                            <div className="flex flex-col">
                              <Badge className="bg-amber-500 hover:bg-amber-600">Guest</Badge>
                              {client.accessExpiry && (
                                <span
                                  className={`text-xs mt-1 ${
                                    isClientExpired(client)
                                      ? "text-red-500"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {isClientExpired(client)
                                    ? "Expired"
                                    : `Expires: ${format(
                                        new Date(client.accessExpiry),
                                        "MMM d, yyyy"
                                      )}`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                            >
                              Permanent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              <span className="font-medium">{client.activeTasks}</span> active
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {client.completedTasks} completed
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/clients/${client.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/clients/${client.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Client
                                </Link>
                              </DropdownMenuItem>
                              {(session?.user?.role === "ADMIN" ||
                                session?.user?.role === "PARTNER") && (
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => confirmDelete(client.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Client
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing page {page} of {totalPages} ({totalClients} total clients)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client
              and all associated data including tasks and documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteClient();
              }}
              disabled={deleteLoading}
              className="bg-red-600 focus:ring-red-600"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
  );
}