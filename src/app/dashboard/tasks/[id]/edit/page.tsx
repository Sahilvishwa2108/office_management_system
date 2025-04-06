"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2 as SpinnerIcon, ArrowLeft as ArrowLeftIcon } from "lucide-react";

// Define schema for task editing (same as creation schema)
const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in-progress", "review", "completed", "cancelled"]),
  dueDate: z.date().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Client {
  id: string;
  contactPerson: string;
  companyName?: string;
}

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // Improve the fetchClients function
  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/clients");
      
      // Handle different response formats
      if (response.data && response.data.clients && Array.isArray(response.data.clients)) {
        setClients(response.data.clients);
      } else if (Array.isArray(response.data)) {
        setClients(response.data);
      } else {
        console.error("Invalid client data format:", response.data);
        setClients([]);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
      // Optionally show an error message to the user
      toast.error("Failed to load clients");
    }
  };

  // Initialize form with empty values (will be populated once data is fetched)
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: null,
      assignedToId: null,
      clientId: null,
    },
  });

  // Load task data, users, and clients on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);
        
        // Fetch task data
        const taskResponse = await axios.get(`/api/tasks/${taskId}`);
        const taskData = taskResponse.data;
        
        // Fetch users (only staff who can be assigned tasks)
        const usersResponse = await axios.get('/api/users');
        setUsers(usersResponse.data.filter((user: User) => 
          ['BUSINESS_EXECUTIVE', 'BUSINESS_CONSULTANT', 'PARTNER'].includes(user.role)
        ));
        
        // Fetch clients
        await fetchClients();
        
        // Format the data for the form
        form.reset({
          title: taskData.title,
          description: taskData.description || "",
          priority: taskData.priority,
          status: taskData.status,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          assignedToId: taskData.assignedToId || null,
          clientId: taskData.clientId || null,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load task data');
        router.push('/dashboard/tasks');
      } finally {
        setIsFetching(false);
      }
    };
    
    if (taskId) {
      fetchData();
    }
  }, [taskId, form, router]);
  
  // Form submission handler
  const onSubmit = async (data: TaskFormValues) => {
    try {
      setIsLoading(true);
      
      // Format data as needed
      const taskData = {
        ...data,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
      };
      
      // Submit to API
      await axios.patch(`/api/tasks/${taskId}`, taskData);
      
      toast.success("Task updated successfully");
      
      // Redirect back to task details
      router.push(`/dashboard/tasks/${taskId}`);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="container max-w-3xl py-10 flex justify-center items-center">
        <div className="flex flex-col items-center gap-2">
          <SpinnerIcon className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading task data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
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
          <CardTitle>Edit Task</CardTitle>
          <CardDescription>
            Update task information and assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, concise title for the task
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed task description" 
                        className="min-h-32"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide detailed instructions or requirements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Priority Selection */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set the task's priority level
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status Selection */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set the task status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Due Date Picker */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <DatePicker 
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={field.onChange}
                    />
                    <FormDescription>
                      The deadline for task completion
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Assigned User Selection */}
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || undefined}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role.toLowerCase().replace('_', ' ')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Team member responsible for this task
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value || undefined}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No Client</SelectItem>
                        {Array.isArray(clients) && clients.length > 0 ? (
                          clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.contactPerson} {client.companyName ? `(${client.companyName})` : ''}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Associate this task with a specific client
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <CardFooter className="flex justify-between px-0">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}