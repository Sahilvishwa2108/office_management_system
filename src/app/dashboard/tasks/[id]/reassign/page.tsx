"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeftIcon,
  UserIcon,
  Loader2 as SpinnerIcon 
} from "lucide-react";

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
        const taskResponse = await axios.get(`/api/tasks/${taskId}`);
        setTask(taskResponse.data);
        
        // Fetch users (only staff who can be assigned tasks)
        const usersResponse = await axios.get('/api/users');
        setUsers(usersResponse.data.filter((user: User) => 
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
      <div className="container max-w-2xl py-10 flex justify-center items-center">
        <div className="flex flex-col items-center gap-2">
          <SpinnerIcon className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="container max-w-2xl py-10">
        <div className="text-center">Task not found</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
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
      
      <Card>
        <CardHeader>
          <CardTitle>Reassign Task</CardTitle>
          <CardDescription>
            Reassign "{task.title}" to another team member
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Assignee</label>
            <div className="p-2 rounded-md bg-muted flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <span>{task.assignedTo ? task.assignedTo.name : "Unassigned"}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Reassign To</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role.toLowerCase().replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Add a Note (Optional)</label>
            <Textarea 
              placeholder="Add context about why you're reassigning this task..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-32"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
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
                <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                Reassigning...
              </>
            ) : (
              "Reassign Task"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}