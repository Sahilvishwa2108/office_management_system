"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  FormDescription,
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
import { CalendarIcon, Loader2, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Update the task form schema
const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in-progress", "review", "completed", "cancelled"]),
  dueDate: z.date().optional().nullable(),
  // Change to array for multiple assignees
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

// Create a multi-select component for assignees
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
              {/* Custom checkbox element */}
              <div className="mr-2 h-4 w-4 rounded-[4px] border flex items-center justify-center">
                {selected.includes(option.value) && (
                  <svg 
                    width="10" 
                    height="10" 
                    viewBox="0 0 10 10" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M8.5 2.5L3.5 7.5L1.5 5.5" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form with updated defaults
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: null,
      assignedToIds: [], // Initialize as empty array
      assignedToId: null, // Keep for compatibility
      clientId: clientId || null,
    },
  });

  // Load users and clients on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users (only staff who can be assigned tasks)
        const usersResponse = await axios.get<User[]>('/api/users');
        setUsers(usersResponse.data.filter((user) => 
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

  // Fetch clients with proper error handling
  const fetchClients = async () => {
    try {
      const response = await axios.get<{ clients?: Client[] }>("/api/clients");
      
      // More robust handling of the response data
      if (response.data && response.data.clients && Array.isArray(response.data.clients)) {
        setClients(response.data.clients);
      } else if (Array.isArray(response.data)) {
        setClients(response.data);
      } else {
        setClients([]);
        console.warn("Clients data structure unexpected:", response.data);
        toast.warning("Could not load client data properly");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
      toast.error("Failed to load clients");
    }
  };
  
  // Updated form submission handler
  const onSubmit = async (data: TaskFormValues) => {
    try {
      setIsLoading(true);
      
      // Set primary assignee from assignedToIds if available
      if (data.assignedToIds && data.assignedToIds.length > 0 && !data.assignedToId) {
        data.assignedToId = data.assignedToIds[0];
      }
      
      // Format data as needed
      const taskData = {
        ...data,
        // Convert empty arrays to undefined to avoid validation issues
        assignedToIds: data.assignedToIds && data.assignedToIds.length > 0 
          ? data.assignedToIds 
          : undefined,
        // Keep for backward compatibility
        assignedToId: data.assignedToId === "null" ? null : data.assignedToId,
        clientId: data.clientId === "null" ? null : data.clientId,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
      };
      
      // Submit to API
      await axios.post("/api/tasks", taskData);
      
      toast.success("Task created successfully");
      
      // Redirect to appropriate page
      if (data.clientId && data.clientId !== "null") {
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
    <TaskPageLayout title="Create New Task" backHref="/dashboard/tasks" maxWidth="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>
            Create a new task and assign it to team members
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
                              variant={"outline"}
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
              </div>

              {/* NEW: Multi-select assignees field */}
              <FormField
                control={form.control}
                name="assignedToIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to team members</FormLabel>
                    <FormControl>
                      <MultiSelect
                        selected={field.value || []}
                        options={users.map(user => ({
                          value: user.id,
                          label: `${user.name} (${user.role.replace(/_/g, " ")})`
                        }))}
                        onChange={(selected) => field.onChange(selected)}
                        placeholder="Select team members"
                      />
                    </FormControl>
                    <FormDescription>
                      Assign this task to one or more team members
                    </FormDescription>
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

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Task"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TaskPageLayout>
  );
}