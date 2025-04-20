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
  CalendarClock,
  ExternalLink,
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
import { format } from "date-fns";

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

// Main dashboard component
export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (activeTab === "overview") {
      setLoadingOverview(true);
      // Fetch data for the Overview tab
      fetchOverviewData().then(() => setLoadingOverview(false));
    } else if (activeTab === "analytics") {
      setLoadingAnalytics(true);
      // Fetch data for the Analytics tab
      fetchAnalyticsData().then(() => setLoadingAnalytics(false));
    }
  }, [activeTab]);

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
                <Card className="col-span-2 lg:col-span-4 h-[350px] overflow-hidden border-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <Plus className="h-5 w-5 mr-2 text-primary" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Frequently used administrative operations</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-auto max-h-[270px] custom-scrollbar">
                    <Link href="/dashboard/admin/users/create" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4 group hover:shadow-md hover:border-primary/30 transition-all bg-gradient-to-br from-transparent to-blue-50/50 dark:from-transparent dark:to-blue-950/20"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-blue-700 dark:text-blue-400">Create User</span>
                          <span className="text-xs text-muted-foreground">
                            Add new team members
                          </span>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <UserPlus className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        </div>
                      </Button>
                    </Link>
                    <Link href="/dashboard/admin/clients/create" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4 group hover:shadow-md hover:border-primary/30 transition-all bg-gradient-to-br from-transparent to-purple-50/50 dark:from-transparent dark:to-purple-950/20"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-purple-700 dark:text-purple-400">Create Client</span>
                          <span className="text-xs text-muted-foreground">
                            Add new client accounts
                          </span>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <Briefcase className="h-5 w-5 text-purple-500 dark:text-purple-400" />
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
                            Assign new work items
                          </span>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <Plus className="h-5 w-5 text-green-500 dark:text-green-400" />
                        </div>
                      </Button>
                    </Link>
                    <Link href="/dashboard/admin/clients/guest/create" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between h-20 p-4 group hover:shadow-md hover:border-primary/30 transition-all bg-gradient-to-br from-transparent to-amber-50/50 dark:from-transparent dark:to-amber-950/20"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-amber-700 dark:text-amber-400">Create Guest</span>
                          <span className="text-xs text-muted-foreground">
                            Add temporary accounts
                          </span>
                        </div>
                        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-2 transition-transform group-hover:scale-110 group-hover:rotate-3">
                          <UserPlus className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                        </div>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <div className="col-span-2 lg:col-span-3 h-[350px]">
                  <RecentNotificationsCard className="h-full" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {/* Staff Utilization */}
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
                    {!loading && !error && dashboardData?.staffWithoutTasks ? (
                      <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">Available Staff</h3>
                          {dashboardData.staffWithoutTasks.length > 0 && (
                            <Badge variant="outline">
                              {dashboardData.staffWithoutTasks.length} available
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          {/* Scrollable container */}
                          <div className="h-full max-h-[230px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                            {dashboardData.staffWithoutTasks.length > 0 ? (
                              dashboardData.staffWithoutTasks.map((user) => (
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-70 group-hover:opacity-100"
                                    asChild
                                  >
                                    <Link href={`/dashboard/tasks/create?assignedTo=${user.id}`}>
                                      <UserPlus className="h-4 w-4" />
                                    </Link>
                                  </Button>
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
                          task.status !== 'COMPLETED'
                        ).length > 0 ? (
                          dashboardData.tasks
                            .filter(task =>
                              task.dueDate && isWithinNextDays(new Date(task.dueDate), 7) &&
                              task.status !== 'COMPLETED'
                            )
                            .sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime())
                            .map((task) => {
                              // Determine priority styling
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
                                    <Badge variant="outline" className={priorityStyles[task.priority as keyof typeof priorityStyles]}>
                                      {task.priority}
                                    </Badge>
                                  </div>

                                  <div className="flex justify-between items-center mt-3">
                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span>
                                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                                      </span>
                                    </div>

                                    {daysRemaining !== null && (
                                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${daysRemaining <= 1
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
                                      {task.assignedTo ? (
                                        <div className="flex items-center gap-1">
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`} />
                                            <AvatarFallback className="text-[10px]">{task.assignedTo.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs text-slate-600 dark:text-slate-400">{task.assignedTo.name}</span>
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
          {loading ? (
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-4 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
async function fetchOverviewData(): Promise<void> {
  // TODO: Implement the actual functionality here
  return Promise.resolve();
}

async function fetchAnalyticsData(): Promise<void> {
  // TODO: Implement the actual functionality here
  return Promise.resolve();
}

