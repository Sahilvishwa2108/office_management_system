"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Loader2, ClipboardCheck, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  billingStatus?: string;
  assignedToId?: string | null;
  assignees?: Array<{userId: string}>;
}

interface AssignTaskButtonProps {
  userId: string;
  userName: string;
  onAssigned?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode; // Add support for children
}

export function AssignTaskButton({
  userId,
  userName,
  onAssigned,
  variant = "outline",
  size = "sm",
  className,
  children,
}: AssignTaskButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  // Fetch available tasks when dialog opens
  useEffect(() => {
    if (open) {
      fetchTasks();
    }
  }, [open]);

  // Fetch available tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch tasks that are not yet assigned or can be reassigned
      const response = await axios.get("/api/tasks/available");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load available tasks");
    } finally {
      setLoading(false);
    }
  };

  // Assign a task to the user
  const assignTask = async (taskId: string) => {
    setAssigning(taskId);
    try {
      // Step 1: Fetch the current task to get existing assignees
      const taskResponse = await axios.get(`/api/tasks/${taskId}`);
      const task = taskResponse.data;
      
      // Step 2: Extract current assignee IDs
      const currentAssigneeIds = task.assignees ? 
        task.assignees.map((a: { userId: string }) => a.userId) : 
        [];
      
      // If there's a legacy assignedToId and it's not in the assignees list, include it
      if (task.assignedToId && !currentAssigneeIds.includes(task.assignedToId)) {
        currentAssigneeIds.push(task.assignedToId);
      }
      
      // Step 3: Add the new user if not already included
      if (!currentAssigneeIds.includes(userId)) {
        currentAssigneeIds.push(userId);
      }
      
      // Step 4: Send the complete updated list of assignees
      await axios.patch(`/api/tasks/${taskId}/reassign`, {
        assignedToIds: currentAssigneeIds,
        note: `Task assigned to ${userName} via quick assignment`,
      }, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Rest of the function remains unchanged
      setAssignSuccess(taskId);
      toast.success(`Task assigned to ${userName} successfully`);
      
      setTimeout(() => {
        setOpen(false);
        if (onAssigned) {
          onAssigned();
        }
        setTimeout(() => {
          setAssignSuccess(null);
          setAssigning(null);
        }, 300);
        router.refresh();
      }, 800);
      
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task");
      setAssigning(null);
    }
  };

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn("whitespace-nowrap", className)}
        onClick={() => setOpen(true)}
        title={`Assign task to ${userName}`}
      >
        {children || (
          <>
            {size === "icon" ? (
              <ClipboardList className="h-4 w-4" />
            ) : (
              "Assign Task"
            )}
          </>
        )}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>Assign Task to {userName}</DialogTitle>
            <DialogDescription>
              Select a task from the list below to assign to this user.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? "No matching tasks found" : "No available tasks to assign"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-2">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors relative"
                      onClick={() => !assigning && !assignSuccess && assignTask(task.id)}
                    >
                      <div className="font-medium mb-1">{task.title}</div>
                      <div className="flex items-center justify-between">
                        <TaskStatusBadge 
                          status={task.status}
                          billingStatus={task.billingStatus}
                        />
                        <div className="text-xs text-muted-foreground">
                          {task.dueDate ? 
                            `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 
                            "No due date"
                          }
                        </div>
                      </div>
                      
                      {/* Show loading or success state */}
                      {(assigning === task.id || assignSuccess === task.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                          {assignSuccess === task.id ? (
                            <div className="flex flex-col items-center">
                              <div className="rounded-full bg-green-100 p-2 mb-2">
                                <ClipboardCheck className="h-6 w-6 text-green-600" />
                              </div>
                              <p className="text-sm font-medium text-green-600">Assigned!</p>
                            </div>
                          ) : (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}