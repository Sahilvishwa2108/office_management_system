"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "@/components/ui/card";

// Define schema for task creation
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

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form with defaults
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: null,
      assignedToId: null,
      clientId: clientId || null,
    },
  });

  // Load users and clients on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users (only staff who can be assigned tasks)
        const usersResponse = await axios.get('/api/users');
        setUsers(usersResponse.data.filter((user: User) => 
          ['BUSINESS_EXECUTIVE', 'BUSINESS_CONSULTANT', 'PARTNER'].includes(user.role)
        ));
        
        // Fetch clients
        await fetchClients();
        
        // If clientId is provided, set it in the form
        if (clientId) {
          form.setValue('clientId', clientId);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load required data');
      }
    };
    
    fetchData();
  }, [clientId, form]);

  // When fetching clients, ensure proper error handling
  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/clients");
      
      // More robust handling of the response data
      if (response.data && response.data.clients && Array.isArray(response.data.clients)) {
        // Standard expected format - object with clients array
        setClients(response.data.clients);
      } else if (Array.isArray(response.data)) {
        // Direct array response
        setClients(response.data);
      } else {
        // Unexpected format - set empty array and log error
        setClients([]);
        console.warn("Clients data structure unexpected:", response.data);
        
        // Optional: Show user-friendly message
        toast.warning("Could not load client data properly");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
      toast.error("Failed to load clients");
    }
  };
  
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
      const response = await axios.post("/api/tasks", taskData);
      
      toast.success("Task created successfully");
      
      // Redirect to appropriate page
      if (data.clientId) {
        router.push(`/dashboard/clients/${data.clientId}`);
      } else {
        router.push("/dashboard/tasks");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
          <CardDescription>
            Create a new task and assign it to a team member
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
                      Set the initial task status
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}