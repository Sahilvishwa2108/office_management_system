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
import { User as UserIcon, Loader2, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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

// Multi-select component for assignees
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options"
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "relative w-full cursor-pointer rounded-md border border-input bg-transparent text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-1 ring-ring"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex min-h-10 flex-wrap items-center gap-1 p-1 pe-10">
          {selected.length === 0 && (
            <div className="px-2 py-1.5 text-muted-foreground">{placeholder}</div>
          )}
          {selected.map(value => {
            const option = options.find(o => o.value === value);
            return option ? (
              <Badge key={value} variant="secondary" className="m-0.5">
                {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(value);
                  }}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              </Badge>
            ) : null;
          })}
        </div>
        <div className="absolute right-3 top-3">
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {options.map(option => (
            <div
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center p-2 hover:bg-accent",
                selected.includes(option.value) && "bg-accent"
              )}
              onClick={() => handleSelect(option.value)}
            >
              <Checkbox
                checked={selected.includes(option.value)}
                className="mr-2"
                onCheckedChange={() => {}}
              />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReassignTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  // Change to array of selected IDs
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
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
        toast.error('Failed to load required data');
        router.push(`/dashboard/tasks/${taskId}`);
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
      toast.error("Failed to reassign task");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <TaskPageLayout title="Reassign Task" backHref={`/dashboard/tasks/${taskId}`} maxWidth="max-w-xl">
        <div className="flex justify-center items-center h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TaskPageLayout>
    );
  }
  
  if (!task) {
    return (
      <TaskPageLayout title="Task Not Found" backHref="/dashboard/tasks" maxWidth="max-w-xl">
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <p>Task not found or you don't have permission to access it.</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Reassign Task</CardTitle>
          <CardDescription>
            Change who is responsible for this task
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Assignees</label>
            <div className="p-3 rounded-md bg-muted">
              {task.assignees && task.assignees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map(assignee => (
                    <Badge key={assignee.userId} variant="secondary">
                      {assignee.user.name}
                    </Badge>
                  ))}
                </div>
              ) : task.assignedTo ? (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <span>{task.assignedTo.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Reassign To*</label>
            <MultiSelect
              options={users.map(user => ({
                value: user.id,
                label: `${user.name} (${user.role.replace(/_/g, " ")})`
              }))}
              selected={selectedUserIds}
              onChange={setSelectedUserIds}
              placeholder="Select team members"
            />
            {selectedUserIds.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Please select at least one team member to assign this task to
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Add a Note (Optional)</label>
            <Textarea 
              placeholder="Add context about why you're reassigning this task..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReassign}
            disabled={submitting || selectedUserIds.length === 0}
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