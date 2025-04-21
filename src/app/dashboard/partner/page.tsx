"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  Activity,
  AlertTriangle,
  ArrowRight,
  Plus,
  ListTodo,
  Briefcase,
  Calendar,
  BarChart,
  UserPlus,
  CalendarClock,
  ExternalLink,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TaskProgress } from "@/components/dashboard/task-progress";
import { TaskSummary } from "@/components/dashboard/task-summary";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DashboardStatsSkeleton,
  DashboardContentSkeleton,
} from "@/components/loading/dashboard-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingBillingTasks } from "@/components/admin/pending-billing-tasks";
import { RecentNotificationsCard } from "@/components/dashboard/recent-notifications-card";
import { AssignTaskButton } from "@/components/tasks/assign-task-button";

// Helper function to check if a date is within the next N days
function isWithinNextDays(date: Date, days: number): boolean {
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + days);
  return date >= now && date <= futureDate;
}

// Helper function to calculate days remaining
function getDaysRemaining(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Task list skeleton component
const TaskListSkeleton = () => (
  <>
    <Card className="col-span-1 md:col-span-3 lg:col-span-1">
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  </>
);

interface PartnerDashboardData {
  stats: {
    totalStaff: number;
    activeTasks: number;
    pendingTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    staffUtilization: number;
  };
  staff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    activeTasks: number;
    completedTasks: number;
    status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    // Replace assignedTo with assignees
    assignees?: Array<{
      user: {
        id: string;
        name: string;
        avatar?: string;
      }
    }>;
    progress?: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    user: {
      name: string;
      role: string;
      avatar?: string;
    };
    action: string;
    target: string;
    timestamp: string;
  }>;
}

