"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TaskPageLayout } from "@/components/layouts/task-page-layout";
import { User as UserIcon, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SearchableMultiSelect } from "@/components/tasks/searchable-multi-select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface TaskAssignee {
  userId: string;
  user: User;
}

interface Task {
  id: string;
  title: string;
  assignedToId: string | null;
  assignedTo: User | null;
  assignees: TaskAssignee[];
}

export default function ReassignTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return "";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format role name
  const formatRole = (role: string): string => {
    if (!role) return "";
    return role.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch task data
        const taskResponse = await axios.get<Task>(`/api/tasks/${taskId}`);
        setTask(taskResponse.data);
        
        // Set initial selection from task data
        const initialAssignees = taskResponse.data.assignees?.map(a => a.userId) || [];
        // Fallback to legacy assignedToId
        if (initialAssignees.length === 0 && taskResponse.data.assignedToId) {
          initialAssignees.push(taskResponse.data.assignedToId);
        }
        setSelectedUserIds(initialAssignees);
        
        // Fetch users (only staff who can be assigned tasks)
        const usersResponse = await axios.get<User[]>('/api/users');
        setUsers(usersResponse.data.filter((user) => 
          ['BUSINESS_EXECUTIVE', 'BUSINESS_CONSULTANT', 'PARTNER'].includes(user.role)
        ));
        
      } catch (error) {
        console.error('Error fetching data:', error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setError(`Failed to load task data: ${errorMessage}`);
        toast.error('Failed to load required data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [taskId, router]);
  
  const handleReassign = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one team member");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Update task assignment
      await axios.patch(`/api/tasks/${taskId}/reassign`, {
        assignedToIds: selectedUserIds,
        note: note.trim() || undefined,
      });
      
      toast.success("Task reassigned successfully");
      router.push(`/dashboard/tasks/${taskId}`);
      
    } catch (error) {
      console.error("Error reassigning task:", error);
      // Improved error message extraction from Axios errors
      let errorMessage = "Failed to reassign task";
      
      if (axios.isAxiosError(error) && error.response) {
        // For standard API error responses
        if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.status === 403) {
          errorMessage = "Permission denied: You don't have permission to reassign this task";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <TaskPageLayout title="Reassign Task" backHref={`/dashboard/tasks/${taskId}`} maxWidth="max-w-xl">
        <Card className="shadow-md border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle>Reassign Task</CardTitle>
            <CardDescription>Loading task details...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-medium">Current Assignees</div>
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Reassign To</div>
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Add a Note</div>
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </TaskPageLayout>
    );
  }
  
  if (error) {
    return (
      <TaskPageLayout title="Error" backHref={`/dashboard/tasks/${taskId}`} maxWidth="max-w-xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          className="mt-4"
          onClick={() => router.push(`/dashboard/tasks/${taskId}`)}
        >
          Back to Task
        </Button>
      </TaskPageLayout>
    );
  }
  
  if (!task) {
    return (
      <TaskPageLayout title="Task Not Found" backHref="/dashboard/tasks" maxWidth="max-w-xl">
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p>Task not found or you don&apos;t have permission to access it.</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard/tasks")}>
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      </TaskPageLayout>
    );
  }

  return (
    <TaskPageLayout 
      title="Reassign Task" 
      description={`Reassign: ${task.title}`}
      backHref={`/dashboard/tasks/${taskId}`}
      maxWidth="max-w-xl"
    >
      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-primary">Reassign Task</CardTitle>
          <CardDescription>
            Change who is responsible for task: <span className="font-medium">{task.title}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary-foreground/90">Current Assignees</label>
            <div className="p-4 rounded-md bg-muted/50 border">
              {task.assignees && task.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map(assignee => (
                    <Badge key={assignee.userId} variant="secondary" className="flex items-center gap-1 pl-1 pr-2 py-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={assignee.user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${assignee.user.name}`} />
                        <AvatarFallback className="text-[10px]">{getInitials(assignee.user.name)}</AvatarFallback>
                      </Avatar>
                      <span>{assignee.user.name}</span>
                      {assignee.user.role && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatRole(assignee.user.role)})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              ) : task.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assignedTo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`} />
                    <AvatarFallback>{getInitials(task.assignedTo.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <span>{task.assignedTo.name}</span>
                    {task.assignedTo.role && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatRole(task.assignedTo.role)})
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Unassigned
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary-foreground/90">Reassign To*</label>
            <SearchableMultiSelect
              options={users.map(user => ({
                value: user.id,
                label: user.name,
                role: user.role,
                email: user.email,
                avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
              }))}
              selected={selectedUserIds}
              onChange={setSelectedUserIds}
              placeholder="Select team members"
              className="transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {selectedUserIds.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Please select at least one team member to assign this task to
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary-foreground/90">Add a Note (Optional)</label>
            <Textarea 
              placeholder="Add context about why you're reassigning this task..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px] resize-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReassign}
            disabled={submitting || selectedUserIds.length === 0}
            className="relative"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reassigning...
              </>
            ) : (
              "Reassign Task"
            )}
          </Button>
        </CardFooter>
      </Card>
    </TaskPageLayout>
  );
}