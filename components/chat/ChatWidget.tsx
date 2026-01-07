"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Minimize2, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    profilePhoto?: string | null;
    role: string;
  };
}

interface ChatWidgetProps {
  userId?: string;
  userToken?: string;
}

// Helper to get user ID from token
function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || null;
  } catch {
    return null;
  }
}

export default function ChatWidget({ userId, userToken }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Get token from localStorage if not provided
  useEffect(() => {
    // Token will be retrieved when needed
  }, [userToken, userId]);

  // Initialize Socket.io connection
  useEffect(() => {
    const token = userToken || localStorage.getItem("token") || sessionStorage.getItem("token");
    if (isOpen && token) {
      const socketUrl = typeof window !== "undefined" ? window.location.origin : "";
      const newSocket = io(socketUrl, {
        path: "/api/socket",
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        console.log("Chat connected");
        // Join chat room when connected
        if (chatId) {
          newSocket.emit("join-chat", chatId);
        }
      });

      newSocket.on("newMessage", (message: ChatMessage) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        scrollToBottom();
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
        toast.error("Connection error. Please refresh.");
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isOpen, userToken]);

  // Load messages when chat opens
  useEffect(() => {
    const token = userToken || localStorage.getItem("token") || sessionStorage.getItem("token");
    if (isOpen && token) {
      loadMessages();
    }
  }, [isOpen, userToken]);

  // Join chat room when chatId changes
  useEffect(() => {
    if (socket && socket.connected && chatId) {
      socket.emit("join-chat", chatId);
    }
  }, [chatId, socket]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    const token = userToken || localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      // First, get or create a chat
      if (!chatId) {
        // Get user's conversations to find active chat
        const convResponse = await fetch("/api/chat/conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (convResponse.ok) {
          const convData = await convResponse.json();
          const activeChat = convData.conversations.find(
            (c: any) => c.status === "OPEN"
          );

          if (activeChat) {
            setChatId(activeChat.id);
          }
        }
      }

      // Load messages if we have a chatId
      if (chatId) {
        const response = await fetch(`/api/chat/messages?chatId=${chatId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = userToken || localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!inputMessage.trim() || !token || sending) return;

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
          chatId: chatId || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (!chatId) {
          setChatId(data.chatId);
        }
        setMessages((prev) => [...prev, data.chatMessage]);
        setInputMessage("");
        
        // Join chat room and emit message via socket if connected
        if (socket && socket.connected) {
          socket.emit("join-chat", data.chatId);
          socket.emit("sendMessage", {
            chatId: data.chatId,
            message: data.chatMessage,
          });
        }
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

  const handleOpenChat = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Please login to use chat");
      return;
    }
    setIsOpen(true);
    setIsMinimized(false);
  };

  // Contact information
  const phoneNumber = "7801094747";
  const whatsappNumber = "7801094747";

  // WhatsApp SVG Icon Component
  const WhatsAppIcon = () => (
    <svg
      className="w-6 h-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Call button - on top */}
        <a
          href={`tel:+91${phoneNumber}`}
          className="bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition-all flex items-center justify-center group relative"
          aria-label="Call us"
          title="Call Us: 7801094747"
        >
          <Phone className="w-6 h-6" />
        </a>
        {/* WhatsApp button - below Call */}
        <a
          href={`https://wa.me/91${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white rounded-full p-4 shadow-lg hover:bg-green-600 transition-all flex items-center justify-center group relative"
          aria-label="WhatsApp us"
          title="WhatsApp Us: 7801094747"
        >
          <WhatsAppIcon />
        </a>
        {/* Chat button - at the bottom */}
        <button
          onClick={handleOpenChat}
          className="bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center group relative"
          aria-label="Open chat"
          title="Chat Now"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={chatContainerRef}
      className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 flex flex-col transition-all ${
        isMinimized ? "w-80 h-12" : "w-96 h-[600px]"
      }`}
    >
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">Chat with Us</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-primary-700 rounded p-1 transition-colors"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-primary-700 rounded p-1 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const token = userToken || localStorage.getItem("token") || sessionStorage.getItem("token");
                const currentUserId = token ? getUserIdFromToken(token) : null;
                const isOwnMessage = msg.sender.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        isOwnMessage
                          ? "bg-primary-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs font-semibold mb-1 opacity-75">
                          {msg.sender.fullName}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? "text-primary-100" : "text-gray-500"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Our support team will respond as soon as possible
            </p>
          </form>
        </>
      )}
    </div>
  );
}

