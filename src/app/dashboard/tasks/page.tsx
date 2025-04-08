"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
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
import { TaskPageLayout } from "@/components/layouts/task-page-layout";
import { TaskListSkeleton } from "@/components/loading/task-skeleton";

import {
  ArrowUpDown,
  ClipboardX,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  client: {
    id: string;
    contactPerson: string;
  } | null;
}

// Task List Item Component
const TaskListItem = ({ task }: { task: Task }) => {
  const router = useRouter();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  
  const handleRowClick = () => {
    router.push(`/dashboard/tasks/${task.id}`);
  };
  
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
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
    <tr 
      className="border-b hover:bg-muted/50 cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="p-4">
        <div>
          <p className="font-medium">{task.title}</p>
          <Badge variant="outline" className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
        </div>
      </td>
      <td className="p-4">
        <Badge className={getStatusColor(task.status)}>
          {task.status}
        </Badge>
      </td>
      <td className="p-4">
        {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : '-'}
      </td>
      <td className="p-4">
        {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
      </td>
      <td className="p-4 text-right" onClick={handleActionClick}>
        <DropdownMenu open={isActionMenuOpen} onOpenChange={setIsActionMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 data-[state=open]:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${task.id}`)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL("/api/tasks", window.location.origin);

      if (statusFilter && statusFilter !== "all") {
        url.searchParams.append("status", statusFilter);
      }

      const response = await axios.get(url.toString());
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const canCreateTask = useCallback((session: any) => {
    return session?.user?.role === "ADMIN" || session?.user?.role === "PARTNER";
  }, []);

  const filteredTasks = useMemo(() =>
    tasks.filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    ), [tasks, searchQuery]);

  const displayTasks = useMemo(() =>
    filteredTasks.slice(0, 50),
    [filteredTasks]);

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <TaskPageLayout
      title="Tasks"
      description="View and manage all your tasks in one place"
      showBackButton={false}
      maxWidth="max-w-full"
    >
      <div className="flex justify-end mb-4">
        {canCreateTask(session) && (
          <Button
            onClick={() => router.push("/dashboard/tasks/create")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Filter Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <Input
                    placeholder="Search by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(statusFilter !== "all" || searchQuery) && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Task List</CardTitle>
                {!loading && (
                  <p className="text-sm text-muted-foreground">
                    {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TaskListSkeleton />
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 gap-2">
                  <ClipboardX className="h-8 w-8 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground text-center">
                    No tasks found{searchQuery ? ` matching "${searchQuery}"` : ""}
                    {statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
                  </p>
                  {(searchQuery || statusFilter !== "all") && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
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
                      {displayTasks.map((task) => (
                        <TaskListItem key={task.id} task={task} />
                      ))}
                    </TableBody>
                  </Table>

                  {filteredTasks.length > 50 && (
                    <div className="py-2 px-4 text-center text-sm text-muted-foreground border-t">
                      Showing first 50 results of {filteredTasks.length} tasks. Please refine your search.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TaskPageLayout>
  );
}