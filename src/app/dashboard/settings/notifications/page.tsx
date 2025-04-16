"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, Info, Trash2 } from "lucide-react";

interface NotificationPreferences {
  taskUpdates: boolean;
  commentMentions: boolean;
  systemAnnouncements: boolean;
  emailNotifications: boolean;
}

export default function NotificationsPage() {
  useSession();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    taskUpdates: true,
    commentMentions: true,
    systemAnnouncements: true,
    emailNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Replace with actual API endpoint when available
        // const response = await axios.get("/api/users/notification-preferences");
        // setPreferences(response.data);
        
        // Simulated data loading
        setTimeout(() => {
          setPreferences({
            taskUpdates: true,
            commentMentions: true,
            systemAnnouncements: true,
            emailNotifications: true,
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
        toast.error("Failed to load notification preferences");
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Load recent notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const response = await axios.get("/api/notifications?limit=10");
        setRecentNotifications(response.data.data);
      } catch (error) {
        console.error("Failed to load notifications:", error);
        toast.error("Failed to load notifications");
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      // Replace with actual API endpoint when available
      // await axios.post("/api/users/notification-preferences", preferences);
      
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Notification preferences saved");
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      toast.error("Failed to save notification preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await axios.delete("/api/notifications");
      setRecentNotifications([]);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
      {/* Notification Preferences */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose which notifications you&apos;d like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-6 w-11" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="task-updates">Task Updates</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Receive notifications about your tasks
                  </p>
                </div>
                <Switch
                  id="task-updates"
                  checked={preferences.taskUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, taskUpdates: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comment-mentions">Comment Mentions</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Get notified when someone mentions you
                  </p>
                </div>
                <Switch
                  id="comment-mentions"
                  checked={preferences.commentMentions}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, commentMentions: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="system-announcements">System Announcements</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Important system-wide updates and notices
                  </p>
                </div>
                <Switch
                  id="system-announcements"
                  checked={preferences.systemAnnouncements}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      systemAnnouncements: checked,
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Also send notifications to your email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      emailNotifications: checked,
                    })
                  }
                />
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleSavePreferences}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Preferences"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card className="lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              Your most recent notifications (max 20)
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearAllNotifications}
            disabled={recentNotifications.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </CardHeader>
        <CardContent>
          {notificationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 p-3 border rounded-md">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="space-y-4">
              {recentNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`flex gap-3 p-3 border rounded-md ${!notification.isRead ? 'bg-muted/30' : ''}`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.isRead && (
                        <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.createdAt)}
                      {notification.sentByName && ` · From: ${notification.sentByName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">No notifications to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}