function PartnerDashboardContent() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const router = useRouter();

  // Add this function inside the component where state setters are accessible
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch dashboard data from API
      const response = await fetch("/api/partner/dashboard");

      if (!response.ok) {
        // Special handling for 403 Forbidden errors
        if (response.status === 403) {
          console.error("Access forbidden - user may have changed roles or session expired");
          toast.error("Your session has expired or you no longer have access to this resource. Please login again.");
          router.push('/login');
          return;
        }
        throw new Error(`Error fetching dashboard data: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setStatsLoaded(true);
    } catch (err) {
      console.error("Failed to fetch partner dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Check if the partner has billing approval permissions
  const canApproveBilling = session?.user?.role === "PARTNER" && (session.user as any)?.canApproveBilling;
  console.log("Can approve billing:", canApproveBilling);

  // Default empty data if still loading
  const stats = dashboardData?.stats || {
    totalStaff: 0,
    activeTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    taskCompletionRate: 0,
    staffUtilization: 0,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/partner/users/create">
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <>
              <DashboardContentSkeleton />
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-2 lg:col-span-4 h-[350px] overflow-hidden border-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <Plus className="h-5 w-5 mr-2 text-primary" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Frequently used operations</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-auto max-h-[270px] custom-scrollbar">
                    <Link href="/dashboard/partner/users/create" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4 group hover:shadow-md hover:border-primary/30 transition-all bg-gradient-to-br from-transparent to-blue-50/50 dark:from-transparent dark:to-blue-950/20"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-blue-700 dark:text-blue-400">Add New Staff</span>
                          <span className="text-xs text-muted-foreground">
                            Create a new team member account
                          </span>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <UserPlus className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        </div>
                      </Button>
                    </Link>
                    <Link href="/dashboard/tasks/create" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4 group hover:shadow-md hover:border-primary/30 transition-all bg-gradient-to-br from-transparent to-green-50/50 dark:from-transparent dark:to-green-950/20"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-green-700 dark:text-green-400">Create Task</span>
                          <span className="text-xs text-muted-foreground">
                            Assign a new task to the team
                          </span>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <ListTodo className="h-5 w-5 text-green-500 dark:text-green-400" />
                        </div>
                      </Button>
                    </Link>
                    <Link href="/dashboard/clients" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4 group hover:shadow-md hover:border-primary/30 transition-all bg-gradient-to-br from-transparent to-purple-50/50 dark:from-transparent dark:to-purple-950/20"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-purple-700 dark:text-purple-400">Client Directory</span>
                          <span className="text-xs text-muted-foreground">
                            Access all client information
                          </span>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <Briefcase className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                        </div>
                      </Button>
                    </Link>
                    <Link href="/dashboard/partner/users" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4 group hover:shadow-md hover:border-primary/30 transition-all bg-gradient-to-br from-transparent to-amber-50/50 dark:from-transparent dark:to-amber-950/20"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-amber-700 dark:text-amber-400">View Team</span>
                          <span className="text-xs text-muted-foreground">
                            Manage your team members
                          </span>
                        </div>
                        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-2 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <Users className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                        </div>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <div className="col-span-2 lg:col-span-3 h-full max-h-[350px]">
                  <RecentNotificationsCard className="h-full" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* First Column - Priority Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle>Priority Tasks</CardTitle>
                    <CardDescription>
                      Tasks requiring immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-12 bg-muted rounded-md"></div>
                          </div>
                        ))}
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground">{error}</p>
                      </div>
                    ) : dashboardData?.tasks?.filter(
                        (t) => t.priority === "high"
                      ).length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <CheckCircle className="h-10 w-10 text-green-500 mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                          No high priority tasks
                        </p>
                      </div>
                    ) : (
                      dashboardData?.tasks
                        ?.filter((task) => task.priority === "high")
                        .slice(0, 3)
                        .map((task) => (
                          <Link
                            key={task.id}
                            href={`/dashboard/tasks/${task.id}`}
                          >
                            <div className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium truncate">
                                    {task.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {task.assignees && task.assignees.length > 0 
                                      ? task.assignees[0].user.name 
                                      : "Unassigned"}
                                  </p>
                                </div>
                                <div
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    task.status === "completed"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                      : task.status === "in_progress"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                      : task.status === "review"
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                                  }`}
                                >
                                  {task.status}
                                </div>
                              </div>
                              {task.dueDate && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  Due{" "}
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </Link>
                        ))
                    )}
                    <Link href="/dashboard/tasks?priority=high">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        View All High Priority Tasks
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                {/* Upcoming Deadlines */}
                <Card className="h-[350px] flex flex-col overflow-hidden">
                  <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50">
                    <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                      <CalendarClock className="h-5 w-5 mr-2 text-rose-600 dark:text-rose-400" />
                      Upcoming Deadlines
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      Tasks due in the next 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pt-4 overflow-hidden flex flex-col">
                    {!loading && !error && dashboardData?.tasks ? (
                      <div className="h-full max-h-[260px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {dashboardData.tasks.filter(task => 
                          task.dueDate && isWithinNextDays(new Date(task.dueDate), 7) && 
                          task.status !== 'completed'
                        ).length > 0 ? (
                          dashboardData.tasks
                            .filter(task => 
                              task.dueDate && isWithinNextDays(new Date(task.dueDate), 7) && 
                              task.status !== 'completed'
                            )
                            .sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime())
                            .map((task) => {
                              // Determine priority styling - convert to uppercase for consistency
                              const priorityKey = task.priority.toUpperCase();
                              const priorityStyles = {
                                'HIGH': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/50',
                                'MEDIUM': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50',
                                'LOW': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50',
                              };
                              
                              // Calculate days remaining
                              const daysRemaining = task.dueDate 
                                ? getDaysRemaining(new Date(task.dueDate))
                                : null;
                              
                              return (
                                <div
                                  key={task.id}
                                  className="p-3 rounded-md bg-white dark:bg-gray-950/50 border border-transparent hover:border-rose-100 dark:hover:border-rose-950/70 hover:shadow-sm transition-all group"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
                                      {task.title}
                                    </span>
                                    <Badge variant="outline" className={priorityStyles[priorityKey as keyof typeof priorityStyles]}>
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex justify-between items-center mt-3">
                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span>
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        }) : 'No due date'}
                                      </span>
                                    </div>
                                    
                                    {daysRemaining !== null && (
                                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        daysRemaining <= 1 
                                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' 
                                          : daysRemaining <= 3
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                      }`}>
                                        {daysRemaining === 0 
                                          ? 'Due today' 
                                          : daysRemaining === 1 
                                            ? 'Due tomorrow' 
                                            : `${daysRemaining} days left`}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      {task.assignees && task.assignees.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage src={task.assignees[0].user.avatar || 
                                                `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignees[0].user.name}`} />
                                            <AvatarFallback className="text-[10px]">
                                              {task.assignees[0].user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs text-slate-600 dark:text-slate-400">{task.assignees[0].user.name}</span>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">Unassigned</span>
                                      )}
                                    </div>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                      asChild
                                    >
                                      <Link href={`/dashboard/tasks/${task.id}`}>
                                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                        <span className="text-xs">View</span>
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 px-4 text-center h-full bg-slate-50/50 dark:bg-slate-900/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/50">
                            <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-full mb-3">
                              <CheckCircle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              No upcoming deadlines
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
                              All tasks are either completed or scheduled beyond the next 7 days
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-[70px] w-full" />
                        <Skeleton className="h-[70px] w-full" />
                        <Skeleton className="h-[70px] w-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="h-[350px] flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
                      Staff Distribution
                    </CardTitle>
                    <CardDescription>
                      Available staff for task assignment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pt-4 overflow-hidden flex flex-col">
                    {!loading && !error && dashboardData?.staff ? (
                      <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">Available Staff</h3>
                          {dashboardData.staff.filter(s => s.activeTasks === 0).length > 0 && (
                            <Badge variant="outline">
                              {dashboardData.staff.filter(s => s.activeTasks === 0).length} available
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          {/* Scrollable container */}
                          <div className="h-full max-h-[230px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                            {dashboardData.staff.filter(s => s.activeTasks === 0).length > 0 ? (
                              dashboardData.staff.filter(s => s.activeTasks === 0).map((user) => (
                                <div
                                  key={user.id}
                                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-all group"
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={
                                          user.avatar ||
                                          `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                                        }
                                      />
                                      <AvatarFallback>
                                        {user.name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="text-sm font-medium">
                                        {user.name}
                                      </span>
                                      <p className="text-xs text-muted-foreground">
                                        {user.role.charAt(0).toUpperCase() +
                                          user.role.slice(1).toLowerCase().replace(/_/g, " ")}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Replace this button with AssignTaskButton */}
                                  <AssignTaskButton
                                    userId={user.id}
                                    userName={user.name}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-70 group-hover:opacity-100"
                                    onAssigned={() => {
                                      // Refresh dashboard data
                                      fetchDashboardData();
                                    }}
                                  />
                                </div>
                              ))
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8 px-4 text-center h-full">
                                <Users className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                                <p className="text-sm font-medium">
                                  All staff members are assigned
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Everyone on the team currently has active tasks
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-[230px] w-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {canApproveBilling && (
                <div className="grid gap-4 md:grid-cols-1">
                  <PendingBillingTasks />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Task Management</h2>
              <p className="text-sm text-muted-foreground">
                Overview and management of all team tasks
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/tasks?filter=overdue")}
              >
                {stats.pendingTasks > 0 && (
                  <span className="h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center mr-2">
                    {stats.pendingTasks}
                  </span>
                )}
                Overdue
              </Button>

              <Button onClick={() => router.push("/dashboard/tasks/create")}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loading ? (
              <TaskListSkeleton />
            ) : (
              <>
                <TaskSummary
                  title="High Priority"
                  description="Tasks requiring immediate attention"
                  tasks={(
                    dashboardData?.tasks?.filter(
                      (t) => t.priority === "high"
                    ) || []
                  ).map((task) => ({
                    ...task,
                    dueDate: task.dueDate || null,
                  }))}
                  limit={5}
                  showAssignee={true}
                  onTaskClick={(taskId) =>
                    router.push(`/dashboard/tasks/${taskId}`)
                  }
                />
                <TaskSummary
                  title="In Progress"
                  description="Tasks currently being worked on"
                  tasks={(
                    dashboardData?.tasks?.filter(
                      (t) => t.status === "in_progress"
                    ) || []
                  ).map((task) => ({
                    ...task,
                    dueDate: task.dueDate || null,
                  }))}
                  limit={5}
                  showAssignee={true}
                  onTaskClick={(taskId) =>
                    router.push(`/dashboard/tasks/${taskId}`)
                  }
                />
                <TaskSummary
                  title="Recently Completed"
                  description="Tasks completed in the last 7 days"
                  tasks={(
                    dashboardData?.tasks?.filter(
                      (t) => t.status === "completed"
                    ) || []
                  ).map((task) => ({
                    ...task,
                    dueDate: task.dueDate || null,
                  }))}
                  limit={5}
                  showAssignee={true}
                  onTaskClick={(taskId) =>
                    router.push(`/dashboard/tasks/${taskId}`)
                  }
                />
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button asChild variant="outline">
              <Link href="/dashboard/tasks">
                View All Tasks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-4">
          {loading ? (
            <>
              <DashboardStatsSkeleton />
              <DashboardContentSkeleton />
            </>
          ) : (
            <>
              {/* Metrics section - moved from overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Staff"
                  value={loading ? "..." : stats.totalStaff.toString()}
                  description="Active staff members"
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <StatsCard
                  title="Active Tasks"
                  value={loading ? "..." : stats.activeTasks.toString()}
                  description={`${stats.pendingTasks} pending`}
                  icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                />
                <StatsCard
                  title="Tasks Completed"
                  value={loading ? "..." : stats.completedTasks.toString()}
                  description="Overall completion rate"
                  icon={
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  }
                />
                <StatsCard
                  title="Completion Rate"
                  value={loading ? "..." : `${stats.taskCompletionRate}%`}
                  description="Based on assigned tasks"
                  icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Task Distribution Card */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Task Distribution</CardTitle>
                    <CardDescription>
                      Overview of task allocation and progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        <div className="h-4 w-2/3 bg-muted rounded animate-pulse"></div>
                        <div className="h-8 w-full bg-muted rounded animate-pulse"></div>
                        <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                      </div>
                    ) : error ? (
                      <div className="text-center text-muted-foreground">
                        Failed to load task distribution
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <TaskProgress
                          items={[
                            {
                              label: "Completed",
                              value: stats.completedTasks,
                              color: "bg-green-500",
                            },
                            {
                              label: "In Progress",
                              value: stats.activeTasks - stats.pendingTasks,
                              color: "bg-blue-500",
                            },
                            {
                              label: "Pending",
                              value: stats.pendingTasks,
                              color: "bg-amber-500",
                            },
                          ]}
                          size="lg"
                          showLabels={true}
                          showPercentages={true}
                        />

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <Button
                            onClick={() =>
                              router.push("/dashboard/tasks/create")
                            }
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Task
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push("/dashboard/tasks/assign")
                            }
                            className="w-full"
                          >
                            Assign Tasks
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team Performance Card - moved from overview */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                    <CardDescription>
                      Staff productivity metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!loading && !error && dashboardData?.staff && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Staff with tasks
                            </p>
                            <p className="text-2xl font-bold">
                              {
                                dashboardData.staff.filter(
                                  (s) => s.activeTasks > 0
                                ).length
                              }
                              /{dashboardData.staff.length}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Average completion
                            </p>
                            <p className="text-2xl font-bold">
                              {stats.taskCompletionRate}%
                            </p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">
                            Top Performers
                          </h3>
                          <div className="space-y-2">
                            {dashboardData.staff
                              .sort(
                                (a, b) => b.completedTasks - a.completedTasks
                              )
                              .slice(0, 3)
                              .map((staff) => (
                                <div
                                  key={staff.id}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage
                                        src={
                                          staff.avatar ||
                                          `https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`
                                        }
                                      />
                                      <AvatarFallback>
                                        {staff.name
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">
                                      {staff.name}
                                    </span>
                                  </div>
                                  <span className="text-sm">
                                    {staff.completedTasks} completed
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Staff Productivity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Staff Productivity</CardTitle>
                  <CardDescription>
                    Task completion metrics across team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-64 w-full bg-muted animate-pulse rounded-md"></div>
                  ) : !dashboardData?.staff ||
                    dashboardData.staff.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No staff data available
                    </div>
                  ) : (
                    <div className="h-64">
                      <div className="flex flex-col space-y-2">
                        {dashboardData.staff
                          .sort(
                            (a, b) =>
                              b.completedTasks +
                              b.activeTasks - 
                              (a.completedTasks + a.activeTasks)
                          )
                          .slice(0, 8)
                          .map((staff) => {
                            const totalTasks =
                              staff.completedTasks + staff.activeTasks;
                            const completedPercentage =
                              totalTasks > 0
                                ? (staff.completedTasks / totalTasks) * 100
                                : 0;

                            return (
                              <div key={staff.id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">
                                    {staff.name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {staff.completedTasks}/{totalTasks} tasks
                                  </span>
                                </div>
                                <div className="h-2.5 w-full bg-gray-200 rounded-full dark:bg-gray-700">
                                  <div
                                    className="h-2.5 bg-green-500 rounded-full dark:bg-green-600"
                                    style={{ width: `${completedPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PartnerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </Card>
            ))}
          </div>

          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      }
    >
      <PartnerDashboardContent />
    </Suspense>
  );
}
