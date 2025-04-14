"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { TaskPageLayout } from "@/components/layouts/task-page-layout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronDown, Loader2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Update the task form schema to include assignedToIds
const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in-progress", "review", "completed", "cancelled"]),
  dueDate: z.date().optional().nullable(),
  // Add support for array of assignees
  assignedToIds: z.array(z.string()).optional().default([]),
  // Keep for backward compatibility
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

  // Initialize form with empty values (will be populated once data is fetched)
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: null,
      assignedToIds: [], // Initialize as empty array
      assignedToId: null,
      clientId: null,
    },
  });

  // Fetch clients with proper error handling
  const fetchClients = async () => {
    try {
      const response = await axios.get<{ clients?: Client[] }>("/api/clients");
      
      if (Array.isArray(response.data)) {
        setClients(response.data);
      } else if (response.data.clients && Array.isArray(response.data.clients)) {
        setClients(response.data.clients);
      } else {
        setClients([]);
        toast.warning("Could not load client data properly");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
      toast.error("Failed to load clients");
    }
  };

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
        setUsers((usersResponse.data as User[]).filter((user: User) =>
          ['BUSINESS_EXECUTIVE', 'BUSINESS_CONSULTANT', 'PARTNER'].includes(user.role)
        ));
        
        // Fetch clients
        await fetchClients();
        
        // Create array of assignee IDs from the task data
        interface Assignee {
          userId: string;
        }

        const assigneeIds: string[] = taskData.assignees?.map((a: Assignee) => a.userId) || [];
        // Fallback to legacy assignedToId if assignees is empty
        if (assigneeIds.length === 0 && taskData.assignedToId) {
          assigneeIds.push(taskData.assignedToId);
        }
        
        // Set form values
        form.reset({
          title: taskData.title,
          description: taskData.description || "",
          priority: taskData.priority,
          status: taskData.status,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          assignedToIds: assigneeIds,
          assignedToId: taskData.assignedToId,
          clientId: taskData.clientId,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load task data");
        router.push("/dashboard/tasks");
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
        // Include the array of assignee IDs
        assignedToIds: data.assignedToIds && data.assignedToIds.length > 0 
          ? data.assignedToIds 
          : undefined,
        // Keep for backward compatibility
        assignedToId: data.assignedToId === "null" ? null : data.assignedToId,
        clientId: data.clientId === "null" ? null : data.clientId,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
      };

      // Submit to API
      await axios.patch(`/api/tasks/${taskId}`, taskData);
      toast.success("Task updated successfully");
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
      <TaskPageLayout title="Edit Task" backHref={`/dashboard/tasks/${taskId}`}>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TaskPageLayout>
    );
  }

  return (
    <TaskPageLayout title="Edit Task" backHref={`/dashboard/tasks/${taskId}`} maxWidth="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Task Details</CardTitle>
          <CardDescription>
            Make changes to the task information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="assignedToIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <div className="flex flex-wrap gap-1 p-2 border rounded-md">
                            {field.value?.length > 0 ? (
                              field.value.map(assigneeId => {
                                const user = users.find(u => u.id === assigneeId);
                                return user ? (
                                  <Badge key={assigneeId} variant="secondary" className="flex items-center gap-1">
                                    {user.name}
                                    <X 
                                      className="h-3 w-3 cursor-pointer" 
                                      onClick={() => {
                                        field.onChange(field.value.filter(id => id !== assigneeId));
                                      }}
                                    />
                                  </Badge>
                                ) : null;
                              })
                            ) : (
                              <div className="text-muted-foreground">No assignees selected</div>
                            )}
                          </div>
                        </FormControl>
                        <Select 
                          onValueChange={(value) => {
                            if (value !== "null" && !field.value.includes(value)) {
                              field.onChange([...field.value, value]);
                            }
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Add assignee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">Unassigned</SelectItem>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.role.replace(/_/g, " ")})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client (Optional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || "null"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">No Client</SelectItem>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.companyName || client.contactPerson}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>No due date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                        <div className="p-3 border-t border-border">
                          <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => field.onChange(null)}
                          >
                            Clear
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter task description"
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-end gap-3 px-0 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/tasks/${taskId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Task"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TaskPageLayout>
  );
}