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
} from "lucide-react";
import { StaffCard } from "@/components/dashboard/staff-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TaskProgress } from "@/components/dashboard/task-progress";
import { TaskSummary } from "@/components/dashboard/task-summary";
import { useRouter } from "next/navigation";
import {
  DashboardStatsSkeleton,
  DashboardContentSkeleton,
} from "@/components/loading/dashboard-skeleton";
import { UserCardSkeleton } from "@/components/loading/user-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { PendingBillingTasks } from "@/components/admin/pending-billing-tasks";
import { RecentNotificationsCard } from "@/components/dashboard/recent-notifications-card";

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
    image?: string;
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
    assignedTo?: {
      id: string;
      name: string;
      image?: string;
    };
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
  const [dashboardData, setDashboardData] =
    useState<PartnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Make API call to fetch dashboard data
        const response = await fetch("/api/partner/dashboard");

        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.status}`);
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch partner dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Check if the partner has billing approval permissions
  const canApproveBilling = session?.user?.role === "PARTNER" && session.user.canApproveBilling;
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
              <DashboardStatsSkeleton />
              <DashboardContentSkeleton />
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-2 lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Frequently used operations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      asChild
                      variant="outline"
                      className="h-20 justify-start p-4"
                    >
                      <Link href="/dashboard/partner/users/create">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Add New Staff</span>
                          <span className="text-xs text-muted-foreground">
                            Create a new team member account
                          </span>
                        </div>
                        <Plus className="ml-auto h-5 w-5 text-primary" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-20 justify-start p-4"
                    >
                      <Link href="/dashboard/tasks/create">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Create Task</span>
                          <span className="text-xs text-muted-foreground">
                            Assign a new task to the team
                          </span>
                        </div>
                        <ListTodo className="ml-auto h-5 w-5 text-primary" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-20 justify-start p-4"
                    >
                      <Link href="/dashboard/clients">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Client Directory</span>
                          <span className="text-xs text-muted-foreground">
                            Access all client information
                          </span>
                        </div>
                        <Briefcase className="ml-auto h-5 w-5 text-primary" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-20 justify-start p-4"
                    >
                      <Link href="/dashboard/partner/users">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">View Team</span>
                          <span className="text-xs text-muted-foreground">
                            Manage your team members
                          </span>
                        </div>
                        <Users className="ml-auto h-5 w-5 text-primary" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <div className="col-span-2 lg:col-span-3 h-full">
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
                                    {task.assignedTo?.name || "Unassigned"}
                                  </p>
                                </div>
                                <div
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    task.status === "completed"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                      : task.status === "in-progress"
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
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                    <CardDescription>
                      Tasks due within the next 7 days
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
                    ) : (
                      <>
                        {dashboardData?.tasks
                          ?.filter((t) => {
                            if (!t.dueDate) return false;
                            const dueDate = new Date(t.dueDate);
                            const today = new Date();
                            const weekFromNow = new Date();
                            weekFromNow.setDate(today.getDate() + 7);
                            return (
                              dueDate > today &&
                              dueDate <= weekFromNow &&
                              t.status !== "completed"
                            );
                          })
                          .slice(0, 3)
                          .map((task) => (
                            <Link
                              key={task.id}
                              href={`/dashboard/tasks/${task.id}`}
                            >
                              <div className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/50 border rounded-md p-3 hover:bg-blue-100/80 dark:hover:bg-blue-900/30 transition-colors">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium truncate">
                                      {task.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {task.assignedTo?.name || "Unassigned"}
                                    </p>
                                  </div>
                                  <div
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      task.priority === "high"
                                        ? "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                                        : task.priority === "medium"
                                        ? "bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                                        : "bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                    }`}
                                  >
                                    {task.priority}
                                  </div>
                                </div>
                                {task.dueDate && (
                                  <div className="text-xs text-blue-700 dark:text-blue-400 mt-2 flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Due{" "}
                                    {new Date(
                                      task.dueDate
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        {dashboardData?.tasks?.filter((t) => {
                          if (!t.dueDate) return false;
                          const dueDate = new Date(t.dueDate);
                          const today = new Date();
                          const weekFromNow = new Date();
                          weekFromNow.setDate(today.getDate() + 7);
                          return (
                            dueDate > today &&
                            dueDate <= weekFromNow &&
                            t.status !== "completed"
                          );
                        }).length === 0 && (
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <Calendar className="h-10 w-10 text-blue-500 mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              No upcoming deadlines for the next 7 days
                            </p>
                          </div>
                        )}
                        <Link href="/dashboard/tasks?filter=upcoming">
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            View All Upcoming Deadlines
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Distribution</CardTitle>
                    <CardDescription>Task assignments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!loading && !error && dashboardData?.staff && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Staff with Tasks
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                              {
                                dashboardData.staff.filter(
                                  (s) => s.activeTasks > 0
                                ).length
                              }
                              /{dashboardData.staff.length}
                            </Badge>
                          </div>
                          <Progress
                            value={
                              (dashboardData.staff.filter(
                                (s) => s.activeTasks > 0
                              ).length /
                                dashboardData.staff.length) *
                              100
                            }
                            className="h-2"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Staff without Tasks
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            >
                              {
                                dashboardData.staff.filter(
                                  (s) => s.activeTasks === 0
                                ).length
                              }
                              /{dashboardData.staff.length}
                            </Badge>
                          </div>
                          <div className="max-h-[180px] overflow-y-auto pr-2 space-y-2 mt-2">
                            {dashboardData.staff
                              .filter((s) => s.activeTasks === 0)
                              .map((staff) => (
                                <Link
                                  key={staff.id}
                                  href={`/dashboard/partner/users/${staff.id}`}
                                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage
                                        src={
                                          staff.image ||
                                          `https://api.dicebear.com/7.x/initials/svg?seed=${staff.name}`
                                        }
                                      />
                                      <AvatarFallback>
                                        {staff.name
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">
                                      {staff.name}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                  >
                                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </Link>
                              ))}
                            {dashboardData.staff.filter(
                              (s) => s.activeTasks === 0
                            ).length === 0 && (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                All staff members have tasks assigned
                              </div>
                            )}
                          </div>
                        </div>
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
                      (t) => t.status === "in-progress"
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
                                          staff.image ||
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
