"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  CardFooter,
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
  RefreshCw,
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
import { useDebounce } from "@/hooks/use-debounce";
import { ResponsiveTable } from "@/components/ui/responsive-table";

interface Client {
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
}

// Extracted to a separate component for better performance
const ClientListItem = ({ 
  client, 
  confirmDelete,
  canDelete
}: { 
  client: Client, 
  confirmDelete: (id: string) => void,
  canDelete: boolean
}) => {
  const { push } = useRouter();
  
  const handleRowClick = useCallback(() => {
    push(`/dashboard/clients/${client.id}`);
  }, [push, client.id]);
  
  const handleActionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
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

// Memoized client table row for better performance
const ClientTableRow = ({ 
  client, 
  confirmDelete, 
  canDelete,
  getDisplayName,
  isClientExpired 
}: { 
  client: Client, 
  confirmDelete: (id: string) => void, 
  canDelete: boolean,
  getDisplayName: (client: Client) => string,
  isClientExpired: (client: Client) => boolean
}) => {
  return (
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
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/clients/${client.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Client
              </Link>
            </DropdownMenuItem>
            {canDelete && (
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
  );
};

// Main component with loading skeleton
export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("card"); // Default to card view
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Use debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use localStorage to remember view preference
  useEffect(() => {
    try {
      const savedView = localStorage.getItem('clientViewMode');
      if (savedView === 'table' || savedView === 'card') {
        setViewMode(savedView);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  // Save view mode preference when it changes
  useEffect(() => {
    try {
      localStorage.setItem('clientViewMode', viewMode);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [viewMode]);

  // Permission check - memoized
  const canDeleteClients = useMemo(() => {
    return session?.user?.role === "ADMIN" || session?.user?.role === "PARTNER";
  }, [session]);

  // Memoize expensive computations
  const filteredClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];

    return clients.filter((client) => {
      // Search filter
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const contactPerson = client.contactPerson?.toLowerCase() || "";
        const companyName = client.companyName?.toLowerCase() || "";
        const email = client.email?.toLowerCase() || "";
        const phone = client.phone?.toLowerCase() || "";

        const matchesSearch = 
          contactPerson.includes(searchLower) ||
          companyName.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower);
          
        if (!matchesSearch) return false;
      }

      // Tab filter
      if (activeTab === "permanent" && client.isGuest) return false;
      if (activeTab === "guest" && !client.isGuest) return false;

      return true;
    });
  }, [clients, debouncedSearchTerm, activeTab]);

  // Function to load clients with search and filtering
  const loadClients = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setDataError(null);

    try {
      let url = `/api/clients?page=${page}&limit=20`;

      if (debouncedSearchTerm) {
        url += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
      }

      if (activeTab === "permanent") {
        url += "&isGuest=false";
      } else if (activeTab === "guest") {
        url += "&isGuest=true";
      }

      const response = await axios.get(url, { timeout: 8000 });

      // Validate response data structure
      if (!response.data || !Array.isArray(response.data.clients)) {
        setDataError("Invalid response format from server");
        setClients([]);
        return;
      }

      // Process clients to ensure data integrity
      const processedClients = response.data.clients.map((client: Record<string, unknown>) => ({
        id: client.id as string || "unknown-id",
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
      const typedError = error as { response?: { data?: { error?: string } } };
      const errorMessage = typedError.response?.data?.error || "An unknown error occurred";
      setDataError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearchTerm, activeTab]);

  // Effect to load clients when dependencies change
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Handler for client deletion
  const confirmDelete = useCallback((clientId: string) => {
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
  }, []);

  const deleteClient = async () => {
    if (!clientToDelete) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`/api/clients/${clientToDelete}`);
      toast.success("Client deleted successfully");
      setDeleteDialogOpen(false);
      loadClients();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
      setClientToDelete(null);
    }
  };

  // Utility functions - memoized
  const isClientExpired = useCallback((client: Client) => {
    if (!client.isGuest || !client.accessExpiry) return false;
    return isAfter(new Date(), new Date(client.accessExpiry));
  }, []);

  const getDisplayName = useCallback((client: Client): string => {
    return client?.contactPerson || "Unnamed Client";
  }, []);

  // Handle view mode toggle
  const handleViewModeChange = useCallback((mode: "table" | "card") => {
    setViewMode(mode);
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Loading state
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle>Clients</CardTitle>
              <CardDescription>View and manage client records</CardDescription>
            </div>
            
            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1 hidden sm:inline">View as:</span>
              <div className="border rounded-md flex shadow-sm">
                <button 
                  onClick={() => handleViewModeChange("table")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm transition-colors ${
                    viewMode === "table" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                  aria-pressed={viewMode === "table"}
                  aria-label="Table view"
                >
                  <LayoutList className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button 
                  onClick={() => handleViewModeChange("card")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm transition-colors ${
                    viewMode === "card" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                  aria-pressed={viewMode === "card"}
                  aria-label="Card view"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Client type filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex space-x-1 rounded-md overflow-hidden border w-full sm:w-auto">
                  <Button 
                    variant={activeTab === "all" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setActiveTab("all")}
                    className="flex-1 sm:flex-none rounded-none"
                  >
                    All Clients
                  </Button>
                  <Button 
                    variant={activeTab === "permanent" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setActiveTab("permanent")}
                    className="flex-1 sm:flex-none rounded-none"
                  >
                    Permanent
                  </Button>
                  <Button 
                    variant={activeTab === "guest" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setActiveTab("guest")}
                    className="flex-1 sm:flex-none rounded-none"
                  >
                    Guest
                  </Button>
                </div>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-8 pr-10"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {refreshing ? (
                  <RefreshCw className="animate-spin absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                ) : searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Error state */}
            {dataError && (
              <div className="text-center py-12 border rounded-md bg-background">
                <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                <h3 className="text-lg font-medium mb-2">Error loading clients</h3>
                <p className="text-muted-foreground mb-6">{dataError}</p>
                <Button 
                  onClick={() => loadClients(true)}
                  disabled={refreshing}
                  className="gap-2"
                >
                  {refreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Try Again
                </Button>
              </div>
            )}
            
            {/* Empty state */}
            {!dataError && filteredClients.length === 0 && (
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
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button asChild>
                    <Link href="/dashboard/clients/create">Add Permanent Client</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/clients/guest/create">Add Guest Client</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Client list - table view */}
            {!dataError && filteredClients.length > 0 && viewMode === "table" && (
              <div className="rounded-md border">
                <ResponsiveTable>
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
                        <ClientTableRow 
                          key={client.id} 
                          client={client} 
                          confirmDelete={confirmDelete}
                          canDelete={canDeleteClients}
                          getDisplayName={getDisplayName}
                          isClientExpired={isClientExpired}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              </div>
            )}

            {/* Client list - card view */}
            {!dataError && filteredClients.length > 0 && viewMode === "card" && (
              <div className="space-y-4">
                {filteredClients.map((client) => (
                  <ClientListItem 
                    key={client.id} 
                    client={client} 
                    confirmDelete={confirmDelete} 
                    canDelete={canDeleteClients}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!dataError && filteredClients.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing page {page} of {totalPages} ({totalClients} total clients)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1 || refreshing}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages || refreshing}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Always show count summary in footer */}
        {!dataError && filteredClients.length > 0 && (
          <CardFooter className="border-t py-3 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {filteredClients.length} client{filteredClients.length !== 1 && "s"} 
              {searchTerm ? " matching your search" : ""}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadClients(true)}
              disabled={refreshing}
              className="h-8 gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardFooter>
        )}
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