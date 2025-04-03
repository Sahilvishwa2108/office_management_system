"use client";

import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import {
  Send,
  Paperclip,
  Image,
  FileText,
  Users,
  AtSign,
  X,
  SmilePlus,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [showUserList, setShowUserList] = useState(false);
  
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionStartPosition = useRef<number>(-1);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch chat history on load
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const data = await res.json();
          setMessages(data.reverse());
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
          const users = await res.json();
          setOnlineUsers(users);
          // Also set these as available mention users
          setMentionUsers(users);
        }
      } catch (error) {
        console.error("Failed to fetch online users:", error);
      }
    };
    
    fetchOnlineUsers();
    
    // Poll for online users every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

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
          
          // Check if it's a user status update
          if (data.type === "user_status") {
            setOnlineUsers(prev => {
              const updatedUsers = [...prev];
              const userIndex = updatedUsers.findIndex(u => u.id === data.userId);
              
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
                  isOnline: true
                });
              }
              
              return updatedUsers;
            });
            return;
          }
          
          // Regular chat message
          setMessages((prev) => {
            return prev.find((msg) => msg.id === data.id) ? prev : [...prev, data];
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
          body: JSON.stringify({ isOnline: true })
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
            body: JSON.stringify({ isOnline: false })
          });
        } catch (error) {
          console.error("Failed to update offline status:", error);
        }
      };
      
      sendOfflineStatus();
      eventSource.close();
    };
  }, []);

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
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || text[lastAtIndex - 1] === ' ')) {
      mentionStartPosition.current = lastAtIndex;
      const query = text.substring(lastAtIndex + 1);
      setMentionQuery(query);
      
      // Filter users based on the query
      const filteredUsers = onlineUsers.filter(user => 
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
      const afterMention = input.substring(mentionStartPosition.current + mentionQuery.length + 1);
      
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
      const overSizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (overSizedFiles.length > 0) {
        toast.error("Files must be smaller than 10MB");
        return;
      }
      
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  // Remove an attachment before sending
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
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
        attachments.forEach(file => {
          formData.append('files', file);
        });
        formData.append('messageId', newMessageId);
        
        // Upload files
        const uploadResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload files');
        }
        
        const uploadResult = await uploadResponse.json();
        newMessage.attachments = uploadResult.attachments;
        
        setAttachments([]);
      } catch (error) {
        console.error('❌ Error uploading files:', error);
        toast.error('Failed to upload files');
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
      if (part.startsWith('@')) {
        const username = part.substring(1);
        const mentionedUser = onlineUsers.find(
          user => user.name.toLowerCase() === username.toLowerCase()
        );
        
        if (mentionedUser) {
          return (
            <span key={index} className="bg-primary/10 text-primary rounded px-1 font-medium">
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] rounded-md border">
      {/* Header */}
      <div className="border-b p-4 flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-xl">Office Chat</h1>
          <p className="text-sm text-muted-foreground">
            Team communication channel
          </p>
        </div>
        <Dialog open={showUserList} onOpenChange={setShowUserList}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => setShowUserList(true)}>
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Online Users</span>
              <Badge variant="secondary" className="ml-2">
                {onlineUsers.filter(u => u.isOnline).length}
              </Badge>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Team Members</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="space-y-4">
                {onlineUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    {user.isOnline ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Online
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Last seen {user.lastSeen ? format(new Date(user.lastSeen), 'h:mm a') : 'recently'}
                      </span>
                    )}
                  </div>
                ))}
                {onlineUsers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No users online
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
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
            messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  message.name === session?.user?.name
                    ? "ml-auto flex-row-reverse"
                    : ""
                )}
              >
                {message.name !== session?.user?.name && (
                  <Avatar className="h-8 w-8">
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
                    "rounded-lg p-3 min-w-[120px]",
                    message.name === session?.user?.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="flex gap-2 items-center mb-1">
                    <p className="text-sm font-medium truncate">
                      {message.name === session?.user?.name ? "You" : message.name}
                    </p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <time className="text-xs opacity-70">
                            {format(new Date(message.sentAt), "h:mm a")}
                          </time>
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(message.sentAt), "PPP p")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {message.message && (
                    <p className="whitespace-pre-wrap break-words">
                      {formatMessageWithMentions(message.message)}
                    </p>
                  )}
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map(attachment => (
                        <div key={attachment.id} className="rounded border overflow-hidden">
                          {attachment.type === 'image' ? (
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
                              />
                            </a>
                          ) : (
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 flex items-center gap-2 hover:bg-muted/60"
                            >
                              <FileText className="h-5 w-5" />
                              <div className="overflow-hidden">
                                <p className="truncate text-sm">{attachment.filename}</p>
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
            ))
          )}
          <div ref={messageEndRef} />
        </div>
      </ScrollArea>

      {/* Mention list */}
      {showMentions && (
        <div className="absolute bottom-24 left-4 bg-background shadow-lg rounded-lg border p-1 max-h-48 overflow-auto z-10">
          {mentionUsers.length > 0 ? (
            mentionUsers.map(user => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-start gap-2 px-2 py-1.5"
                onClick={() => selectMention(user)}
              >
                <Badge className={`${user.isOnline ? "bg-green-500" : "bg-gray-400"} text-xs h-5 w-5 p-0`} variant="secondary">&nbsp;</Badge>
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
        <div className="px-4 pt-4 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div 
              key={index} 
              className="rounded-lg border p-2 flex items-center gap-2 group relative"
            >
              {file.type.startsWith('image/') ? (
                <Image className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <div className="overflow-hidden">
                <p className="truncate max-w-28 text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
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
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2 items-center"
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="shrink-0"
              >
                <SmilePlus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0">
              <div className="grid grid-cols-8 gap-2 p-3">
                {["😀", "😂", "🙂", "😍", "😎", "🤔", "👍", "👎", "👏", "🙏", 
                  "🔥", "❤️", "⭐", "✅", "⚠️", "❌", "💯", "🎉", "👀", "💪", 
                  "🤝", "👋", "👨‍💻", "📊", "🗓️", "📝", "📞", "💼", "🏢", "⏰", 
                  "🚀", "💡"].map(emoji => (
                  <Button 
                    key={emoji} 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={() => setInput(prev => prev + emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

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

          <div className="relative flex-1">
            <Input
              placeholder="Type a message... (Use @ to mention)"
              value={input}
              onChange={handleInputChange}
              disabled={isUploading}
              className="pr-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            {mentionQuery && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <AtSign className="h-4 w-4" />
              </span>
            )}
          </div>

          <Button 
            type="submit" 
            size="icon" 
            className="shrink-0"
            disabled={(!input.trim() && attachments.length === 0) || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}