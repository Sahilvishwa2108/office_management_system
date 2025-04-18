"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Add this import for Link
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label"; // Add this import for Label
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Add this import for Avatar components
import {
  ArrowLeftIcon,
  PencilIcon as Edit, // Rename to Edit for clarity
  Loader2,
  UserPlus,
  ListTodo, // Add this import for ListTodo
  CheckCircle,
  Receipt,
} from "lucide-react";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskDetailSkeleton } from "@/components/loading/task-skeleton";
import { BillingApprovalButton } from "@/components/tasks/billing-approval-button"; // Add this import for BillingApprovalButton
import { TaskAssignees } from "@/components/tasks/task-assignees";

// Add the missing getInitials function
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Fix any types
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Update Task interface to include assignees
interface TaskAssignee {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  billingStatus?: string; // Add billingStatus property
  assignedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  // Add assignees array
  assignees: TaskAssignee[];
  client: {
    id: string;
    contactPerson: string;
    companyName: string | null;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

// Add these helper functions to control permissions
const canEditTask = (task: Task, currentUser: User) => {
  if (!currentUser) return false;
  
  // Admin can edit all tasks
  if (currentUser.role === "ADMIN") return true;
  
  // Creator can edit their own tasks
  if (task.assignedBy?.id === currentUser.id) return true;
  
  // No one else can edit tasks
  return false;
};

const canReassignTask = (currentUser: User) => {
  if (!currentUser) return false;
  return currentUser.role === "ADMIN" || currentUser.role === "PARTNER";
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Properly type the unwrapped params
  const resolvedParams = React.use(params) as { id: string };
  const taskId = resolvedParams.id;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);

  // Add a state variable to track billing status changes
  const [currentBillingStatus, setCurrentBillingStatus] = useState(task?.billingStatus);

  // Memoized data fetching functions
  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<Task>(`/api/tasks/${taskId}`);
      setTask(response.data);
      setNewStatus(response.data.status);
      setCurrentBillingStatus(response.data.billingStatus); // Update billing status
      return response.data;
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load task details");
      return null;
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  const fetchComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const response = await axios.get<Comment[]>(`/api/tasks/${taskId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      // Set comments to empty array to prevent mapping errors
      setComments([]);
      toast.error("Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  }, [taskId]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get<{ id: string; name: string; email: string; role: string }>('/api/users/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  }, []);

  // Load all data in parallel for better performance
  useEffect(() => {
    if (taskId) {
      Promise.all([
        fetchTask(),
        fetchComments(),
        fetchCurrentUser()
      ]);
    }
  }, [fetchTask, fetchComments, fetchCurrentUser, taskId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-500 hover:bg-gray-600";
      case "in-progress": return "bg-blue-500 hover:bg-blue-600";
      case "review": return "bg-yellow-500 hover:bg-yellow-600";
      case "completed": return "bg-green-500 hover:bg-green-600";
      case "cancelled": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Use useMemo where appropriate
  const statusColor = useMemo(() => getStatusColor(task?.status || "pending"), [task?.status]);
  
  const updateTaskStatus = async () => {
    if (!newStatus || newStatus === task?.status) return;

    try {
      setUpdating(true);
      await axios.patch(`/api/tasks/${taskId}`, {
        status: newStatus
      });

      setTask(prev => prev ? {...prev, status: newStatus} : null);
      toast.success("Task status updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task status");
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-500 hover:bg-green-600";
      case "medium": return "bg-yellow-500 hover:bg-yellow-600";
      case "high": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  if (loading) {
    return <TaskDetailSkeleton />;
  }

  if (!task) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Task not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      {/* Back button and title */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-4" 
          onClick={() => router.push("/dashboard/tasks")}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back to Tasks
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:grid-flow-row-dense">
        {/* Task details - Left column */}
        <div className="lg:col-span-2 h-auto flex flex-col">
          <Card className="h-full flex-grow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{task.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className={statusColor}>
                      {task.status}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <Badge variant="outline" className={
                        new Date(task.dueDate) < new Date() && task.status !== 'completed' 
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" 
                          : ""
                      }>
                        Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Task description */}
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <div className="text-sm text-muted-foreground">
                  {task.description ? (
                    <p className="whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <p>No description provided</p>
                  )}
                </div>
              </div>

              {/* Task metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h3 className="text-sm font-medium mb-1">Assigned By</h3>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{getInitials(task.assignedBy.name)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">{task.assignedBy.name}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Assigned To</h3>
                  <TaskAssignees 
                    assignees={task.assignees} 
                    legacyAssignedTo={task.assignedTo}
                    showTooltip={true}
                  />
                </div>
                
                {task.client && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Client</h3>
                    <Link 
                      href={`/dashboard/clients/${task.client.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {task.client.contactPerson}
                      {task.client.companyName && ` (${task.client.companyName})`}
                    </Link>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Created</h3>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task actions - Right column */}
        <div className="h-auto flex flex-col">
          {/* Status update card */}
          <Card className="h-full flex-grow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Task Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status update dropdown */}
              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select
                  value={newStatus || task.status}
                  onValueChange={setNewStatus}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={updateTaskStatus} 
                disabled={!newStatus || newStatus === task.status || updating} 
                className="w-full"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
              
              {/* Action buttons */}
              <div className="pt-4 space-y-3 border-t">
                {canEditTask(task, session?.user) && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/tasks/${task.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Task
                    </Link>
                  </Button>
                )}
                
                {canReassignTask(session?.user) && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/tasks/${task.id}/reassign`}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Reassign Task
                    </Link>
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link href={`/dashboard/tasks`}>
                    <ListTodo className="mr-2 h-4 w-4" />
                    View All Tasks
                  </Link>
                </Button>

                {task.status === "completed" && (currentBillingStatus === "pending_billing") && isAdmin && (
                  <div className="mt-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start gap-3">
                        <Receipt className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium">Billing Approval Required</h3>
                          <p className="text-sm text-amber-800 mb-3">
                            This task has been marked as completed and is awaiting billing approval.
                          </p>
                          <BillingApprovalButton 
                            taskId={task.id} 
                            taskTitle={task.title}
                            onApproved={() => {
                              setTask(prev => prev ? { ...prev, billingStatus: "billed" } : null);
                              toast.success("Task billing approved successfully");
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {task.status === "completed" && currentBillingStatus === "billed" && (
                  <div className="mt-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p className="text-sm text-green-700">
                          This task has been completed and billed
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments section - Full width */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Discussion</CardTitle>
              <CardDescription>
                Add comments or notes about this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commentsLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                </div>
              ) : currentUser ? (
                <TaskComments 
                  taskId={taskId} 
                  comments={comments}
                  currentUser={currentUser}
                />
              ) : null}
            </CardContent>
            <CardFooter className="border-t pt-4">
              {/* Comment form will go here */}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}