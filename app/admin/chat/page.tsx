"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, CheckCircle, XCircle, Clock, User } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    fullName: string;
    profilePhoto?: string | null;
    role: string;
  };
}

interface Conversation {
  id: string;
  status: string;
  lastMessageAt: string | null;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  user: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    profilePhoto?: string | null;
  };
  createdAt: string;
}

export default function AdminChatPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousMessagesLengthRef = useRef<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUserAndConversations(token);
    
    // Auto-refresh conversations every 5 seconds
    const interval = setInterval(() => {
      fetchConversations(token);
    }, 5000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router]);

  useEffect(() => {
    if (selectedChat) {
      const token = localStorage.getItem("token");
      if (token) {
        // Reset scroll state when selecting new chat
        setShouldAutoScroll(true);
        previousMessagesLengthRef.current = 0;
        fetchMessages(selectedChat, token);
        // Auto-refresh messages every 5 seconds (reduced frequency to prevent constant scrolling)
        const messageInterval = setInterval(() => {
          fetchMessages(selectedChat, token);
        }, 5000);

        return () => clearInterval(messageInterval);
      }
    } else {
      // Reset when no chat selected
      setMessages([]);
      setShouldAutoScroll(true);
      previousMessagesLengthRef.current = 0;
    }
  }, [selectedChat]);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. User hasn't manually scrolled up
    // 2. New messages were actually added (not just refreshed)
    // 3. Input field is not focused (user is not typing)
    const hasNewMessages = messages.length > previousMessagesLengthRef.current;
    const inputFocused = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
    
    if (shouldAutoScroll && hasNewMessages && messages.length > 0 && !inputFocused) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (shouldAutoScroll && !inputFocused) {
          scrollToBottom();
        }
      }, 150);
    }
    
    previousMessagesLengthRef.current = messages.length;
  }, [messages, shouldAutoScroll]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && shouldAutoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" }); // Changed to "auto" for instant scroll
    }
  };

  // Check if user is near bottom of messages
  const checkIfNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const container = messagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Consider "near bottom" if within 100px of bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
    return isNearBottom;
  };

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Debounce scroll checking
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        checkIfNearBottom();
      }, 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [selectedChat]);

  const fetchUserAndConversations = async (token: string) => {
    try {
      setLoading(true);

      // Check if user is admin
      const userResponse = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);

        if (userData.role !== "ADMIN") {
          toast.error("Access denied. Admin only.");
          router.push("/my-account");
          return;
        }

        await fetchConversations(token);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (token: string) => {
    try {
      const response = await fetch("/api/chat/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (chatId: string, token: string) => {
    try {
      const response = await fetch(`/api/chat/messages?chatId=${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        // Only update if messages actually changed (avoid unnecessary re-renders)
        setMessages((prevMessages) => {
          // Check if messages are different
          if (prevMessages.length !== newMessages.length) {
            return newMessages;
          }
          
          // Check if any message content changed
          const hasChanges = prevMessages.some((prev, index) => {
            const newMsg = newMessages[index];
            return !newMsg || prev.id !== newMsg.id || prev.message !== newMsg.message;
          });
          
          return hasChanges ? newMessages : prevMessages;
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChat || sending) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setSending(true);
    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          chatId: selectedChat,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, data.chatMessage]);
        setInputMessage("");
        setShouldAutoScroll(true); // Ensure we scroll after sending
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        await fetchConversations(token);
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleCloseChat = async (chatId: string, status: "CLOSED" | "RESOLVED") => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/chat/close", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId, status }),
      });

      if (response.ok) {
        toast.success(`Chat ${status.toLowerCase()} successfully`);
        await fetchConversations(token);
        if (selectedChat === chatId) {
          setSelectedChat(null);
          setMessages([]);
        }
      } else {
        toast.error("Failed to update chat status");
      }
    } catch (error) {
      console.error("Error closing chat:", error);
      toast.error("Failed to update chat status");
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedChat);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Chat Support</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Manage customer conversations
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <p className="text-sm text-gray-600 mt-1">
                {conversations.length} {conversations.length === 1 ? "conversation" : "conversations"}
              </p>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedChat(conv.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedChat === conv.id ? "bg-primary-50 border-l-4 border-primary-600" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {conv.user.profilePhoto ? (
                            <img
                              src={conv.user.profilePhoto}
                              alt={conv.user.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{conv.user.fullName}</p>
                            <p className="text-xs text-gray-500">{conv.user.phoneNumber}</p>
                          </div>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conv.lastMessage.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleString()
                            : "No messages"}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            conv.status === "OPEN"
                              ? "bg-green-100 text-green-800"
                              : conv.status === "CLOSED"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {conv.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-primary-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {selectedConversation.user.profilePhoto ? (
                        <img
                          src={selectedConversation.user.profilePhoto}
                          alt={selectedConversation.user.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.user.fullName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.user.phoneNumber}
                          {selectedConversation.user.email && ` • ${selectedConversation.user.email}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCloseChat(selectedConversation.id, "RESOLVED")}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Resolve</span>
                      </button>
                      <button
                        onClick={() => handleCloseChat(selectedConversation.id, "CLOSED")}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center space-x-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Close</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                >
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdminMessage = msg.sender.role === "ADMIN";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdminMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isAdminMessage
                                ? "bg-primary-600 text-white"
                                : "bg-white text-gray-800 border border-gray-200"
                            }`}
                          >
                            {!isAdminMessage && (
                              <p className="text-xs font-semibold mb-1 opacity-75">
                                {msg.sender.fullName}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isAdminMessage ? "text-primary-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || sending}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Send</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

