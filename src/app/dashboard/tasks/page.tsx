"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PlusIcon, FilterIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { canCreateTask } from "@/lib/permissions";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  client: {
    id: string;
    contactPerson: string;
  } | null;
}

export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const url = new URL("/api/tasks", window.location.origin);
        
        if (statusFilter && statusFilter !== "all") {
          url.searchParams.append("status", statusFilter);
        }
        
        const response = await axios.get(url.toString());
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [statusFilter]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-500 hover:bg-gray-600";
      case "in-progress": return "bg-blue-500 hover:bg-blue-600";
      case "review": return "bg-yellow-500 hover:bg-yellow-600";
      case "completed": return "bg-green-500 hover:bg-green-600";
      case "cancelled": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-500 hover:bg-green-600";
      case "medium": return "bg-yellow-500 hover:bg-yellow-600";
      case "high": return "bg-red-500 hover:bg-red-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  // Filter tasks by search query
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        {canCreateTask(session) && (
          <Button 
            onClick={() => router.push("/dashboard/tasks/create")}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Tasks</CardTitle>
          <CardDescription>
            Filter and search through all tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Tasks</label>
              <Input
                placeholder="Search by title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem> {/* Changed from empty string to "all" */}
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>
            Viewing {filteredTasks.length} tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl">Loading tasks...</div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-xl">No tasks found</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map(task => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.dueDate 
                          ? format(new Date(task.dueDate), "PP")
                          : "No due date"}
                      </TableCell>
                      <TableCell>
                        {task.assignedTo ? task.assignedTo.name : "Unassigned"}
                      </TableCell>
                      <TableCell>
                        {task.client ? task.client.contactPerson : "None"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}