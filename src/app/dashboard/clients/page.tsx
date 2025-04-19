"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Mail,
  Phone,
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
import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

// Client Card Component
const ClientCard = ({ 
  client, 
  confirmDelete,
  canDelete
}: { 
  client: Client, 
  confirmDelete: (id: string) => void,
  canDelete: boolean
}) => {
  const router = useRouter();
  
  // Function to handle click on the card
  const handleCardClick = () => {
    router.push(`/dashboard/clients/${client.id}`);
  };
  
  // Prevent propagation for action buttons
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  const isExpired = client.isGuest && client.accessExpiry ? 
    isAfter(new Date(), new Date(client.accessExpiry)) : false;
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-all border-solid border-gray-600 hover:border-primary/20 flex flex-col h-full group"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:border-primary/20 transition-all">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.contactPerson}`}
                alt={client.contactPerson}
              />
              <AvatarFallback>{getInitials(client.contactPerson)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base line-clamp-1">{client.contactPerson}</CardTitle>
              {client.companyName && (
                <CardDescription className="text-xs line-clamp-1">{client.companyName}</CardDescription>
              )}
            </div>
          </div>
          
          {client.isGuest ? (
            <Badge variant={isExpired ? "destructive" : "secondary"} className="shrink-0">
              {isExpired ? "Expired" : "Guest"}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 shrink-0">
              Permanent
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-3 text-sm pt-1">
          {(client.email || client.phone) && (
            <div className="space-y-2">
              {client.email && (
                <div className="flex items-center text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  <Mail className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  <Phone className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Tasks:</span>
            <div className="flex gap-2">
              <div className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium">
                {client.activeTasks} active
              </div>
              <div className="bg-gray-50 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs font-medium">
                {client.completedTasks} done
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-3 bg-muted/10" onClick={handleActionClick}>
        <div className="flex justify-between w-full">
          <Button variant="ghost" size="sm" className="hover:bg-primary/10" asChild>
            <Link href={`/dashboard/clients/${client.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </Link>
          </Button>
          
          {canDelete && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600" asChild>
                <Link href={`/dashboard/clients/${client.id}/edit`}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Link>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={() => confirmDelete(client.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default function ClientsPage() {
  console.log("ClientsPage rendering");
  const router = useRouter(); // Make sure you use this everywhere
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("card");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Check if user can modify clients - MOVED UP
  const hasWriteAccess = useMemo(() => {
    return canModifyClient(session);
  }, [session]);

  // Function to confirm delete - MOVED UP
  const confirmDelete = useCallback((clientId: string) => {
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
  }, []);

  // Utility functions
  const getDisplayName = (client: Client): string => {
    return client?.contactPerson || "Unnamed Client";
  };

  const isClientExpired = (client: Client) => {
    if (!client.isGuest || !client.accessExpiry) return false;
    return isAfter(new Date(), new Date(client.accessExpiry));
  };

  // NOW define columns after the functions it depends on are defined
  const columns = useMemo(() => [
    {
      header: "Name",
      accessorKey: "contactPerson",
      cell: (client: Client) => (
        <div className="font-medium">{getDisplayName(client)}</div>
      )
    },
    {
      header: "Company",
      accessorKey: "companyName",
      cell: (client: Client) => (
        <div>
          {client.companyName || (
            <span className="text-muted-foreground italic">Not provided</span>
          )}
        </div>
      )
    },
    {
      header: "Contact",
      accessorKey: "email",
      cell: (client: Client) => (
        <div>
          {client.email || client.phone || (
            <span className="text-muted-foreground italic">No contact</span>
          )}
        </div>
      )
    },
    {
      header: "Type",
      accessorKey: "isGuest",
      cell: (client: Client) => (
        <div>
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
        </div>
      )
    },
    {
      header: "Tasks",
      accessorKey: "activeTasks",
      cell: (client: Client) => (
        <div className="flex flex-col">
          <span className="text-sm">
            <span className="font-medium">{client.activeTasks}</span> active
          </span>
          <span className="text-xs text-muted-foreground">
            {client.completedTasks} completed
          </span>
        </div>
      )
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (client: Client) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          {hasWriteAccess ? (
            // Show dropdown menu with all actions for users with write access
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
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => confirmDelete(client.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Show just a View button for users without write access
            <Button 
              variant="ghost" 
              size="sm"
              asChild
            >
              <Link href={`/dashboard/clients/${client.id}`}>
                <Eye className="mr-1 h-4 w-4" />
                View
              </Link>
            </Button>
          )}
        </div>
      ),
      className: "text-right"
    }
  ], [hasWriteAccess, confirmDelete]); // Remove isClientExpired and getDisplayName from deps since they're now component functions

  // Handle view mode toggle
  const handleViewModeChange = useCallback((value: string) => {
    setViewMode(value as "table" | "card");
  }, []);

  // Read URL parameters and apply filters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Get view preference from localStorage first
        const savedView = localStorage.getItem('clientViewMode');
        if (savedView === 'table' || savedView === 'card') {
          setViewMode(savedView);
        }

        // Then check URL parameters (they override localStorage)
        const url = new URL(window.location.href);
        
        // Get client type filter
        const filterParam = url.searchParams.get('filter');
        if (filterParam === 'permanent' || filterParam === 'guest' || filterParam === 'all') {
          setActiveTab(filterParam);
        }
        
        // Get view mode
        const viewParam = url.searchParams.get('view');
        if (viewParam === 'table' || viewParam === 'card') {
          setViewMode(viewParam);
        }
        
        // Get search term
        const searchParam = url.searchParams.get('search');
        if (searchParam) {
          setSearchTerm(searchParam);
        }
        
        // Get page number
        const pageParam = url.searchParams.get('page');
        if (pageParam && !isNaN(parseInt(pageParam))) {
          setPage(parseInt(pageParam));
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
    }
  }, []);

  // Save view mode preference when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clientViewMode', viewMode);
      
      // Update URL with current view mode
      const url = new URL(window.location.href);
      url.searchParams.set('view', viewMode);
      
      // Update URL without full page navigation
      window.history.replaceState({}, '', url.toString());
    }
  }, [viewMode]);

  // Update URL when tab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      // Only set if different to avoid loops
      const currentFilter = url.searchParams.get('filter');
      if (currentFilter !== activeTab) {
        url.searchParams.set('filter', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeTab]);

  // Update URL when page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page.toString());
      window.history.replaceState({}, '', url.toString());
    }
  }, [page]);

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
    setSearchTerm(e.target.value);
  }, []);

  // Add this ref at the top of your component
  const currentRequestRef = useRef<number>(0);

  // Function to load clients with search and filtering
  const loadClients = useCallback(async (options?: {
    skipLoading?: boolean;
    forceRefresh?: boolean;
  }) => {
    // Only show loading UI for initial load or forced refreshes
    if (!options?.skipLoading) {
      setLoading(true);
    }
    
    // Use a ref to track the latest request to avoid race conditions
    const requestId = Date.now();
    currentRequestRef.current = requestId;
    
    setDataError(null);
    
    try {
      let url = `/api/clients?page=${page}&limit=10`;

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

      // Only update state if this is still the most recent request
      if (currentRequestRef.current === requestId) {
        setClients(processedClients);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalClients(response.data.pagination?.total || processedClients.length);
      }
    } catch (error: unknown) {
      console.error("Error loading clients:", error);
      const typedError = error as { response?: { data?: { error?: string } } };
      const errorMessage = typedError?.response?.data?.error || "Failed to load clients";
      toast.error(errorMessage);
      setClients([]);
    } finally {
      if (currentRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [page, activeTab]);

  // Add this effect to load clients when component mounts or dependencies change
  useEffect(() => {
    console.log("Loading clients effect triggered");
    loadClients();
  }, [loadClients]);

  // deleteClient function implementation

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

  // Note: isClientExpired function is already defined earlier in the component
  // and is used in the columns definition

  // Add proper skeleton state for loading
  if (loading) {
    console.log("Rendering loading state");
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
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex flex-col xs:flex-row gap-2">
            <Button asChild className="w-full xs:w-auto">
              <Link href="/dashboard/clients/create">
                <Building className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Add Permanent Client</span>
                <span className="xs:hidden">Add Permanent</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full xs:w-auto">
              <Link href="/dashboard/clients/guest/create">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden xs:inline">Add Guest Client</span>
                <span className="xs:hidden">Add Guest</span>
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
                <Button onClick={() => loadClients()}>Try Again</Button>
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
              <DataTable
                data={filteredClients}
                columns={columns}
                isLoading={loading}
                keyExtractor={(client) => client.id}
                onRowClick={(client) => router.push(`/dashboard/clients/${client.id}`)}
              />
            ) : (
              // CARD VIEW
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                  <ClientCard 
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