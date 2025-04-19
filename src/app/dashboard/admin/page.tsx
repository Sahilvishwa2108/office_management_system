"use client";

import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Users,
  CheckCircle,
  Activity,
  AlertTriangle,
  ArrowRight,
  Plus,
  Calendar,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { RecentNotificationsCard } from "@/components/dashboard/recent-notifications-card";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { TaskProgress } from "@/components/dashboard/task-progress";
import { PendingBillingTasks } from "@/components/admin/pending-billing-tasks";
import {
  DashboardStatsSkeleton,
  DashboardContentSkeleton,
} from "@/components/loading/dashboard-skeleton";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo?: {
    name: string;
  } | null;
}

interface DashboardData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalClients: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasksCount: number;
    newUsersThisMonth: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    activeTasks: number;
    completedTasks: number;
  }>;
  staff: Array<{
    id: string;
    name: string;
    image?: string;
    activeTasks: number;
    role: string;
  }>;
  staffWithoutTasks: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: string;
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
  tasks: Task[];
}

// Main dashboard component
export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch dashboard data from API
        const response = await fetch("/api/admin/dashboard");

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data);
        setStatsLoaded(true);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Default stats data
  const stats = dashboardData?.stats || {
    totalUsers: 0,
    activeUsers: 0,
    totalClients: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasksCount: 0,
    newUsersThisMonth: 0,
  };

  // Calculate percentages for analytics display
  const activeUserPercentage =
    stats.totalUsers > 0
      ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
      : 0;

  const taskCompletionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  if (loading && !dashboardData) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <DashboardStatsSkeleton />
            <DashboardContentSkeleton />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/admin/users/create">
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {loading && !dashboardData?.tasks ? (
            <>
              <DashboardContentSkeleton />
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-2 lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/dashboard/admin/users/create">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Create User</span>
                          <span className="text-xs text-muted-foreground">
                            Add new team members
                          </span>
                        </div>
                        <UserPlus className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/admin/clients/create">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Create Client</span>
                          <span className="text-xs text-muted-foreground">
                            Add new client accounts
                          </span>
                        </div>
                        <Briefcase className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/tasks/create">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Create Task</span>
                          <span className="text-xs text-muted-foreground">
                            Assign new work items
                          </span>
                        </div>
                        <Plus className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/admin/clients/guest/create">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            Create Guest Client
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Add temporary accounts
                          </span>
                        </div>
                        <Plus className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <div className="col-span-2 lg:col-span-3 h-full">
                  <RecentNotificationsCard className="h-full" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {/* Staff Utilization */}
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Distribution</CardTitle>
                    <CardDescription>
                      Available staff for task assignment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!loading && !error && dashboardData?.staffWithoutTasks ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Staff without Tasks
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            >
                              {dashboardData.staffWithoutTasks.length}/
                              {dashboardData.stats.totalUsers}
                            </Badge>
                          </div>

                          {/* Scrollable container for staff list */}
                          {/* Scrollable container for staff list */}
                          <div className="max-h-[180px] overflow-y-auto space-y-2 mt-2 border rounded-md p-1">
                            {dashboardData.staffWithoutTasks.length > 0 ? (
                              dashboardData.staffWithoutTasks.map((user) => (
                                <div
                                  key={user.id}
                                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage
                                        src={
                                          user.avatar ||
                                          `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                                        }
                                      />
                                      <AvatarFallback>
                                        {user.name
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="text-sm font-medium">
                                        {user.name}
                                      </span>
                                      <p className="text-xs text-muted-foreground">
                                        {user.role.charAt(0).toUpperCase() +
                                          user.role
                                            .slice(1)
                                            .toLowerCase()
                                            .replace(/_/g, " ")}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    asChild
                                  >
                                    <Link
                                      href={`/dashboard/tasks/create?assignedTo=${user.id}`}
                                    >
                                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                All staff members are currently assigned tasks
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            asChild
                          >
                            <Link href="/dashboard/tasks/create">
                              <Plus className="h-4 w-4 mr-2" /> Create New Task
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Upcoming Deadlines */}
                <Card className="col-span-1">
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
                        {(dashboardData?.tasks || [])
                          .filter((t) => {
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
                              className="block"
                            >
                              <div className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/50 border rounded-md p-3 hover:bg-blue-100/80 dark:hover:bg-blue-900/30 transition-colors">
                                <div className="flex justify-between items-center">
                                  <p className="font-medium truncate">
                                    {task.title}
                                  </p>
                                  <Badge
                                    className={
                                      task.priority === "high"
                                        ? "bg-red-500 text-white"
                                        : task.priority === "medium"
                                        ? "bg-yellow-500 text-white"
                                        : "bg-green-500 text-white"
                                    }
                                  >
                                    {task.priority.charAt(0).toUpperCase() +
                                      task.priority.slice(1)}
                                  </Badge>
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
                        {(dashboardData?.tasks || []).filter((t) => {
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
              </div>

              {/* Billing Section */}
              <div className="grid gap-4 md:grid-cols-1">
                <PendingBillingTasks />
              </div>
            </>
          )}
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-6">
          {loading && !statsLoaded ? (
            <DashboardStatsSkeleton />
          ) : (
            <>
              {/* Metrics section */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <OverviewStats
                  title="Total Users"
                  value={stats.totalUsers.toString()}
                  description={`${activeUserPercentage}% active`}
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <OverviewStats
                  title="Active Users"
                  value={stats.activeUsers.toString()}
                  icon={
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  }
                />
                <OverviewStats
                  title="Total Clients"
                  value={stats.totalClients.toString()}
                  icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                />
                <OverviewStats
                  title="Active Tasks"
                  value={stats.totalTasks.toString()}
                  icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                />
              </div>

              {/* User statistics cards */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <Card className="col-span-1 lg:col-span-1">
                  <CardHeader>
                    <CardTitle>User Analytics</CardTitle>
                    <CardDescription>
                      User activity and statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoaded && !error && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">
                            Activity Overview
                          </h3>
                          <Badge variant="outline">
                            {activeUserPercentage}% active
                          </Badge>
                        </div>

                        <Progress
                          value={activeUserPercentage}
                          className="h-2"
                        />

                        <div className="grid grid-cols-3 gap-4 pt-2 text-center">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Total
                            </p>
                            <p className="text-xl font-bold">
                              {stats.totalUsers}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Active
                            </p>
                            <p className="text-xl font-bold">
                              {stats.activeUsers}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">New</p>
                            <p className="text-xl font-bold">
                              {stats.newUsersThisMonth}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="col-span-1 lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Task Performance</CardTitle>
                    <CardDescription>Overview of task statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {statsLoaded && !error && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">
                            Completion Rate
                          </h3>
                          <Badge variant="outline">{taskCompletionRate}%</Badge>
                        </div>

                        <TaskProgress
                          items={[
                            {
                              label: "Completed",
                              value: stats.completedTasks,
                              color: "bg-green-500",
                            },
                            {
                              label: "In Progress",
                              value: stats.inProgressTasks,
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

                        <div className="grid grid-cols-4 gap-4 pt-2 text-center">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Total
                            </p>
                            <p className="text-xl font-bold">
                              {stats.totalTasks}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Completed
                            </p>
                            <p className="text-xl font-bold">
                              {stats.completedTasks}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              In Progress
                            </p>
                            <p className="text-xl font-bold">
                              {stats.inProgressTasks}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Overdue
                            </p>
                            <p className="text-xl font-bold text-red-500">
                              {stats.overdueTasksCount}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* Priority Tasks */}
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
                  ) : !dashboardData?.tasks?.some(
                      (t) => t.priority === "high"
                    ) ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <CheckCircle className="h-10 w-10 text-green-500 mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No high priority tasks
                      </p>
                    </div>
                  ) : (
                    dashboardData.tasks
                      .filter((t) => t.priority === "high")
                      .slice(0, 3)
                      .map((task) => (
                        <Link
                          key={task.id}
                          href={`/dashboard/tasks/${task.id}`}
                          className="block"
                        >
                          <div className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-center">
                              <p className="font-medium truncate">
                                {task.title}
                              </p>
                              <Badge className="bg-red-500 text-white">
                                High
                              </Badge>
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
                      View All Priority Tasks
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ACTIVITIES TAB */}
        <TabsContent value="activities" className="space-y-4">
          <Card className="w-full overflow-hidden">
            <CardHeader>
              <CardTitle>System Activity Feed</CardTitle>
              <CardDescription>
                Recent actions and events across the system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] px-6 py-4 bg-background">
                <ActivityFeed
                  fetchUrl="/api/activities"
                  loading={loading}
                  showUserInfo={true}
                  showRoleInfo={true}
                  expanded={true}
                  maxHeight="550px"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
