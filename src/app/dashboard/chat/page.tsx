"use client";
import NextImage from "next/image";
import {
  Send,
  Paperclip,
  FileText,
  X,
  SmilePlus,
  Loader2,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Pencil,
  ChevronDown,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  ChevronsDown,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState, useRef, useCallback, memo, Suspense } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import axios from "axios";
import { debounce } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  name: string;
  role: string;
  message: string;
  sentAt: string;
  attachments?: Attachment[];
  type?: string;
  userId?: string;
  isOnline?: boolean;
  avatar?: string;
  edited?: boolean;
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
}

interface User {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  status?: "typing" | "idle";
}

// Create a new component for inline document previews
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};
const handleDownload = async (url: string, filename: string, senderName: string) => {
  try {
    const senderFirstName = senderName.split(" ")[0];
    const now = new Date();

    // Format the date as dd-mm-yyyy
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;

    // Extract the file extension
    const fileExtension = filename.split(".").pop();
    const baseFilename = filename.replace(/\.[^/.]+$/, ""); // Remove the extension

    // Construct the new file name
    const newFileName = `${baseFilename}_${senderFirstName}_${formattedDate}.${fileExtension}`;

    const response = await fetch(url);
    const blob = await response.blob();

    // Create a temporary download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = newFileName;

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    toast.success(`Downloaded ${newFileName}`);
  } catch (error) {
    toast.error("Failed to download file");
    console.error("Download error:", error);
  }
};
const DocumentPreview = memo(({ attachment, senderName }: { attachment: Attachment; senderName: string }) => {
  return (
    <div className="flex items-center p-3 bg-muted/20 min-w-[300px]">
      <div className="mr-3">
        <FileText className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-black">
          Document • {formatFileSize(attachment.size)}
        </p>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDownload(attachment.url, attachment.filename, senderName)}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
DocumentPreview.displayName = "DocumentPreview";

// Add this component for upload progress display
const UploadProgressBar = memo(({ progress }: { progress: number }) => {
  return (
    <div className="w-full bg-background/20 rounded-full h-1 mt-1">
      <div
        className="bg-primary h-1 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});

UploadProgressBar.displayName = "UploadProgressBar";

// Message component to reduce re-renders
const MessageItem = memo(({
  message,
  index,
  messages,
  session,
  onDelete,
  onEdit,
  onImageView,
  onDownload,
  formatMessageWithMentions,
  getMessageDate
}: {
  message: Message,
  index: number,
  messages: Message[],
  session: {
    user?: {
      id?: string;
      name?: string;
      role?: string;
    }
  },
  onDelete: (id: string) => void,
  onEdit: (message: Message) => void,
  onImageView: (url: string, filename: string) => void,
  onDownload: (url: string, filename: string) => void,
  formatMessageWithMentions: (text: string) => React.ReactNode,
  getMessageDate: (date: Date) => string,
  downloading?: string | null
}) => {
  const messageDate = new Date(message.sentAt);
  const isUserMessage = message.name === session?.user?.name;
  const isNewSender =
    index === 0 ||
    messages[index - 1]?.name !== message.name ||
    new Date(message.sentAt).getTime() - new Date(messages[index - 1]?.sentAt).getTime() > 5 * 60 * 1000;

  return (
    <div key={`${message.id}-${index}`}>
      {/* Date separator */}
      {index === 0 || getMessageDate(messageDate) !== getMessageDate(new Date(messages[index - 1]?.sentAt)) ? (
        <div className="flex justify-center my-3">
          <div className="bg-background/70 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground border shadow-sm">
            {getMessageDate(messageDate)}
          </div>
        </div>
      ) : null}

      {/* Message container */}
      <div
        className={cn(
          "group flex gap-3 max-w-[85%]",
          isUserMessage ? "ml-auto flex-row-reverse" : "",
          !isNewSender && !isUserMessage ? "pl-12" : ""
        )}
      >
        {/* User avatar */}
        {message.name !== session?.user?.name && isNewSender && (
          <div className="mt-1 pb-2 relative">
            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
              <AvatarImage
                src={message.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${message.name}`}
                alt={message.name}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {message.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Message content */}
        <div className="relative group/message">
          <div
            className={cn(
              "relative rounded-lg px-2 py-1 shadow-sm",
              message.attachments?.some((attachment) => attachment.type === "image" || attachment.type === "document") ? "p-1" : "",
              isUserMessage
                ? "bg-[#1A7377] text-black rounded-tr-sm opacity-80"
                : "bg-gray-300 dark:bg-gray-800 text-gray-900 rounded-tl-sm border-gray-800"
            )}
          > 
            {/* Sender's name inside the message box */}
            {isNewSender && !isUserMessage && (
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {message.name}
              </div>
            )}


            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="space-y-2">
                <div
                  className={cn(
                    "rounded-lg border",
                    isUserMessage ? "border-primary-foreground/20" : "border-border",
                    message.attachments.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-1" : ""
                  )}
                >
                  {message.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className={cn(
                        "rounded overflow-hidden relative group",
                        attachment.type === "image" && (message.attachments ?? []).length > 1
                          ? "aspect-square"
                          : ""
                      )}
                    >
                      {attachment.type === "image" ? (
                        <div className="relative w-48 h-48">
                          <div
                            onClick={() => onImageView(attachment.url, attachment.filename)}
                            className="cursor-pointer overflow-hidden relative"
                          >
                            <NextImage
                              src={attachment.url}
                              alt={attachment.filename}
                              width={128}
                              height={128}
                              className="object-cover w-full h-full rounded-md transition-transform"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                              }}
                            />
                          </div>

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white hover:text-primary"
                              onClick={() => onImageView(attachment.url, attachment.filename)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white hover:text-primary"
                              onClick={() => onDownload(attachment.url, attachment.filename)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <DocumentPreview attachment={attachment} senderName={message.name} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            

            {/* Message text */}
            {message.message && (
              <div
                className={cn(
                  "whitespace-pre-wrap break-words text-[15px] leading-relaxed",
                  isUserMessage
                    ? "text-primary-foreground/95 font-medium text-right"
                    : "text-foreground"
                )}
              >
                {formatMessageWithMentions(message.message)}
              </div>
            )}
          </div>

          {/* Message timestamp */}
          <div
            className={cn(
              "text-[10px] opacity-0 group-hover/message:opacity-70 text-muted-foreground mt-1 transition-opacity",
              isUserMessage ? "text-right mr-1" : "ml-1"
            )}
          >
            {format(messageDate, "h:mm a")}
            {message.edited && " (edited)"}
          </div>

          {/* Edit/delete buttons */}
          {isUserMessage && (
            <div
              className={cn(
                "absolute invisible group-hover/message:visible opacity-0 group-hover/message:opacity-100 transition-opacity duration-150",
                "top-0 shadow-md rounded-full border bg-background/95 backdrop-blur-sm z-10",
                "left-0 transform -translate-x-[110%] flex"
              )}
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full text-primary hover:bg-primary/20"
                onClick={() => onEdit(message)}
                title="Edit message"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/20"
                onClick={() => onDelete(message.id)}
                title="Delete message"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = "MessageItem";

function ChatPageContent() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<{
    url: string;
    filename: string;
    senderName: string;
  } | null>(null);
  const [imageViewerZoom, setImageViewerZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldScrollToBottom = useRef(true);
  const emojiRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef(new Set<string>());

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);



  useEffect(() => {
    const updateOnlineStatus = async (isOnline: boolean) => {
      try {
        await fetch("/api/chat/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline }),
        });
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        updateOnlineStatus(false);
      } else {
        updateOnlineStatus(true);
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === "chat_online_status" && event.newValue === "false") {
        updateOnlineStatus(false);
      }
    };

    // Mark user as online when the component mounts
    updateOnlineStatus(true);
    localStorage.setItem("chat_online_status", "true");

    // Listen for visibility changes and storage events
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageEvent);

    // Set up a heartbeat to keep the user online
    const heartbeat = setInterval(() => {
      updateOnlineStatus(true);
    }, 20000); // Send heartbeat every 30 seconds

    // Mark user as offline when the component unmounts
    return () => {
      clearInterval(heartbeat);
      updateOnlineStatus(false);
      localStorage.setItem("chat_online_status", "false");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

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

  // Group users by online status for display
  const onlineUsersList = onlineUsers.filter(
    (user) => user.id !== session?.user?.id && user.isOnline
  );
  const offlineUsersList = onlineUsers.filter(
    (user) => user.id !== session?.user?.id && !user.isOnline
  );
  // Filter users based on search
  const filteredUsers = onlineUsers.filter((user) =>
    user.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Debounced typing indicator function
  const debouncedUpdateTypingStatus = useCallback(
    debounce((isTyping: boolean) => {
      fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping }),
      }).catch(console.error);
    }, 500),
    [/* Empty array is correct if nothing from component scope is used */]
  );

  // Handle typing indicator
  useEffect(() => {
    if (input.trim() && !isTyping) {
      setIsTyping(true);
      debouncedUpdateTypingStatus(true);
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      if (isTyping && !input.trim()) {
        setIsTyping(false);
        debouncedUpdateTypingStatus(false);
      }
    }, 2000);

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [input, isTyping, debouncedUpdateTypingStatus]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      setIsScrolling(false);
      setUnreadCount(0);
      shouldScrollToBottom.current = true;
    }
  }, []);

  // Load more messages when scrolling to top
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const res = await fetch(`/api/chat?page=${page}&limit=30`);
      if (res.ok) {
        const data = await res.json();

        if (data.length < 30) {
          setHasMore(false);
        }

        // Filter out duplicates
        const newMessages = data.filter((msg: Message) =>
          !messageIdsRef.current.has(msg.id)
        );

        // Update our message ID tracking
        newMessages.forEach((msg: Message) => {
          messageIdsRef.current.add(msg.id);
        });

        setMessages(prev => [...newMessages, ...prev]);
        setPage(p => p + 1);
      }
    } catch (error) {
      console.error("Failed to fetch more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore]);

  // Check if we're at bottom
  const isAtBottom = useCallback(() => {
    if (!messageContainerRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } =
      messageContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
  }, []);

  // Handle initial scroll to bottom after messages load
  // useEffect(() => {
  //   if (messages.length && messagesLoaded && shouldScrollToBottom.current) {
  //     requestAnimationFrame(() => {
  //       scrollToBottom();
  //     });
  //   }
  // }, [messages, messagesLoaded, scrollToBottom]);
  //   YEH UPAR WALA useEffect, yeh scroll karega, top to bottom, yeh niche wala direct botttom se khol ke dega.
  useEffect(() => {
    if (messages.length && messagesLoaded && shouldScrollToBottom.current) {
      if (messageContainerRef.current) {
        // Directly set scrollTop to scrollHeight for instant scroll
        messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
      }
    }
  }, [messages, messagesLoaded]);

  // Manual scroll handler
  useEffect(() => {
    const container = messageContainerRef.current;

    const handleScroll = () => {
      if (!container) return;

      const isBottomVisible = isAtBottom();

      // Load more messages when scrolling to top
      if (container.scrollTop < 100 && hasMore && !isLoadingMore) {
        loadMoreMessages();
      }

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
  }, [isScrolling, unreadCount, isAtBottom, hasMore, isLoadingMore, loadMoreMessages]);

  // Handle new messages
  useEffect(() => {
    if (messages.length > 0 && messagesLoaded) {
      if (shouldScrollToBottom.current) {
        scrollToBottom();
      } else if (!isAtBottom()) {
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [messages.length, messagesLoaded, scrollToBottom, isAtBottom]);

  // Fetch chat history on load
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat?limit=30");
        if (res.ok) {
          const data = await res.json();
          const sortedMessages = data.sort(
            (a: Message, b: Message) =>
              new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
          );

          // Track message IDs to avoid duplicates
          sortedMessages.forEach((msg: Message) => {
            messageIdsRef.current.add(msg.id);
          });

          setMessages(sortedMessages);
          setMessagesLoaded(true);
          shouldScrollToBottom.current = true;
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
              // Only update if the user status has actually changed
              const userIndex = prev.findIndex(u => u.id === data.userId);
              if (userIndex === -1) return prev;

              const currentStatus = prev[userIndex].status;
              const newStatus = data.isTyping ? "typing" : "idle";

              if (currentStatus === newStatus) return prev;

              const updatedUsers = [...prev];
              updatedUsers[userIndex].status = newStatus;
              return updatedUsers;
            });
            return;
          }

          // Check if it's a user status update
          if (data.type === "user_status") {
            setOnlineUsers((prev) => {
              // Skip updating the current user's status from external events
              if (data.userId === session?.user?.id) {
                return prev;
              }

              const userIndex = prev.findIndex(u => u.id === data.userId);
              const updatedUsers = [...prev];

              if (userIndex !== -1) {
                // Only update if status has changed
                if (updatedUsers[userIndex].isOnline !== data.isOnline) {
                  updatedUsers[userIndex].isOnline = data.isOnline;
                  if (!data.isOnline) {
                    updatedUsers[userIndex].lastSeen = new Date().toISOString();
                  }
                  return updatedUsers;
                }
                return prev;
              } else if (data.isOnline) {
                // Add user if they've just come online
                return [...prev, {
                  id: data.userId,
                  name: data.name,
                  role: data.role,
                  avatar: data.avatar,
                  isOnline: true,
                  status: "idle",
                }];
              }

              return prev;
            });
            return;
          }

          // Handle message edit
          if (data.type === "message_edit") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id
                  ? { ...msg, message: data.message, edited: true }
                  : msg
              )
            );
            return;
          }

          // Handle message delete
          if (data.type === "message_delete") {
            setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
            messageIdsRef.current.delete(data.id);
            return;
          }

          // Regular chat message
          if (!messageIdsRef.current.has(data.id)) {
            // Check if the message has attachments
            if (data.attachments?.length > 0) {
              // For messages with attachments, skip the `data.name !== session?.user?.name` check
              messageIdsRef.current.add(data.id);

              setMessages((prev) => {
                const newMessages = [...prev, data];

                if (isScrolling) {
                  setUnreadCount((prev) => prev + 1);
                }

                return newMessages;
              });
            } else if (data.name !== session?.user?.name) {
              // For messages without attachments, check `data.name !== session?.user?.name`
              messageIdsRef.current.add(data.id);

              setMessages((prev) => {
                const newMessages = [...prev, data];

                if (isScrolling) {
                  setUnreadCount((prev) => prev + 1);
                }

                return newMessages;
              });
            }
          }
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
  }, [isScrolling, session?.user?.id, session?.user?.name]);

  // Handle input changes (for mentions)//mention is now deleted
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInput(text);
  }, []);

  // Compress image before upload
  const compressImageIfNeeded = useCallback(async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/') || file.size <= 1000000) {
      return file;
    }

    return new Promise((resolve) => {
      const img = new Image(); // Create a new image element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        let width = img.width;
        let height = img.height;

        if (width > height && width > 1200) {
          height = Math.round((height * 1200) / width);
          width = 1200;
        } else if (height > 1200) {
          width = Math.round((width * 1200) / height);
          height = 1200;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with reduced quality
        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.85);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files);
  
      // Limit to 3 files at a time
      if (attachments.length + newFiles.length > 3) {
        toast.error("You can only attach up to 3 files at a time");
        e.target.value = ""; // Reset file input
        return;
      }
  
      // Check file size (limit to 10MB per file)
      const overSizedFiles = newFiles.filter(
        (file) => file.size > 10 * 1024 * 1024
      );
      if (overSizedFiles.length > 0) {
        toast.error("Files must be smaller than 10MB");
        e.target.value = ""; // Reset file input
        return;
      }
  
      // Process images if needed
      const processedFiles = await Promise.all(
        newFiles.map(async (file) => {
          if (file.type.startsWith('image/')) {
            return compressImageIfNeeded(file);
          }
          return file;
        })
      );
  
      setAttachments((prev) => [...prev, ...processedFiles]);
    }
  
    e.target.value = ""; // Reset file input to allow re-selection of the same file
  }, [attachments, compressImageIfNeeded]);

  // Remove an attachment before sending
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() && attachments.length === 0) return;

    const newMessageId = uuidv4();
    const newMessage: Message = {
      id: newMessageId,
      name: session?.user?.name || "Guest",
      role: session?.user?.role || "GUEST",
      message: input,
      sentAt: new Date().toISOString(),
      avatar: session?.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name || "Guest"}`,
    };

    if (attachments.length === 0) {
      setMessages((prev) => [...prev, newMessage]);
    }

    // Clear input immediately for better UX
    setInput("");

    // Handle file uploads if any
    if (attachments.length > 0) {
      setIsUploading(true);

      try {
        const formData = new FormData();
        attachments.forEach((file) => {
          formData.append("files", file);
          // Initialize progress for this file
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: 0,
          }));
        });
        formData.append("messageId", newMessageId);

        // Create custom axios request with progress tracking
        const uploadResponse = await axios.post("/api/chat/upload", formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );

              // Update progress for all files (simple approach)
              setUploadProgress((prev) => {
                const newProgress = { ...prev };
                attachments.forEach((file) => {
                  newProgress[file.name] = percentCompleted;
                });
                return newProgress;
              });
            }
          },
        });

        // Handle upload response
        const uploadResult = uploadResponse.data;
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
  }, [input, attachments, session?.user]);

  // Replace the existing formatMessageWithMentions function with this:
  const formatMessageWithMentions = useCallback((text: string) => {
    return <span>{text}</span>;
  }, []);

  // Handle message edit
  const startEditingMessage = useCallback((message: Message) => {
    setEditingMessage(message.id);
    setEditText(message.message || "");
  }, []);

  // Save edited message
  const saveEditedMessage = useCallback(async () => {
    if (!editingMessage) return;

    try {
      const response = await fetch("/api/chat/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: editingMessage,
          newText: editText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to edit message");
      }

      // Update message locally
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessage
            ? { ...msg, message: editText, edited: true }
            : msg
        )
      );

      // Clear editing state
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Failed to edit message");
    }
  }, [editingMessage, editText]);

  // Delete/unsend message
  const deleteMessage = useCallback((messageId: string) => {
    setMessageToDelete(messageId);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteMessage = useCallback(async () => {
    if (!messageToDelete) return;

    try {
      const response = await fetch("/api/chat/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: messageToDelete }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      // Remove message locally
      setMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete));
      messageIdsRef.current.delete(messageToDelete);

      // Show success toast
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      // Reset state
      setMessageToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [messageToDelete]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingMessage(null);
    setEditText("");
  }, []);

  // Group messages by date for better visual organization
  const getMessageDate = useCallback((date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  }, []);

  // Function to open image viewer
  const openImageViewer = useCallback((url: string, filename: string) => {
    setCurrentImage({ url, filename, senderName: "" });
    setImageViewerOpen(true);
    setImageViewerZoom(1);
    setImageRotation(0);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] overflow-hidden">
      {/* Users sidebar */}
      <div
        className={cn(
          "border-r bg-card flex flex-col transition-all duration-300 relative h-full", // Added h-full to ensure full height
          "hidden md:flex", // Hide on mobile, show on md screens and up
          sidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-6 rounded-md border shadow-md hidden md:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <>
          <div className="flex flex-col p-4 border-b h-[60px] flex-shrink-0">
          <div className="flex items-center justify-center">
            <h2 className="font-semibold text-lg">Team Members</h2>
          </div>
        </div>
        <div className="mt-2 py-1 relative px-4 flex-shrink-0">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        </>
        )}

        {/* Sidebar content */}
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center pt-2 space-y-4 overflow-y-auto p-2 h-[calc(100%-20px)]">
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
          <ScrollArea className="flex-1 h-[calc(100%-120px)]">
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

              <TabsContent value="online" className="mt-0 h-[calc(100vh-220px)]">
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

              <TabsContent value="all" className="mt-0 h-[calc(100vh-220px)]">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden border-0 rounded-none shadow-none">
          <CardHeader className="px-4 flex flex-row items-center justify-center border-b bg-card h-[36px] z-10">
            <div>
              <CardTitle className="text-lg">Chat Room</CardTitle>
              <CardDescription className="flex items-center gap-2 justify-center">
                <span className="bg-green-500 rounded-full h-2 w-2"></span>
                {
                  onlineUsersList.filter(
                    (user) => user.id !== session?.user?.id
                  ).length
                }{" "}
                online
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
          <CardContent className="flex-1 p-0 relative flex flex-col overflow-hidden">
            {/* Standard scrollable messages list */}
            <div
              ref={messageContainerRef}
              className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-muted/50 scrollbar-track-transparent hover:scrollbar-thumb-muted/70 px-6 relative"
            >
              {isLoadingMore && (
                <div className="flex justify-center p-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading older messages...</span>
                  </div>
                </div>
              )}

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="bg-primary/5 p-4 rounded-full mb-4 border border-primary/10">
                    <MessageCircle className="h-12 w-12 text-primary/40" />
                  </div>
                  <h3 className="font-medium">No messages yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start the conversation by sending a message
                  </p>
                </div>
              ) : (
                <div className="">
                  {messages.map((message, index) => (
                    <MessageItem
                      key={`${message.id}-${index}`}
                      message={message}
                      index={index}
                      messages={messages}
                      session={{
                        user: session?.user
                          ? {
                              id: session.user.id,
                              name: session.user.name || "",
                              role: session.user.role,
                            }
                          : undefined,
                      }}
                      onDelete={deleteMessage}
                      onEdit={startEditingMessage}
                      onImageView={openImageViewer}
                      onDownload={(url, filename) => handleDownload(url, filename, message.name)}
                      formatMessageWithMentions={formatMessageWithMentions}
                      getMessageDate={getMessageDate}
                    />
                  ))}
                </div>
              )}

              {/* End of messages marker */}
              <div ref={messageEndRef} />

              {/* Unread messages indicator */}
              {unreadCount > 0 && (
                <div className="sticky bottom-4 w-full flex justify-center pointer-events-none z-20">
                  <Button
                    onClick={scrollToBottom}
                    className="rounded-full bg-primary shadow-lg pointer-events-auto flex items-center gap-1 h-9 animate-pulse"
                    size="sm"
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span>{unreadCount} new message{unreadCount !== 1 ? "s" : ""}</span>
                  </Button>
                </div>
              )}
              
              {/* Jump to bottom button - appears when scrolled up */}
              {isScrolling && unreadCount === 0 && (
                <div className="fixed bottom-35 right-20 z-20 animate-fade-in">
                  <Button
                    onClick={scrollToBottom}
                    size="icon"
                    className="h-10 w-10 rounded-full shadow-lg bg-primary/90 hover:bg-primary"
                    title="Jump to bottom"
                  >
                    <ChevronsDown className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Ensures the input area is displayed at the bottom */}
            <div className="p-2">
              {/* File attachments preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-1">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="bg-background rounded-md border px-3 py-1 flex items-center gap-2 group relative"
                    >
                      {file.type.startsWith("image/") ? (
                        <div className="w-6 h-6 relative">
                          <NextImage
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 object-cover rounded"
                          />
                        </div>
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="max-w-[180px]">
                        <div className="text-xs font-medium truncate">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatFileSize(file.size)}
                        </div>
                      </div>

                      {/* Progress bar for upload */}
                      {isUploading && (
                        <UploadProgressBar progress={uploadProgress[file.name] || 0} />
                      )}

                      {/* Remove attachment button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAttachment(index)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground rounded-full ml-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input area with buttons */}
              <div className="relative flex items-center">
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={handleInputChange}
                  className="pr-24 py-6 shadow-sm border-muted rounded-full"
                  disabled={isUploading || !!editingMessage}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-background/50 backdrop-blur-sm px-1 py-1 rounded-full">
                  {/* Emoji button */}
                  <div className="relative" ref={emojiRef}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-primary hover:text-primary/80"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Add emoji"
                    >
                      <SmilePlus className="h-5 w-5" />
                    </Button>

                    {showEmojiPicker && (
                      <div className="absolute right-0 w-64 bottom-12 mb-2 shadow-lg rounded-lg border bg-background p-3 z-30">
                        {/* Improved emoji picker with categories */}
                        <div className="mb-2 pb-2 border-b flex justify-between items-center">
                          <span className="text-xs font-medium">Quick Emojis</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setShowEmojiPicker(false)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-8 gap-2">
                          {["😊", "😂", "😍", "🥰", "😘", "😎", "🙄", "😏", "🤔", "🤨", "😮", "😢",
                            "😭", "😡", "🥳", "🎉", "👍", "👎", "👏", "🙏", "❤️", "🔥", "✅", "❌",
                            "⭐", "💯", "🚀", "💪"].map(
                              (emoji) => (
                                <button
                                  key={emoji}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-md transition-colors text-lg"
                                  onClick={() => {
                                    setInput((prev) => prev + emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                >
                                  {emoji}
                                </button>
                              )
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attachment button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary hover:text-primary/80"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach files"
                    disabled={attachments.length >= 3 || isUploading}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  />

                  {/* Send button with more visibility */}
                  <Button
                    size="icon"
                    variant="default"
                    className="h-8 w-8 rounded-full ml-1 bg-primary hover:bg-primary/90"
                    onClick={sendMessage}
                    disabled={(!input.trim() && attachments.length === 0) || isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Message editing overlay - Make it more visible and better positioned */}
            {editingMessage && (
              <div className="absolute bottom-[80px] left-0 right-0 border-t bg-background p-4 flex flex-col space-y-3 shadow-lg z-20">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm">Edit message</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    className="h-8 px-2"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1"
                    placeholder="Edit your message..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        saveEditedMessage();
                      } else if (e.key === "Escape") {
                        cancelEditing();
                      }
                    }}
                  />
                  <Button
                    onClick={saveEditedMessage}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Image Viewer Dialog */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
      <DialogContent className="sm:max-w-[80vw] max-h-[90vh] flex flex-col p-0 gap-0 border-none bg-background/70 backdrop-blur-xl hide-default-close-btn">
          <div className="p-4 flex items-center border-b">
            <DialogTitle className="text-sm flex-1 truncate">
              {currentImage?.filename}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setImageViewerZoom((prev) => Math.max(0.5, prev - 0.1))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setImageViewerZoom((prev) => Math.min(3, prev + 0.1))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => currentImage && handleDownload(currentImage.url, currentImage.filename, currentImage.senderName)}
              >
                <Download className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setImageViewerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
            <div
              className="overflow-auto max-w-full max-h-full flex items-center justify-center"
              style={{
                transform: `scale(${imageViewerZoom}) rotate(${imageRotation}deg)`,
                transition: "transform 0.2s ease",
              }}
            >
              {currentImage && (
                <NextImage
                  src={currentImage.url}
                  alt={currentImage.filename}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  unoptimized={true} // For external images
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete message confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMessage}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:block w-72 border-r p-4 flex-shrink-0">
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <Card className={`max-w-[70%] ${i % 2 === 0 ? 'bg-primary/10' : ''}`}>
                      <CardHeader className="p-3">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-12 w-full" />
                      </CardHeader>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t p-4">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}