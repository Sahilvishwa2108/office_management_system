"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
// Remove unused axios import
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Users,
  ClipboardList,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

// Define ActivityItem interface to type the activity data
interface ActivityItem {
  id: number;
  type: "user" | "task" | "client" | "document" | "message";
  action: string;
  timestamp: Date;
}

// Define overall stats interface
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalClients: number;
  pendingTasks: number;
  completedTasks: number;
  recentActivity: ActivityItem[];
  loading: boolean;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalClients: 0,
    pendingTasks: 0,
    completedTasks: 0,
    recentActivity: [],
    loading: true,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setTimeout(() => {
          setStats({
            totalUsers: 24,
            activeUsers: 18,
            totalClients: 12,
            pendingTasks: 8,
            completedTasks: 16,
            recentActivity: [
              {
                id: 1,
                type: "user", // Now properly typed
                action: "User John Doe was added",
                timestamp: new Date(),
              },
              {
                id: 2,
                type: "task", // Now properly typed
                action: "Task 'Financial Report' was completed",
                timestamp: new Date(Date.now() - 3600000),
              },
              {
                id: 3,
                type: "client", // Now properly typed
                action: "Client ABC Corp was updated",
                timestamp: new Date(Date.now() - 7200000),
              },
            ],
            loading: false,
          });
        }, 1000);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}! Here's an overview of your
          system.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Users"
              value={stats.loading ? "..." : stats.totalUsers}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              change={{ value: 12, trend: "positive" }}
              description="vs. last month"
            />
            <StatsCard
              title="Active Clients"
              value={stats.loading ? "..." : stats.totalClients}
              icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
              change={{ value: 4, trend: "positive" }}
              description="vs. last month"
            />
            <StatsCard
              title="Pending Tasks"
              value={stats.loading ? "..." : stats.pendingTasks}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              change={{ value: 2, trend: "negative" }}
              description="vs. last week"
            />
            <StatsCard
              title="Completed Tasks"
              value={stats.loading ? "..." : stats.completedTasks}
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
              change={{ value: 8, trend: "positive" }}
              description="vs. last week"
            />
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <DashboardCard
              title="Quick Actions"
              loading={stats.loading}
              variant="accent"
              className="lg:col-span-1"
            >
              <div className="flex flex-col gap-2">
                <Link href="/dashboard/admin/users/create">
                  <Button className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Create New User
                  </Button>
                </Link>
                <Link href="/dashboard/admin/tasks/create">
                  <Button className="w-full justify-start" variant="outline">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Create New Task
                  </Button>
                </Link>
                <Link href="/dashboard/admin/clients/create">
                  <Button className="w-full justify-start" variant="outline">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Add New Client
                  </Button>
                </Link>
                <Link href="/dashboard/admin/documents/upload">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </Link>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Recent Activity"
              loading={stats.loading}
              className="lg:col-span-1"
            >
              {!stats.loading && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex justify-between items-start pb-2 border-b last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                      {activity.type === "user" && (
                        <Users className="h-4 w-4 text-blue-500" />
                      )}
                      {activity.type === "task" && (
                        <ClipboardList className="h-4 w-4 text-green-500" />
                      )}
                      {activity.type === "client" && (
                        <Briefcase className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent activity to display.
                </p>
              )}
            </DashboardCard>

            <DashboardCard
              title="Upcoming Events"
              loading={stats.loading}
              className="lg:col-span-1"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start pb-2 border-b">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Team Meeting</p>
                    <p className="text-xs text-muted-foreground">
                      Wednesday, 10:00 AM
                    </p>
                  </div>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex justify-between items-start pb-2 border-b">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Client Deadline</p>
                    <p className="text-xs text-muted-foreground">
                      Friday, 5:00 PM
                    </p>
                  </div>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Monthly Reports</p>
                    <p className="text-xs text-muted-foreground">
                      End of month
                    </p>
                  </div>
                  <FileText className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </DashboardCard>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <DashboardCard
              title="User Management"
              icon="users"
              loading={stats.loading}
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Manage all users across roles and permissions
                </p>
                <Link href="/dashboard/admin/users">
                  <Button variant="secondary" className="w-full">
                    View All Users
                  </Button>
                </Link>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Task Management"
              icon="clipboardList"
              loading={stats.loading}
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Assign and manage tasks for your team
                </p>
                <Link href="/dashboard/admin/tasks">
                  <Button variant="secondary" className="w-full">
                    View All Tasks
                  </Button>
                </Link>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Client Management"
              icon="briefcase"
              loading={stats.loading}
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Manage client information and services
                </p>
                <Link href="/dashboard/admin/clients">
                  <Button variant="secondary" className="w-full">
                    View All Clients
                  </Button>
                </Link>
              </div>
            </DashboardCard>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <DashboardCard title="Analytics Dashboard" icon="pieChart">
            <p className="text-muted-foreground">
              Detailed analytics will be implemented in the next phase.
            </p>
          </DashboardCard>
        </TabsContent>

        <TabsContent value="reports">
          <DashboardCard title="Reports Dashboard" icon="pieChart">
            <p className="text-muted-foreground">
              Report generation will be implemented in the next phase.
            </p>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}