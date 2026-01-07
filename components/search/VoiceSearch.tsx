"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import toast from "react-hot-toast";

interface VoiceSearchProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceSearch({ onTranscript, disabled = false }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (typeof navigator !== "undefined" && navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ 
            name: "microphone" as PermissionName 
          }).catch(() => null);
          
          if (permissionStatus) {
            if (permissionStatus.state === "granted") {
              setPermissionDenied(false);
            } else if (permissionStatus.state === "denied") {
              setPermissionDenied(true);
            }
            
            // Listen for permission changes
            permissionStatus.onchange = () => {
              if (permissionStatus.state === "granted") {
                setPermissionDenied(false);
              } else if (permissionStatus.state === "denied") {
                setPermissionDenied(true);
              }
            };
          }
        } catch (e) {
          // Permission API not supported, continue
        }
      }
    };
    
    checkPermission();
  }, []);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN"; // Indian English

        recognition.onstart = () => {
          setIsListening(true);
          setPermissionDenied(false); // Reset permission denied state when recognition starts successfully
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onTranscript(transcript);
          setIsListening(false);
          setPermissionDenied(false); // Reset permission denied state on successful recognition
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          const error = event.error;
          
          // Handle different error types gracefully
          switch (error) {
            case "not-allowed":
              // Microphone permission denied - check if it's actually denied or just needs user interaction
              setPermissionDenied(true);
              // Only show error if permission is actually denied (not just not yet granted)
              // The browser will prompt the user automatically on first use
              // Only show toast if user has explicitly denied it
              const checkPermission = async () => {
                try {
                  if (navigator.permissions) {
                    const permStatus = await navigator.permissions.query({ 
                      name: "microphone" as PermissionName 
                    }).catch(() => null);
                    if (permStatus && permStatus.state === "denied") {
                      toast.error(
                        "Microphone permission denied. Click the lock icon (🔒) in your browser's address bar to enable microphone access.",
                        {
                          duration: 6000,
                          icon: "🎤",
                        }
                      );
                    }
                    // If state is "prompt", browser will show permission dialog automatically
                  }
                } catch (e) {
                  // Permission API not fully supported, show generic message
                  toast.error(
                    "Microphone access required. Please allow microphone permission when prompted.",
                    {
                      duration: 5000,
                      icon: "🎤",
                    }
                  );
                }
              };
              checkPermission();
              break;
            case "no-speech":
              // No speech detected - user might not have spoken, don't log as error
              toast.error("No speech detected. Please try again.", {
                duration: 3000,
              });
              break;
            case "audio-capture":
              // No microphone found
              toast.error("No microphone found. Please connect a microphone.", {
                duration: 5000,
              });
              break;
            case "network":
              // Network error
              toast.error("Network error. Please check your connection.", {
                duration: 3000,
              });
              break;
            case "aborted":
              // Recognition was aborted - this is usually intentional, don't log
              // Just silently stop listening
              break;
            default:
              // Only log unexpected errors to console
              if (process.env.NODE_ENV === "development") {
                console.warn("Speech recognition error:", error);
              }
              toast.error("Speech recognition error. Please try again.", {
                duration: 3000,
              });
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [onTranscript]);

  const startListening = async () => {
    if (recognitionRef.current && !isListening && !disabled) {
      try {
        // Check microphone permission before starting (if supported)
        if (typeof navigator !== "undefined" && navigator.permissions) {
          try {
            // Try to query microphone permission (may not be supported in all browsers)
            const permissionStatus = await navigator.permissions.query({ 
              name: "microphone" as PermissionName 
            }).catch(() => null);
            
            if (permissionStatus) {
              if (permissionStatus.state === "denied") {
                setPermissionDenied(true);
                toast.error(
                  "Microphone permission denied. Click the lock icon (🔒) in your browser's address bar, select 'Allow' for microphone, then refresh the page.",
                  {
                    duration: 7000,
                    icon: "🎤",
                  }
                );
                return;
              } else if (permissionStatus.state === "granted") {
                // Permission is granted, reset the denied state
                setPermissionDenied(false);
              }
              
              // Listen for permission changes
              permissionStatus.onchange = () => {
                if (permissionStatus.state === "granted") {
                  setPermissionDenied(false);
                } else if (permissionStatus.state === "denied") {
                  setPermissionDenied(true);
                }
              };
            }
          } catch (permError) {
            // Permission API might not be supported or "microphone" not recognized
            // Continue anyway - the recognition.onerror will handle it
          }
        }
        
        recognitionRef.current.start();
      } catch (error: any) {
        // Handle specific errors
        if (error.name === "NotAllowedError" || error.message?.includes("not allowed")) {
          setPermissionDenied(true);
          toast.error(
            "Microphone access required. Click the lock icon (🔒) in your browser's address bar to enable microphone permissions.",
            {
              duration: 6000,
              icon: "🎤",
            }
          );
        } else if (error.name === "NotFoundError") {
          toast.error("No microphone found. Please connect a microphone.", {
            duration: 5000,
          });
        } else {
          // Only log unexpected errors in development
          if (process.env.NODE_ENV === "development") {
            console.warn("Error starting speech recognition:", error);
          }
          toast.error("Unable to start voice search. Please try again.", {
            duration: 3000,
          });
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled || permissionDenied}
      className={`p-2.5 sm:p-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center touch-manipulation ${
        isListening
          ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 animate-pulse"
          : permissionDenied
          ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
          : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      title={
        permissionDenied
          ? "Microphone permission denied. Click the lock icon in your browser to enable it."
          : isListening
          ? "Click to stop listening"
          : "Click to speak and search"
      }
    >
      {isListening ? (
        <>
          <MicOff className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
          <span className="hidden sm:inline text-sm sm:text-base">Stop</span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
          <span className="hidden sm:inline text-sm sm:text-base">Voice</span>
        </>
      )}
    </button>
  );
}


