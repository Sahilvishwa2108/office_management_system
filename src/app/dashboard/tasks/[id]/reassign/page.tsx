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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TaskPageLayout } from "@/components/layouts/task-page-layout";
import { User as UserIcon, Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  assignedToId: string | null;
  assignedTo: User | null;
}

export default function ReassignTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
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
    if (!selectedUserId) {
      toast.error("Please select a team member");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Update task assignment
      await axios.patch(`/api/tasks/${taskId}/reassign`, {
        assignedToId: selectedUserId,
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
            <label className="text-sm font-medium">Current Assignee</label>
            <div className="p-3 rounded-md bg-muted flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <span>{task.assignedTo ? task.assignedTo.name : "Unassigned"}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Reassign To*</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role.replace(/_/g, " ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedUserId && (
              <p className="text-xs text-muted-foreground">
                Please select a team member to assign this task to
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
            disabled={submitting || !selectedUserId}
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