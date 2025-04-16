"use client";

import { useState, useEffect, useCallback, useMemo, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  LayoutGrid,
  LayoutList,
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
import { canModifyClient } from "@/lib/permissions";

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

// Client List Item Component
const ClientListItem = ({ 
  client, 
  confirmDelete,
  canDelete
}: { 
  client: Client, 
  confirmDelete: (id: string) => void,
  canDelete: boolean
}) => {
  const router = useRouter();
  
  // Function to handle click on the entire row
  const handleRowClick = () => {
    router.push(`/dashboard/clients/${client.id}`);
  };
  
  // Prevent propagation for action buttons
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  const isExpired = client.isGuest && client.accessExpiry ? 
    isAfter(new Date(), new Date(client.accessExpiry)) : false;
  
  return (
    <div 
      onClick={handleRowClick}
      className="p-4 border rounded-lg mb-4 hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{client.contactPerson}</span>
            {client.isGuest && (
              <Badge variant={isExpired ? "destructive" : "secondary"} className="text-xs">
                {isExpired ? "Expired Guest" : "Guest"}
              </Badge>
            )}
            {!client.isGuest && (
              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 text-xs">
                Permanent
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {client.companyName && <span className="mr-3">{client.companyName}</span>}
            {client.email && <span className="mr-3">{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
            {!client.companyName && !client.email && !client.phone && (
              <span className="italic">No contact information</span>
            )}
          </div>
          <div className="text-xs mt-2 flex items-center gap-2">
            <span className="text-muted-foreground">Tasks:</span>
            <Badge variant="outline" className="text-xs">
              {client.activeTasks} active
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {client.completedTasks} completed
            </Badge>
          </div>
        </div>
        
        <div 
          className="flex flex-wrap gap-2"
          onClick={handleActionClick}
        >
          {/* Action buttons */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8"
          >
            <Link href={`/dashboard/clients/${client.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </Link>
          </Button>
          
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8"
            >
              <Link href={`/dashboard/clients/${client.id}/edit`}>
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Link>
            </Button>
          )}
          
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={() => confirmDelete(client.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Create a wrapper component for the search params
function ClientsPageContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  // Changed default view to "card" from "table"
  const [viewMode, setViewMode] = useState<"table" | "card">(() => {
    // Try to get saved preference from localStorage, default to "card" if not found
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('clientViewMode');
      return savedView === 'table' ? 'table' : 'card';
    }
    return 'card';
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Save view mode preference when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clientViewMode', viewMode);
    }
  }, [viewMode]);

  // Check if user can modify clients
  const hasWriteAccess = useMemo(() => {
    return canModifyClient(session);
  }, [session]);

  // Handle view mode toggle
  const handleViewModeChange = useCallback((value: string) => {
    setViewMode(value as "table" | "card");
  }, []);

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
  const loadClients = useCallback(async () => {
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
      const processedClients = response.data.clients.map((client: {
        id: string;
        contactPerson: string;
        companyName?: string;
        email?: string;
        phone?: string;
        isGuest: boolean;
        accessExpiry?: string;
        createdAt: string;
        updatedAt: string;
        activeTasks: number;
        completedTasks: number;
      }) => ({
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
    } catch (error: unknown) {
      console.error("Error loading clients:", error);
      const typedError = error as { response?: { data?: { error?: string } } };
      const errorMessage = typedError?.response?.data?.error || "Failed to load clients";
      toast.error(errorMessage);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, activeTab]);

  // Initial load and when dependencies change
  useEffect(() => {
    loadClients();
  }, [loadClients]);

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
          <p className="text-muted-foreground">
            {hasWriteAccess 
              ? "Manage client information and tasks" 
              : "View client information and tasks"}
          </p>
        </div>

        {/* Only show create buttons for admin users */}
        {hasWriteAccess && (
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
        )}
      </div>
      {/* Client tabs and search */}
      <Card>
        <CardHeader className="pb-3">
          {/* Moved view toggle to the header for better visibility */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle>Clients</CardTitle>
            
            {/* View mode toggle - now a prominent part of the header */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1 hidden sm:inline">View:</span>
              <div className="border rounded-md flex">
                <button 
                  onClick={() => handleViewModeChange("table")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm ${viewMode === "table" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"}`}
                  aria-pressed={viewMode === "table"}
                >
                  <LayoutList className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button 
                  onClick={() => handleViewModeChange("card")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm ${viewMode === "card" 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"}`}
                  aria-pressed={viewMode === "card"}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
              </div>
            </div>
          </div>
          <CardDescription>View and manage client records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Client type tabs */}
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

              {/* Search box */}
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
            ) : viewMode === "table" ? (
              // TABLE VIEW
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
                              {hasWriteAccess && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/clients/${client.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Client
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {hasWriteAccess && (
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
            ) : (
              // CARD VIEW
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <ClientListItem 
                    key={client.id} 
                    client={client} 
                    confirmDelete={confirmDelete} 
                    canDelete={hasWriteAccess}
                  />
                ))}
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

// Main page component with Suspense boundary
export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="border rounded-lg p-6">
          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    }>
      <ClientsPageContent />
    </Suspense>
  );
}