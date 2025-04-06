"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  ClipboardListIcon,
  UserIcon,
  BuildingIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  Loader2 as SpinnerIcon,
} from "lucide-react";
import { TaskComments } from "@/components/tasks/task-comments";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/tasks/${taskId}`);
        setTask(response.data);
        setNewStatus(response.data.status);
      } catch (error) {
        console.error("Error fetching task:", error);
        toast.error("Failed to load task details");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        const response = await axios.get(`/api/tasks/${taskId}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast.error("Failed to load comments");
      } finally {
        setCommentsLoading(false);
      }
    };
    
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/users/me');
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    
    if (taskId) {
      fetchTask();
      fetchComments();
      fetchCurrentUser();
    }
  }, [taskId]);
  
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
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-500 hover:bg-green-600";
      case "medium": return "bg-yellow-500 hover:bg-yellow-600";
      case "high": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-2">
            <SpinnerIcon className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xl">Loading task details...</p>
          </div>
        </div>
      </div>
    );
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
    <div className="container py-10">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main task information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                <CardDescription>
                  Created {format(new Date(task.createdAt), "PPP")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </Badge>
                <Badge className={getStatusColor(task.status)}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Task description */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Description</h3>
                <div className="p-4 bg-muted rounded-md min-h-[100px]">
                  {task.description || "No description provided"}
                </div>
              </div>
              
              {/* Task metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Due Date:</span>
                  <span>
                    {task.dueDate 
                      ? format(new Date(task.dueDate), "PPP") 
                      : "No due date"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Assigned By:</span>
                  <span>{task.assignedBy.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Assigned To:</span>
                  <span>
                    {task.assignedTo ? task.assignedTo.name : "Unassigned"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <BuildingIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Client:</span>
                  <span>
                    {task.client 
                      ? `${task.client.contactPerson}${task.client.companyName ? ` (${task.client.companyName})` : ''}`
                      : "No client associated"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Comments section */}
          <div className="mt-6">
            {commentsLoading ? (
              <Card>
                <CardContent className="py-6 flex justify-center">
                  <SpinnerIcon className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : currentUser ? (
              <TaskComments 
                taskId={taskId} 
                comments={comments}
                currentUser={currentUser}
              />
            ) : null}
          </div>
        </div>
        
        {/* Task actions panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Task Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Update status */}
              <div className="space-y-2">
                <h4 className="font-medium">Update Status</h4>
                <Select value={newStatus || undefined} onValueChange={setNewStatus}>
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
                <Button 
                  className="w-full" 
                  disabled={updating || newStatus === task.status}
                  onClick={updateTaskStatus}
                >
                  {updating ? (
                    <>
                      <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
              </div>
              
              <Separator />
              
              {/* Task Reassignment */}
              <div className="space-y-2">
                <h4 className="font-medium">Manage Task</h4>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => router.push(`/dashboard/tasks/${taskId}/reassign`)}
                >
                  <UserIcon className="h-4 w-4" />
                  Reassign Task
                </Button>
              </div>
              
              <Separator />
              
              {/* Edit task */}
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => router.push(`/dashboard/tasks/${taskId}/edit`)}
              >
                <PencilIcon className="h-4 w-4" />
                Edit Task Details
              </Button>
              
              {/* Delete task */}
              <Button 
                variant="destructive" 
                className="w-full flex items-center justify-center gap-2"
                onClick={async () => {
                  const confirmed = window.confirm("Are you sure you want to delete this task? This action cannot be undone.");
                  if (!confirmed) return;
                  
                  try {
                    await axios.delete(`/api/tasks/${taskId}`);
                    toast.success("Task deleted successfully");
                    router.push("/dashboard/tasks");
                  } catch (error) {
                    console.error("Error deleting task:", error);
                    toast.error("Failed to delete task");
                  }
                }}
              >
                <TrashIcon className="h-4 w-4" />
                Delete Task
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}