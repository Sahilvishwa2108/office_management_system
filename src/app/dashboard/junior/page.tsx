"use client";

import { useState, useEffect} from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  CheckCircle, 
  Activity, 
  AlertTriangle,
  Clock,
  Calendar,
  Star,
  ExternalLink, 
  CalendarClock
} from "lucide-react";
import { DashboardContentSkeleton } from "@/components/loading/dashboard-skeleton";
import { RecentNotificationsCard } from "@/components/dashboard/recent-notifications-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface JuniorDashboardData {
  stats: {
    activeTasks: number;
    completedTasks: number;
    completionRate: number;
    upcomingDeadlines: number;
    overdueTasksCount: number;
    onTimeCompletionRate: number;
    highPriorityTasks: number;
    totalTasksAssigned: number;
    weeklyCompletionRate: number;
    tasksDueToday?: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    progress?: number;
    client?: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    action: string;
    target: string;
    timestamp: string;
  }>;
  deadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: string;
    priority: string;
    isOverdue: boolean;
  }>;
  timeTracking?: {
    thisWeek: number;
    lastWeek: number;
    weeklyTarget: number;
    dailyAverage: number;
  };
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

// Create a wrapper component for all the dashboard content
function JuniorDashboardContent() {
  const [dashboardData, setDashboardData] = useState<JuniorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const tab = url.searchParams.get('tab');
        if (tab && ['overview', 'analytics', 'activity'].includes(tab)) {
          setActiveTab(tab);
        }
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data
        const response = await fetch('/api/junior/dashboard');
        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.status}`);
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch junior dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Load analytics data when needed
  useEffect(() => {
    if (activeTab === 'analytics' && !statsLoaded) {
      loadAnalyticsData();
    }
  }, [activeTab, statsLoaded]);

  const loadAnalyticsData = async () => {
    if (statsLoaded) return;
    
    try {
      setLoading(true);
      
      // You would typically fetch extended analytics data here
      // For now, we'll simulate a delayed response with the existing data
      
      setTimeout(() => {
        if (dashboardData) {
          // Extend stats with additional analytics
          const enhancedData = {
            ...dashboardData,
            stats: {
              ...dashboardData.stats,
              onTimeCompletionRate: 85,
              weeklyCompletionRate: 78,
              highPriorityTasks: dashboardData.tasks?.filter(t => t.priority === 'high').length || 0,
              totalTasksAssigned: (dashboardData.stats.activeTasks + dashboardData.stats.completedTasks)
            },
            timeTracking: {
              thisWeek: 38,
              lastWeek: 35,
              weeklyTarget: 40,
              dailyAverage: 7.6
            }
          };
          
          setDashboardData(enhancedData);
          setStatsLoaded(true);
        }
        setLoading(false);
      }, 500);
      
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', value);
      window.history.pushState({}, '', url.toString());
    }
  };

  const stats = dashboardData?.stats || {
    activeTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    upcomingDeadlines: 0,
    overdueTasksCount: 0,
    onTimeCompletionRate: 0,
    highPriorityTasks: 0,
    totalTasksAssigned: 0,
    weeklyCompletionRate: 0,
    tasksDueToday: 0,
  };

  // Helper to compare dates without time
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  return (
    <div className="flex flex-col gap-5">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
                {/* Stats Cards - using proper data from API */}
                <div className="col-span-4 grid grid-cols-2 gap-4">
                  <Card className="relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Active Tasks</p>
                          <p className="text-2xl font-bold">{stats.activeTasks}</p>
                        </div>
                        <div className="rounded-full p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          <Activity className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Due Today</p>
                          <p className="text-2xl font-bold">{stats.tasksDueToday || 0}</p>
                        </div>
                        <div className="rounded-full p-2 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          <Clock className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                          <p className="text-2xl font-bold">{stats.completedTasks}</p>
                          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                        </div>
                        <div className="rounded-full p-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">High Priority</p>
                          <p className="text-2xl font-bold">{stats.highPriorityTasks}</p>
                        </div>
                        <div className="rounded-full p-2 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          <Star className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="col-span-2 lg:col-span-3 h-full max-h-[350px]">
                  <RecentNotificationsCard className="h-full" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority Tasks Card (moved to second row, first column) */}
                <Card className="h-[350px] flex flex-col overflow-hidden ">
                  <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                      <Star className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
                      Priority Tasks
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      Tasks requiring immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pt-4 overflow-hidden flex flex-col">
                    {loading ? (
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-[70px] w-full" />
                        <Skeleton className="h-[70px] w-full" />
                        <Skeleton className="h-[70px] w-full" />
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center h-full">
                        <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground">{error}</p>
                      </div>
                    ) : !dashboardData?.tasks || dashboardData.tasks.filter(t => t.status !== "completed" && t.priority === "high").length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center h-full bg-slate-50/50 dark:bg-slate-900/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/50">
                        <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-full mb-3">
                          <CheckCircle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          No priority tasks
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px]">
                          You don't have any high priority tasks at the moment
                        </p>
                      </div>
                    ) : (
                      <div className="h-full max-h-[260px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {dashboardData.tasks
                          .filter(task => task.status !== "completed" && task.priority === "high")
                          .sort((a, b) => {
                            if (a.dueDate && b.dueDate) {
                              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                            }
                            return 0;
                          })
                          .map(task => (
                            <div
                              key={task.id}
                              className="p-3 rounded-md bg-white dark:bg-gray-950/50 border border-transparent hover:border-amber-100 dark:hover:border-amber-950/70 hover:shadow-sm transition-all group"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
                                  {task.title}
                                </span>
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50">
                                  High
                                </Badge>
                              </div>
                              
                              {task.dueDate && (
                                <div className="flex justify-between items-center mt-3">
                                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  
                                  {getDaysRemaining(new Date(task.dueDate)) !== null && (
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                      getDaysRemaining(new Date(task.dueDate)) <= 1 
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' 
                                        : getDaysRemaining(new Date(task.dueDate)) <= 3
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    }`}>
                                      {getDaysRemaining(new Date(task.dueDate)) === 0 
                                        ? 'Due today' 
                                        : getDaysRemaining(new Date(task.dueDate)) === 1 
                                          ? 'Due tomorrow' 
                                          : `${getDaysRemaining(new Date(task.dueDate))} days left`}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {task.progress !== undefined && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-600 dark:text-slate-400">Progress</span>
                                    <span className="text-slate-700 dark:text-slate-300">{task.progress}%</span>
                                  </div>
                                  <Progress value={task.progress} className="h-1" />
                                </div>
                              )}
                              
                              <div className="mt-3 text-right">
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
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Upcoming Deadlines Card */}
                <Card className="h-[350px] flex flex-col overflow-hidden ">
                  <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="flex items-center text-slate-800 dark:text-slate-200">
                      <CalendarClock className="h-5 w-5 mr-2 text-rose-600 dark:text-rose-400" />
                      Upcoming Deadlines
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      Tasks due in the next 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pt-4 overflow-hidden flex flex-col">
                    {!loading && !error && dashboardData?.deadlines ? (
                      <div className="h-full max-h-[260px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {dashboardData.deadlines.filter(task => 
                          isWithinNextDays(new Date(task.dueDate), 7) && 
                          task.status !== 'completed'
                        ).length > 0 ? (
                          dashboardData.deadlines
                            .filter(task => 
                              isWithinNextDays(new Date(task.dueDate), 7) && 
                              task.status !== 'completed'
                            )
                            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                            .map((task) => {
                              // Determine priority styling
                              const priorityKey = task.priority.toUpperCase();
                              const priorityStyles = {
                                'HIGH': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/50',
                                'MEDIUM': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50',
                                'LOW': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50',
                              };
                              
                              // Calculate days remaining
                              const daysRemaining = getDaysRemaining(new Date(task.dueDate));
                              
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
                                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })}
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
                                  
                                  <div className="mt-3 text-right">
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function JuniorDashboard() {
  return <JuniorDashboardContent />;
}