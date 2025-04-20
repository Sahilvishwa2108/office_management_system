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
  FormMessage
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
import "react-day-picker/style.css";
import "@/styles/day-picker.css"; // Import after the default styles
import { TaskPageLayout } from "@/components/layouts/task-page-layout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { SearchableMultiSelect } from "@/components/tasks/searchable-multi-select";
import { SearchableSelect } from "@/components/tasks/searchable-select";
import { DayPicker } from "react-day-picker";

// Update the task form schema to include assignedToIds
const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in_progress", "review", "completed", "cancelled"]),
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
  const [fetchError, setFetchError] = useState<string | null>(null);

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
        setFetchError(null);

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
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setFetchError(`Failed to load task data: ${errorMessage}`);
        toast.error("Failed to load task data");
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to update task: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <TaskPageLayout title="Edit Task" backHref={`/dashboard/tasks/${taskId}`} maxWidth="max-w-3xl">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading task details...</p>
          </div>
        </div>
      </TaskPageLayout>
    );
  }

  if (fetchError) {
    return (
      <TaskPageLayout title="Error" backHref={`/dashboard/tasks/${taskId}`} maxWidth="max-w-3xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h3 className="text-lg font-medium">Failed to load task</h3>
            <p className="text-muted-foreground text-center">{fetchError}</p>
            <Button 
              onClick={() => router.push(`/dashboard/tasks/${taskId}`)}
              className="mt-2"
            >
              Back to Task Details
            </Button>
          </CardContent>
        </Card>
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
                          <SelectItem value="low" className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span>Low</span>
                          </SelectItem>
                          <SelectItem value="medium" className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                            <span>Medium</span>
                          </SelectItem>
                          <SelectItem value="high" className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            <span>High</span>
                          </SelectItem>
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
                          <SelectItem value="pending" className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                            <span>Pending</span>
                          </SelectItem>
                          <SelectItem value="in_progress" className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            <span>In Progress</span>
                          </SelectItem>
                          <SelectItem value="review" className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                            <span>Review</span>
                          </SelectItem>
                          <SelectItem value="completed" className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span>Completed</span>
                          </SelectItem>
                          <SelectItem value="cancelled" className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            <span>Cancelled</span>
</SelectItem>
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
                      <FormControl>
                        <SearchableMultiSelect
                          options={users.map(user => ({
                            value: user.id,
                            label: user.name,
                            role: user.role,
                            email: user.email
                          }))}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select team members"
                          showSelectedOptions={false}
                        />
                      </FormControl>
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
                      <FormControl>
                        <SearchableSelect
                          options={[
                            { value: "null", label: "No Client" },
                            ...clients.map(client => ({
                              value: client.id,
                              label: client.companyName 
                                ? `${client.companyName} (${client.contactPerson})` 
                                : client.contactPerson
                            }))
                          ]}
                          selected={field.value || "null"}
                          onChange={field.onChange}
                          placeholder="Search for a client"
                          className="transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
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
                        <DayPicker
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          captionLayout="dropdown-months"
                          showOutsideDays
                          footer={field.value ? `Selected: ${format(field.value, 'PPP')}` : "Please select a date"}
                          className="p-3"
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