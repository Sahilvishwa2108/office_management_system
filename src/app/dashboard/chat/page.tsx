"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Send,
  Paperclip,
  Image,
  FileText,
  AtSign,
  X,
  SmilePlus,
  Loader2,
  MessageCircle,
  Info,
  ChevronRight,
  ChevronLeft,
  Search,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  name: string;
  role: string;
  message: string;
  sentAt: string;
  attachments?: Attachment[];
  // For system messages and status updates
  type?: string;
  userId?: string;
  isOnline?: boolean;
  avatar?: string;
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
  type: string; // 'image', 'document', etc.
  size: number;
}

interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: "typing" | "idle"; // Added status for typing indicators
}

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageIndex, setLastReadMessageIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionStartPosition = useRef<number>(-1);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldScrollToBottom = useRef(true);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Virtualization for messages to improve performance
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => messageContainerRef.current,
    estimateSize: (index) => {
      // Calculate approximate message height based on content
      const message = messages[index];
      const baseHeight = 60; // Base height for a message
      const textHeight = message.message
        ? Math.ceil(message.message.length / 50) * 20 // Rough estimate of text height
        : 0;
      const attachmentsHeight = message.attachments?.length
        ? message.attachments.length * 60
        : 0;

      return baseHeight + textHeight + attachmentsHeight;
    },
    overscan: 10,
  });

  // Group users by online status for display
  const onlineUsersList = onlineUsers.filter((user) => user.isOnline);
  const offlineUsersList = onlineUsers.filter((user) => !user.isOnline);

  // Filter users based on search
  const filteredUsers = onlineUsers.filter((user) =>
    user.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Debounce typing indicator
  useEffect(() => {
    if (input.trim() && !isTyping) {
      setIsTyping(true);
      // Send typing indicator to server
      fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping: true }),
      }).catch(console.error);
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        // Send stopped typing to server
        fetch("/api/chat/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTyping: false }),
        }).catch(console.error);
      }
    }, 2000);

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [input, isTyping]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      // Use the virtualizer to scroll to the last message
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: "end" });
      setIsScrolling(false);
      setUnreadCount(0);
      shouldScrollToBottom.current = true;
    }
  }, [messages.length, rowVirtualizer]);

  // Check if we're at bottom
  const isAtBottom = useCallback(() => {
    if (!messageContainerRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } =
      messageContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
  }, []);

  // Handle initial scroll to bottom after messages load
  useEffect(() => {
    if (messages.length && messagesLoaded && shouldScrollToBottom.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages, messagesLoaded, scrollToBottom]);

  // Manual scroll handler
  useEffect(() => {
    const container = messageContainerRef.current;

    const handleScroll = () => {
      if (!container) return;

      const isBottomVisible = isAtBottom();

      // Only update isScrolling if the value changes to prevent re-renders
      if (isScrolling !== !isBottomVisible) {
        setIsScrolling(!isBottomVisible);
      }

      // Update if user manually scrolled up or down
      shouldScrollToBottom.current = isBottomVisible;

      if (isBottomVisible && unreadCount > 0) {
        setUnreadCount(0);
      }
    };

    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [isScrolling, unreadCount, isAtBottom]);

  // Handle new messages
  useEffect(() => {
    if (messages.length > 0 && messagesLoaded) {
      if (shouldScrollToBottom.current) {
        // If we should stick to bottom, scroll there
        scrollToBottom();
      } else if (!isAtBottom()) {
        // Otherwise, if user has scrolled up, increment unread count
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [messages.length, messagesLoaded, scrollToBottom, isAtBottom]);

  // Fetch chat history on load
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          const sortedMessages = data.sort(
            (a: Message, b: Message) =>
              new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
          );

          setMessages(sortedMessages);
          setLastReadMessageIndex(sortedMessages.length - 1);
          setMessagesLoaded(true);
          shouldScrollToBottom.current = true;

          // Initial scroll will happen in the next effect after messages are set
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Could not load chat history");
      }
    };
    fetchMessages();
  }, []);

  // Fetch online users
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const res = await fetch("/api/chat/users");
        if (res.ok) {
          const users: User[] = await res.json();

          // Ensure current user is always shown as online
          setOnlineUsers(
            users.map((user) => {
              if (session?.user?.id === user.id) {
                return { ...user, isOnline: true };
              }
              return user;
            })
          );

          setMentionUsers(users);
        }
      } catch (error) {
        console.error("Failed to fetch online users:", error);
      }
    };

    if (session?.user) {
      fetchOnlineUsers();

      // Poll for online users every 30 seconds
      const interval = setInterval(fetchOnlineUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Listen to server-sent events for real-time updates
  useEffect(() => {
    const eventSource = new EventSource("/api/chat/stream");

    eventSource.onmessage = (event) => {
      if (event.data !== "[DONE]") {
        try {
          const data = JSON.parse(event.data);

          // Check if it's a heartbeat message
          if (data.type === "heartbeat") {
            return;
          }

          // Check if it's a typing indicator
          if (data.type === "typing_indicator") {
            setOnlineUsers((prev) => {
              const updatedUsers = [...prev];
              const userIndex = updatedUsers.findIndex(
                (u) => u.id === data.userId
              );

              if (userIndex !== -1) {
                updatedUsers[userIndex].status = data.isTyping
                  ? "typing"
                  : "idle";
              }

              return updatedUsers;
            });
            return;
          }

          // Check if it's a user status update
          if (data.type === "user_status") {
            setOnlineUsers((prev) => {
              const updatedUsers = [...prev];
              const userIndex = updatedUsers.findIndex(
                (u) => u.id === data.userId
              );

              // Skip updating the current user's status from external events
              if (data.userId === session?.user?.id) {
                return updatedUsers;
              }

              if (userIndex !== -1) {
                updatedUsers[userIndex].isOnline = data.isOnline;
                if (!data.isOnline) {
                  updatedUsers[userIndex].lastSeen = new Date().toISOString();
                }
              } else if (data.isOnline) {
                // Add user if they've just come online
                updatedUsers.push({
                  id: data.userId,
                  name: data.name,
                  role: data.role,
                  avatar: data.avatar,
                  isOnline: true,
                  status: "idle",
                });
              }

              return updatedUsers;
            });
            return;
          }

          // Regular chat message
          setMessages((prev) => {
            // Only add if not already in the list
            if (!prev.find((msg) => msg.id === data.id)) {
              const newMessages = [...prev, data];

              // Check if we need to update unread count
              if (isScrolling) {
                setUnreadCount((prev) => prev + 1);
              }

              return newMessages;
            }
            return prev;
          });
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ Stream error:", err);
      eventSource.close();
      // Attempt to reconnect after a delay
      setTimeout(() => {
        eventSource.close();
        new EventSource("/api/chat/stream");
      }, 5000);
    };

    // Send online status when connecting
    const sendOnlineStatus = async () => {
      try {
        await fetch("/api/chat/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline: true }),
        });
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    sendOnlineStatus();

    return () => {
      // Send offline status when leaving
      const sendOfflineStatus = async () => {
        try {
          await fetch("/api/chat/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isOnline: false }),
          });
        } catch (error) {
          console.error("Failed to update offline status:", error);
        }
      };

      sendOfflineStatus();
      eventSource.close();
    };
  }, [isScrolling, session?.user?.id]);

  // Handle mentions
  useEffect(() => {
    if (mentionQuery && mentionQuery.length > 0) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, [mentionQuery]);

  // Handle input changes (for mentions)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInput(text);

    // Check for @ symbol to trigger mention
    const lastAtIndex = text.lastIndexOf("@");
    if (
      lastAtIndex !== -1 &&
      (lastAtIndex === 0 || text[lastAtIndex - 1] === " ")
    ) {
      mentionStartPosition.current = lastAtIndex;
      const query = text.substring(lastAtIndex + 1);
      setMentionQuery(query);

      // Filter users based on the query
      const filteredUsers = onlineUsers.filter((user) =>
        user.name.toLowerCase().includes(query.toLowerCase())
      );
      setMentionUsers(filteredUsers);
    } else {
      setShowMentions(false);
      mentionStartPosition.current = -1;
    }
  };

  // Select a user to mention
  const selectMention = (user: User) => {
    if (mentionStartPosition.current !== -1) {
      const beforeMention = input.substring(0, mentionStartPosition.current);
      const afterMention = input.substring(
        mentionStartPosition.current + mentionQuery.length + 1
      );

      const newText = `${beforeMention}@${user.name} ${afterMention}`;
      setInput(newText);

      setShowMentions(false);
      mentionStartPosition.current = -1;
      setMentionQuery("");
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files);

      // Limit to 3 files at a time
      if (attachments.length + newFiles.length > 3) {
        toast.error("You can only attach up to 3 files at a time");
        return;
      }

      // Check file size (limit to 10MB per file)
      const overSizedFiles = newFiles.filter(
        (file) => file.size > 10 * 1024 * 1024
      );
      if (overSizedFiles.length > 0) {
        toast.error("Files must be smaller than 10MB");
        return;
      }

      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  // Remove an attachment before sending
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const newMessageId = uuidv4();
    const newMessage: Message = {
      id: newMessageId,
      name: session?.user?.name || "Guest",
      role: session?.user?.role || "GUEST",
      message: input,
      sentAt: new Date().toISOString(),
    };

    // Clear input immediately for better UX
    setInput("");

    // Handle file uploads if any
    if (attachments.length > 0) {
      setIsUploading(true);

      try {
        const formData = new FormData();
        attachments.forEach((file) => {
          formData.append("files", file);
        });
        formData.append("messageId", newMessageId);

        // Upload files
        const uploadResponse = await fetch("/api/chat/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload files");
        }

        const uploadResult = await uploadResponse.json();
        newMessage.attachments = uploadResult.attachments;

        setAttachments([]);
      } catch (error) {
        console.error("❌ Error uploading files:", error);
        toast.error("Failed to upload files");
      } finally {
        setIsUploading(false);
      }
    }

    try {
      // Send the message
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });

      if (!res.ok) {
        console.warn("⚠ Server error:", await res.text());
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      toast.error("Failed to send message");
    }
  };

  // Format message text with mentions highlighted
  const formatMessageWithMentions = (text: string) => {
    // Split by potential @mentions
    const parts = text.split(/(@\w+)/g);

    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const username = part.substring(1);
        const mentionedUser = onlineUsers.find(
          (user) => user.name.toLowerCase() === username.toLowerCase()
        );

        if (mentionedUser) {
          return (
            <span
              key={index}
              className="bg-primary/10 text-primary rounded px-1 font-medium"
            >
              {part}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Group messages by date for better visual organization
  const getMessageDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  // Create array with dates for dividers
  const messagesWithDates = messages.reduce<{
    messages: Message[];
    dates: { [key: string]: boolean };
  }>(
    (acc, message) => {
      const date = getMessageDate(new Date(message.sentAt));

      if (!acc.dates[date]) {
        acc.dates[date] = true;
      }

      acc.messages.push(message);
      return acc;
    },
    { messages: [], dates: {} }
  );

  const dateLabels = Object.keys(messagesWithDates.dates);

  return (
    <div className="flex h-[calc(100vh-7rem)] rounded-md">
      {/* Users sidebar */}
      <div
        className={cn(
          "border-r bg-card flex flex-col transition-all duration-300 relative",
          sidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Sidebar header with toggle button */}
        <div className="p-4 border-b">
          {!sidebarCollapsed ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Team Members</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSidebarCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar content */}
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center pt-2 space-y-4 max-h-full overflow-y-auto p-2">
            {/* Online users section with label */}
            {onlineUsersList.length > 0 && (
              <>
                <div className="w-full text-center py-1 text-xs text-muted-foreground">
                  Online
                </div>
                {onlineUsersList.map((user) => (
                  <TooltipProvider key={user.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={
                                user.avatar ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                              }
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background bg-green-500"></span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.role.replace(/_/g, " ")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </>
            )}

            {/* Offline users section with label */}
            {offlineUsersList.length > 0 && (
              <>
                <div className="w-full text-center py-1 text-xs text-muted-foreground border-t mt-2 pt-2">
                  Offline
                </div>
                {offlineUsersList.slice(0, 5).map((user) => (
                  <TooltipProvider key={user.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative opacity-70 cursor-pointer hover:opacity-90 transition-opacity">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={
                                user.avatar ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                              }
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background bg-gray-400"></span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last seen:{" "}
                          {user.lastSeen
                            ? formatDistanceToNow(new Date(user.lastSeen))
                            : "recently"}{" "}
                          ago
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}

                {offlineUsersList.length > 5 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-9 w-9 opacity-70 bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                          <span className="text-xs font-medium">
                            +{offlineUsersList.length - 5}
                          </span>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>
                          {offlineUsersList.length - 5} more offline users
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <Tabs defaultValue="online" className="w-full">
              <div className="px-4 pt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="online" className="flex-1">
                    Online ({onlineUsersList.length})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex-1">
                    All ({filteredUsers.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="online" className="mt-0">
                <div className="px-2 pt-2 space-y-1">
                  {onlineUsersList.length > 0 ? (
                    onlineUsersList
                      .filter((u) =>
                        u.name.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
                        >
                          <div className="relative">
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={
                                  user.avatar ||
                                  `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                                }
                                alt={user.name}
                              />
                              <AvatarFallback>
                                {user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background bg-green-500"></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.status === "typing" ? (
                                <span className="text-primary animate-pulse">
                                  typing...
                                </span>
                              ) : (
                                user.role.replace(/_/g, " ")
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No users currently online
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="all" className="mt-0">
                <div className="px-2 pt-2 space-y-1">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="relative">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={
                                user.avatar ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                              }
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background",
                              user.isOnline ? "bg-green-500" : "bg-gray-400"
                            )}
                          ></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {!user.isOnline && user.lastSeen
                              ? `Last seen: ${formatDistanceToNow(
                                  new Date(user.lastSeen)
                                )} ago`
                              : user.role.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}
      </div>

      {/* Chat main area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden border-0 rounded-none shadow-none">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-card">
            <div>
              <CardTitle className="text-xl">Team Chat Room</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span className="bg-green-500 rounded-full h-2 w-2"></span>
                {onlineUsersList.length} online
              </CardDescription>
            </div>
            {!sidebarCollapsed && (
              <div className="flex -space-x-2">
                {onlineUsersList.slice(0, 5).map((user) => (
                  <TooltipProvider key={user.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-7 w-7 border-2 border-background">
                          <AvatarImage
                            src={
                              user.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                            }
                            alt={user.name}
                          />
                          <AvatarFallback>
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{user.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {onlineUsersList.length > 5 && (
                  <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                    +{onlineUsersList.length - 5}
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 p-0 relative bg-card/10">
            {/* Virtual list for messages */}
            <div
              ref={messageContainerRef}
              className="h-full overflow-auto"
              style={{ contain: "strict" }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="bg-muted p-4 rounded-full mb-4">
                    <MessageCircle className="h-12 w-12 text-muted-foreground opacity-70" />
                  </div>
                  <h3 className="font-medium">No messages yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start the conversation by sending a message
                  </p>
                </div>
              ) : (
                <div
                  className="relative p-4 w-full"
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const message = messages[virtualRow.index];
                    const messageDate = new Date(message.sentAt);
                    const showDateDivider =
                      virtualRow.index === 0 ||
                      getMessageDate(messageDate) !==
                        getMessageDate(
                          new Date(messages[virtualRow.index - 1].sentAt)
                        );

                    // Check if this is first message from a user or if previous message is from someone else
                    const isNewSender =
                      virtualRow.index === 0 ||
                      messages[virtualRow.index - 1].name !== message.name;

                    // Check if this is a consecutive message within 5 minutes
                    const isConsecutive =
                      virtualRow.index > 0 &&
                      messages[virtualRow.index - 1].name === message.name &&
                      new Date(message.sentAt).getTime() -
                        new Date(
                          messages[virtualRow.index - 1].sentAt
                        ).getTime() <
                        5 * 60 * 1000;

                    return (
                      <div
                        key={message.id}
                        data-index={virtualRow.index}
                        className="absolute top-0 left-0 w-full"
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {showDateDivider && (
                          <div className="flex justify-center my-3">
                            <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                              {getMessageDate(messageDate)}
                            </div>
                          </div>
                        )}

                        <div
                          className={cn(
                            "flex gap-3 max-w-[85%] mb-1 mx-2",
                            message.name === session?.user?.name
                              ? "ml-auto flex-row-reverse"
                              : "",
                            !isNewSender && message.name !== session?.user?.name
                              ? "pl-12" // Indent continued messages from others
                              : ""
                          )}
                        >
                          {message.name !== session?.user?.name &&
                            isNewSender && (
                              <Avatar className="h-9 w-9 mt-1">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.name}`}
                                  alt={message.name}
                                />
                                <AvatarFallback>
                                  {message.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          <div
                            className={cn(
                              "rounded-lg p-3 min-w-[120px] animate-in fade-in",
                              message.name === session?.user?.name
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted rounded-tl-none",
                              isConsecutive &&
                                message.name !== session?.user?.name
                                ? "rounded-tl-lg"
                                : "",
                              isConsecutive && message.name === session?.user?.name
                                ? "rounded-tr-lg"
                                : ""
                            )}
                          >
                            {isNewSender && (
                              <div className="flex gap-2 items-center mb-1">
                                <p className="text-sm font-medium truncate">
                                  {message.name === session?.user?.name
                                    ? "You"
                                    : message.name}
                                </p>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <time className="text-xs opacity-70">
                                        {format(messageDate, "h:mm a")}
                                      </time>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {format(messageDate, "PPP p")}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}

                            {message.message && (
                              <div className="whitespace-pre-wrap break-words">
                                {formatMessageWithMentions(message.message)}
                              </div>
                            )}

                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className="rounded border overflow-hidden"
                                    >
                                      {attachment.type === "image" ? (
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block"
                                        >
                                          <img
                                            src={attachment.url}
                                            alt={attachment.filename}
                                            className="max-h-40 max-w-full object-contain"
                                            onLoad={() => {
                                              if (shouldScrollToBottom.current) {
                                                scrollToBottom();
                                              }
                                            }}
                                          />
                                        </a>
                                      ) : (
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 flex items-center gap-2 hover:bg-muted/60 transition-colors"
                                        >
                                          <FileText className="h-5 w-5" />
                                          <div className="overflow-hidden">
                                            <p className="truncate text-sm">
                                              {attachment.filename}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {formatFileSize(attachment.size)}
                                            </p>
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>

            {/* Always visible Jump to Bottom button (shows when scrolled up) */}
            {isScrolling && (
              <Button
                size="sm"
                variant="outline"
                className="absolute bottom-4 right-4 shadow-lg flex items-center gap-1 bg-background/80 backdrop-blur-sm transition-all duration-200 border"
                onClick={scrollToBottom}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}

            {/* New message indicator */}
            {isScrolling && unreadCount > 0 && (
              <Button
                size="sm"
                className="absolute bottom-16 right-4 shadow-lg animate-in fade-in slide-in-from-bottom-3"
                onClick={scrollToBottom}
              >
                {unreadCount} new {unreadCount === 1 ? "message" : "messages"}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            )}

            {/* Users typing indicator */}
            {onlineUsers.some(
              (u) => u.status === "typing" && u.id !== session?.user?.id
            ) && (
              <div className="absolute bottom-0 left-4 py-1 px-3 rounded-t-lg bg-background text-xs text-muted-foreground border border-b-0 flex items-center gap-2 z-10">
                <div className="flex space-x-1">
                  <span className="animate-bounce delay-0 h-1.5 w-1.5 bg-muted-foreground rounded-full"></span>
                  <span className="animate-bounce delay-150 h-1.5 w-1.5 bg-muted-foreground rounded-full"></span>
                  <span className="animate-bounce delay-300 h-1.5 w-1.5 bg-muted-foreground rounded-full"></span>
                </div>
                <span>
                  {onlineUsers
                    .filter(
                      (u) => u.status === "typing" && u.id !== session?.user?.id
                    )
                    .map((u) => u.name)
                    .join(", ")}{" "}
                  {onlineUsers.filter(
                    (u) => u.status === "typing" && u.id !== session?.user?.id
                  ).length === 1
                    ? "is"
                    : "are"}{" "}
                  typing...
                </span>
              </div>
            )}
          </CardContent>

          {/* Mention list */}
          {showMentions && (
            <div className="absolute bottom-24 left-4 bg-background shadow-lg rounded-lg border p-1 max-h-48 overflow-auto z-20">
              {mentionUsers.length > 0 ? (
                mentionUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start gap-2 px-2 py-1.5"
                    onClick={() => selectMention(user)}
                  >
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        user.isOnline ? "bg-green-500" : "bg-gray-400"
                      )}
                    ></span>
                    {user.name}
                  </Button>
                ))
              ) : (
                <div className="text-center p-2 text-sm text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          )}

          {/* Attachment preview */}
          {attachments.length > 0 && (
            <div className="px-4 pt-3 pb-0 flex flex-wrap gap-2 border-t bg-card">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-2 flex items-center gap-2 group relative"
                >
                  {file.type.startsWith("image/") ? (
                    <Image className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <div className="overflow-hidden">
                    <p className="truncate max-w-28 text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 opacity-70 hover:opacity-100 absolute -top-1 -right-1 bg-background rounded-full"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2 items-center"
            >
              {/* Emoji picker button */}
              <div className="relative" ref={emojiRef}>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <SmilePlus className="h-5 w-5" />
                </Button>

                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 w-64 bg-background shadow-lg rounded-lg border p-3 z-20">
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        "😀", "😂", "🙂", "😍", "😎", "🤔", "👍", "👎", "👏", "🙏",
                        "🔥", "❤️", "⭐", "✅", "⚠️", "❌", "💯", "🎉", "👀", "💪",
                        "🤝", "👋", "👨‍💻", "📊", "🗓️", "📝", "📞", "💼", "🏢", "⏰",
                        "🚀", "💡"
                      ].map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setInput((prev) => prev + emoji);
                            // Keep focus on input after adding emoji
                            document.querySelector("input")?.focus();
                          }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                    <div className="h-2 w-2 bg-background border-l border-b rotate-45 absolute -bottom-1 left-4 border-r-0 border-t-0"></div>
                  </div>
                )}
              </div>

              {/* File attachment button */}
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                />
                <Paperclip className="h-5 w-5" />
              </Button>

              {/* Message input */}
              <div className="relative flex-1">
                <Input
                  placeholder="Type a message... (Use @ to mention)"
                  value={input}
                  onChange={handleInputChange}
                  disabled={isUploading}
                  className="pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  autoFocus
                />
                {mentionQuery && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    <AtSign className="h-4 w-4" />
                  </span>
                )}
              </div>

              {/* Send button */}
              <Button
                type="submit"
                size="icon"
                className="shrink-0"
                disabled={
                  (!input.trim() && attachments.length === 0) || isUploading
                }
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}