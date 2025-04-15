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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  LayoutGrid,
  LayoutList,
  RefreshCw,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { canDeleteTask } from "@/lib/permissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskAssignees } from "@/components/tasks/task-assignees";

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
}

// Task Card Component
const TaskListItem = ({ 
  task, 
  confirmDelete,
  canDelete 
}: { 
  task: Task, 
  confirmDelete: (id: string) => void,
  canDelete: boolean 
}) => {
  const router = useRouter();
  
  const handleRowClick = useCallback(() => {
    router.push(`/dashboard/tasks/${task.id}`);
  }, [router, task.id]);
  
  const handleActionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "in-progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
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
      className="p-4 border rounded-lg mb-4 hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{task.title}</span>
            <Badge className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date'}
          </div>
          <div className="text-xs mt-2 flex items-center gap-2">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {task.priority} priority
            </Badge>
            <span className="text-muted-foreground">
              Assigned to: {task.assignedTo?.name || 'Unassigned'}
            </span>
            {task.client && (
              <span className="text-muted-foreground">
                Client: {task.client.contactPerson}
              </span>
            )}
          </div>
          <div className="mt-2">
            <span className="text-sm font-medium">Assigned to: </span>
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
            <Link href={`/dashboard/tasks/${task.id}`}>
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
            <Link href={`/dashboard/tasks/${task.id}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </Button>
          
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={() => confirmDelete(task.id)}
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

// Task Table Row Component
const TaskTableRow = ({ 
  task, 
  confirmDelete,
  canDelete
}: { 
  task: Task, 
  confirmDelete: (id: string) => void,
  canDelete: boolean
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "in-progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
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
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/tasks/${task.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Task
              </Link>
            </DropdownMenuItem>
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

export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "card">("card");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Use debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use localStorage to remember view preference
  useEffect(() => {
    try {
      const savedView = localStorage.getItem('taskViewMode');
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
      localStorage.setItem('taskViewMode', viewMode);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [viewMode]);

  const fetchTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setDataError(null);

    try {
      const url = new URL("/api/tasks", window.location.origin);

      if (statusFilter && statusFilter !== "all") {
        url.searchParams.append("status", statusFilter);
      }

      if (debouncedSearchTerm) {
        url.searchParams.append("search", debouncedSearchTerm);
      }

      const response = await axios.get<Task[]>(url.toString(), { timeout: 8000 });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setDataError("Failed to load tasks. Please try again.");
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Permission check - memoized
  const canManageTasks = useMemo(() => {
    return session?.user?.role === "ADMIN" || session?.user?.role === "PARTNER";
  }, [session]);

  // Permission check based on the current task
  const canDeleteForTask = useCallback((task: Task) => {
    return canDeleteTask(session, task);
  }, [session]);

  // Filter tasks based on search and status
  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];

    return tasks.filter((task) => {
      // Already filtered by API for status and search, but this adds extra layer for client-side changes
      return true;
    });
  }, [tasks]);

  // Handle view mode toggle
  const handleViewModeChange = useCallback((mode: "table" | "card") => {
    setViewMode(mode);
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

  // Loading state
  if (loading) {
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
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
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
          <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">Manage projects and track task progress</p>
        </div>

        {canManageTasks && (
          <Button onClick={() => router.push("/dashboard/tasks/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      {/* Tasks content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>View and manage all task assignments</CardDescription>
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
              {/* Task status filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex space-x-1 rounded-md overflow-hidden border w-full sm:w-auto">
                  <Button 
                    variant={statusFilter === "all" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className="flex-1 sm:flex-none rounded-none"
                  >
                    All Tasks
                  </Button>
                  <Button 
                    variant={statusFilter === "pending" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                    className="flex-1 sm:flex-none rounded-none"
                  >
                    Pending
                  </Button>
                  <Button 
                    variant={statusFilter === "in-progress" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setStatusFilter("in-progress")}
                    className="flex-1 sm:flex-none rounded-none"
                  >
                    In Progress
                  </Button>
                  <Button 
                    variant={statusFilter === "completed" ? "default" : "ghost"} 
                    size="sm"
                    onClick={() => setStatusFilter("completed")}
                    className="flex-1 sm:flex-none rounded-none"
                  >
                    Completed
                  </Button>
                </div>
              </div>

              {/* Search box */}
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
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

            {/* Task list - table view */}
            {!dataError && filteredTasks.length > 0 && viewMode === "table" && (
              <div className="rounded-md border">
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
                        canDelete={canDeleteForTask(task)} // Apply permission check
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Task list - card view */}
            {!dataError && filteredTasks.length > 0 && viewMode === "card" && (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <TaskListItem 
                    key={task.id} 
                    task={task}
                    confirmDelete={confirmDelete}
                    canDelete={canDeleteForTask(task)} // Apply permission check
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Always show count summary in footer */}
        {!dataError && filteredTasks.length > 0 && (
          <CardFooter className="border-t py-3 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {filteredTasks.length} task{filteredTasks.length !== 1 && "s"} 
              {searchTerm ? " matching your search" : ""}
              {statusFilter !== "all" ? ` with ${statusFilter} status` : ""}
            </div>
            
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