"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";

import {
  Search, 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2, 
  ClipboardList, 
  RefreshCw, 
  Grid, 
  List,
  ChevronDown
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { canDeleteTask } from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskAssignees } from "@/components/tasks/task-assignees";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedById: string;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  client: {
    id: string;
    contactPerson: string;
  } | null;
  assignees?: {
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    }
  }[];
  [key: string]: unknown; // Add index signature to satisfy canDeleteTask requirements
}

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// Task Card Component - Improved styling for mobile
const TaskListItem = ({ 
  task, 
  confirmDelete,
  canDelete,
  canEdit 
}: { 
  task: Task, 
  confirmDelete: (id: string) => void,
  canDelete: boolean,
  canEdit: boolean 
}) => {
  const router = useRouter();
  
  const handleRowClick = useCallback(() => {
    router.push(`/dashboard/tasks/${task.id}`);
  }, [router, task.id]);
  
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "review": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "medium": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };
  
  return (
    <div 
      onClick={handleRowClick}
      className="h-full border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors shadow-sm hover:shadow-md p-3 sm:p-4 flex flex-col"
    >
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <Badge className={`${getStatusColor(task.status)} whitespace-nowrap`}>
          {task.status}
        </Badge>
        <Badge variant="outline" className={`${getPriorityColor(task.priority)} whitespace-nowrap`}>
          {task.priority} priority
        </Badge>
      </div>
      
      <h3 className="font-medium text-base sm:text-lg mb-2 line-clamp-2">{task.title}</h3>
      
      <div className="text-sm text-muted-foreground mt-auto">
        Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date'}
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <span className="text-sm font-medium block mb-2">Assigned to:</span>
        {task.assignees && task.assignees.length > 0 ? (
          <TaskAssignees 
            assignees={task.assignees} 
            limit={3} 
            size="sm" 
          />
        ) : task.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`} />
              <AvatarFallback>{getInitials(task.assignedTo.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{task.assignedTo.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )}
      </div>
      
      <div 
        className="flex flex-wrap gap-2 mt-4 pt-3 border-t"
        onClick={handleActionClick}
      >
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-9 flex-1 sm:flex-none"
        >
          <Link href={`/dashboard/tasks/${task.id}`}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Link>
        </Button>
        
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 flex-1 sm:flex-none"
          >
            <Link href={`/dashboard/tasks/${task.id}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </Button>
        )}
        
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="h-9 flex-1 sm:flex-none"
            onClick={() => confirmDelete(task.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

// Task Table Row Component
const TaskTableRow = ({ 
  task, 
  confirmDelete,
  canDelete,
  canEdit
}: { 
  task: Task, 
  confirmDelete: (id: string) => void,
  canDelete: boolean,
  canEdit: boolean
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "review": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low": return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Low</Badge>;
      case "medium": return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Medium</Badge>;
      case "high": return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">High</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };
  
  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{task.title}</p>
          <div className="mt-1">
            {getPriorityBadge(task.priority)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(task.status)}>
          {task.status}
        </Badge>
      </TableCell>
      <TableCell>
        {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : '-'}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {task.assignees && task.assignees.length > 0 ? (
          <TaskAssignees 
            assignees={task.assignees} 
            limit={2} 
            size="sm" 
          />
        ) : task.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`} />
              <AvatarFallback>{getInitials(task.assignedTo.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{task.assignedTo.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )}
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
              <Link href={`/dashboard/tasks/${task.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            
            {canEdit && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/tasks/${task.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Task
                </Link>
              </DropdownMenuItem>
            )}
            
            {canDelete && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => confirmDelete(task.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Task
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

// Main component - no more useSearchParams
export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"client" | "server">("client");
  // Add current page to state instead of getting from URL
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: 20,
    pageCount: 0
  });

  // Use debounced search with longer delay for smoother experience
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Read URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        
        // Get status from URL
        const statusParam = url.searchParams.get('status');
        if (statusParam && ["pending", "in_progress", "review", "completed", "cancelled", "all"].includes(statusParam)) {
          setStatusFilter(statusParam);
        }
        
        // Get search term from URL
        const searchParam = url.searchParams.get('search');
        if (searchParam) {
          setSearchTerm(searchParam);
          setSearchInputValue(searchParam);
        }
        
        // Get view mode from URL or localStorage
        const viewParam = url.searchParams.get('view');
        if (viewParam === 'table' || viewParam === 'card') {
          setViewMode(viewParam);
        } else {
          try {
            const savedView = localStorage.getItem('taskViewMode');
            if (savedView === 'table' || savedView === 'card') {
              setViewMode(savedView);
            }
          } catch (error) {
            console.error("Error accessing localStorage:", error);
          }
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      } finally {
        setIsInitialLoad(false);
      }
    }
  }, []);

  // Update URL when filters change, but don't trigger re-renders
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialLoad) {
      try {
        const url = new URL(window.location.href);
        
        // Update status in URL
        if (statusFilter !== 'all') {
          url.searchParams.set('status', statusFilter);
        } else {
          url.searchParams.delete('status');
        }
        
        // Update search in URL
        if (debouncedSearchTerm) {
          url.searchParams.set('search', debouncedSearchTerm);
        } else {
          url.searchParams.delete('search');
        }
        
        // Update view mode in URL
        url.searchParams.set('view', viewMode);
        
        // Update URL without page reload
        window.history.replaceState({}, '', url.toString());
        
        // Also save view mode to localStorage
        try {
          localStorage.setItem('taskViewMode', viewMode);
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
      } catch (error) {
        console.error("Error updating URL:", error);
      }
    }
  }, [statusFilter, debouncedSearchTerm, viewMode, isInitialLoad]);

  // Fetch all tasks - but only when necessary
  const fetchTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setDataError(null);

    try {
      const url = new URL("/api/tasks", window.location.origin);
      
      // Add pagination parameters
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("limit", pagination.pageSize.toString());

      // Add status filter parameter if it's not "all"
      if (statusFilter !== "all") {
        url.searchParams.append("status", statusFilter);
      }

      // Add search term if using server-side search
      if (searchMode === "server" && debouncedSearchTerm) {
        url.searchParams.append("search", debouncedSearchTerm);
      }

      // Add sorting parameters
      url.searchParams.append("sortField", "createdAt");
      url.searchParams.append("sortOrder", "desc");

      // Increase timeout to 15 seconds
      const response = await axios.get(url.toString(), { 
        timeout: 15000 
      });
      
      // Handle new response format with pagination
      const { tasks, pagination: paginationMeta } = response.data;
      setAllTasks(tasks);
      setPagination(paginationMeta);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      
      // Provide more specific error messages
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        setDataError("Request timed out. The server is taking too long to respond. Try applying filters to reduce the amount of data.");
        toast.error("Request timed out. Try narrowing your search.");
      } else {
        setDataError("Failed to load tasks. Please try again.");
        toast.error("Failed to load tasks");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, debouncedSearchTerm, searchMode, currentPage, pagination.pageSize]);

  // Only fetch when status filter changes or on refresh - not on search term changes
  useEffect(() => {
    if (!isInitialLoad) {
      fetchTasks();
    }
  }, [fetchTasks, statusFilter, isInitialLoad]);

  // Smooth client-side search handling
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value);
    
    // Update the search term after typing stops (will trigger URL update)
    setSearchTerm(value);
  }, []);

  // Permission check - memoized
  const canManageTasks = useMemo(() => {
    return session?.user?.role === "ADMIN" || session?.user?.role === "PARTNER";
  }, [session]);

  // Permission check for editing a specific task
  const canEditTask = useCallback((task: Task) => {
    if (session?.user?.role === "ADMIN") return true;
    if (session?.user?.role === "PARTNER" && session?.user?.id === task.assignedById) return true;
    return false;
  }, [session]);

  // Permission check based on the current task
  const canDeleteForTask = useCallback((task: Task) => {
    return canDeleteTask(session, task);
  }, [session]);

  // Filter tasks based on search and status - client-side filtering for search
  const filteredTasks = useMemo(() => {
    if (!allTasks || !Array.isArray(allTasks)) return [];
    
    // If using server-side search, return all tasks as they're already filtered
    if (searchMode === "server") return allTasks;
    
    // Client-side search filtering
    if (!debouncedSearchTerm) return allTasks;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return allTasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) || 
      (task.client?.contactPerson && task.client.contactPerson.toLowerCase().includes(searchLower)) ||
      (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(searchLower))
    );
  }, [allTasks, debouncedSearchTerm, searchMode]);

  // Update URL when page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Delete task handler
  const confirmDelete = useCallback((taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  }, []);

  const deleteTask = async () => {
    if (!taskToDelete) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`/api/tasks/${taskToDelete}`);
      toast.success("Task deleted successfully");
      setDeleteDialogOpen(false);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } finally {
      setDeleteLoading(false);
      setTaskToDelete(null);
    }
  };

  // Clear search button handler
  const clearSearch = () => {
    setSearchInputValue("");
    setSearchTerm("");
  };

  // Load more tasks function for infinite scrolling
  const loadMoreTasks = useCallback(() => {
    if (currentPage < pagination.pageCount) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pagination.pageCount]);

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-9 w-32" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-6 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-10 w-full mt-2" />
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
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">Manage projects and track task progress</p>
        </div>

        {canManageTasks && (
          <Button 
            onClick={() => router.push("/dashboard/tasks/create")} 
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      {/* Tasks content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="mb-2 sm:mb-0">
              <CardTitle>Tasks</CardTitle>
              <CardDescription>View and manage all task assignments</CardDescription>
            </div>
            
            {/* View mode toggle */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setViewMode("card")}
                aria-label="Card view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {/* Task status filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-48">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span>
                          {statusFilter === "all" ? "All Tasks" : 
                          statusFilter === "pending" ? "Pending" :
                          statusFilter === "in_progress" ? "In Progress" :
                          statusFilter === "review" ? "In Review" :
                          statusFilter === "completed" ? "Completed" :
                          statusFilter === "cancelled" ? "Cancelled" : "All Tasks"}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                        All Tasks
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("in_progress")}>
                        In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("review")}>
                        In Review
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                        Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
                        Cancelled
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Search box remains here */}
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-8 pr-10 h-9"
                    value={searchInputValue}
                    onChange={handleSearchChange}
                  />
                  {refreshing ? (
                    <RefreshCw className="animate-spin absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  ) : searchInputValue && (
                    <button 
                      onClick={clearSearch}
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
            </div>

            {/* Error state */}
            {dataError && (
              <div className="text-center py-12 border rounded-md bg-background">
                <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                <h3 className="text-lg font-medium mb-2">Error loading tasks</h3>
                <p className="text-muted-foreground mb-6">{dataError}</p>
                <Button 
                  onClick={() => fetchTasks(true)}
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
            {!dataError && filteredTasks.length === 0 && (
              <div className="text-center py-12 border rounded-md bg-background">
                <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm
                    ? "No tasks match your search criteria"
                    : statusFilter !== "all"
                    ? `No ${statusFilter} tasks found`
                    : "No tasks have been created yet"}
                </p>
                {canManageTasks && (
                  <Button asChild>
                    <Link href="/dashboard/tasks/create">Create New Task</Link>
                  </Button>
                )}
              </div>
            )}

            {/* Task list - card view - restored grid layout */}
            {!dataError && filteredTasks.length > 0 && viewMode === "card" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.slice(0, currentPage * pagination.pageSize).map((task) => (
                    <TaskListItem
                      key={task.id}
                      task={task}
                      confirmDelete={confirmDelete}
                      canDelete={canDeleteForTask(task)} // Fixed: Now properly checks ownership
                      canEdit={canEditTask(task)}
                    />
                  ))}
                </div>
                
                {/* Load more button - only show if there are more pages */}
                {currentPage < pagination.pageCount && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="gap-2"
                      disabled={refreshing}
                    >
                      {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Load More Tasks
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Task list - table view */}
            {!dataError && filteredTasks.length > 0 && viewMode === "table" && (
              <div className="rounded-md border">
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TaskTableRow 
                          key={task.id} 
                          task={task}
                          confirmDelete={confirmDelete}
                          canDelete={canDeleteForTask(task)}
                          canEdit={canEditTask(task)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Always show count summary in footer */}
        {!dataError && filteredTasks.length > 0 && (
          <CardFooter className="border-t py-3 flex-col sm:flex-row gap-2">
            <div className="text-sm text-muted-foreground flex-1">
              {pagination.total} task{pagination.total !== 1 && "s"} 
              {searchTerm ? " matching your search" : ""}
              {statusFilter !== "all" ? ` with ${statusFilter} status` : ""}
              {pagination.total > 0 && ` (showing ${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(pagination.page * pagination.pageSize, pagination.total)} of ${pagination.total})`}
            </div>
            
            <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
              {pagination.pageCount > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page === 1}
                      />
                    </PaginationItem>
                    
                    {/* First page */}
                    {pagination.page > 2 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(1)}>
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {/* Ellipsis if needed */}
                    {pagination.page > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Previous page if not first */}
                    {pagination.page > 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(pagination.page - 1)}>
                          {pagination.page - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {/* Current page */}
                    <PaginationItem>
                      <PaginationLink isActive>
                        {pagination.page}
                      </PaginationLink>
                    </PaginationItem>
                    
                    {/* Next page if not last */}
                    {pagination.page < pagination.pageCount && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(pagination.page + 1)}>
                          {pagination.page + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {/* Ellipsis if needed */}
                    {pagination.page < pagination.pageCount - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Last page */}
                    {pagination.page < pagination.pageCount - 1 && (
                      <PaginationItem>
                        <PaginationLink onClick={() => handlePageChange(pagination.pageCount)}>
                          {pagination.pageCount}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(pagination.pageCount, pagination.page + 1))}
                        disabled={pagination.page === pagination.pageCount}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTasks(true)}
                disabled={refreshing}
                className="h-8 gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              and all associated data including comments and attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteTask();
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