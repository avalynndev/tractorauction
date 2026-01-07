"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, Search, Gavel, CheckCircle, Play, Pause, SkipForward, SkipBack, RotateCcw, Volume2, VolumeX } from "lucide-react";
import PencilArtAnimation from "./PencilArtAnimation";

interface TutorialStep {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  step: string;
  animation: string;
  duration: number;
  audioScript: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    icon: UserPlus,
    title: "Register as Buyer or Seller or a Dealer",
    description: "Create an account with quick verification process. Choose your role and complete your profile with all necessary details.",
    step: "01",
    animation: "register",
    duration: 8000,
    audioScript: "First, Register as Buyer or Seller or a Dealer, that means, Create an account with quick verification process. Choose your role and complete your profile with all necessary details.",
  },
  {
    icon: Search,
    title: "Browse Auctions",
    description: "Explore live and upcoming auctions across multiple locations. View detailed vehicle information, photos, and specifications.",
    step: "02",
    animation: "browse",
    duration: 8000,
    audioScript: "Second, Browse Auctions, that means, Explore live and upcoming auctions across multiple locations. View detailed vehicle information, photos, and specifications.",
  },
  {
    icon: Gavel,
    title: "Place Your Bids",
    description: "Bid on vehicles through our secure and dedicated tractor auction online platform. Real-time updates keep you informed.",
    step: "03",
    animation: "bid",
    duration: 8000,
    audioScript: "Third, Place Your Bids, that means, Bid on vehicles through our secure and dedicated tractor auction online platform. Real-time updates keep you informed.",
  },
  {
    icon: CheckCircle,
    title: "Complete Documentation and Take Delivery",
    description: "Complete documentation and take delivery of your vehicle and you will be the highest bidder subject seller approval and other terms and conditions. Our team assists with all legal and transfer processes.",
    step: "04",
    animation: "win",
    duration: 10000,
    audioScript: "And Finally Fourth one is, Complete documentation and take delivery of your vehicle and you will be the highest bidder subject seller approval and other terms and conditions. Our team assists with all legal and transfer processes.",
  },
];

export default function AnimatedTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentStepData = tutorialSteps[currentStep];

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      
      // Load voices (some browsers need this)
      const loadVoices = () => {
        if (speechSynthesisRef.current) {
          speechSynthesisRef.current.getVoices();
        }
      };
      
      loadVoices();
      if (speechSynthesisRef.current.onvoiceschanged !== undefined) {
        speechSynthesisRef.current.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Function to speak text
  const speakText = (text: string) => {
    if (!isAudioEnabled || !speechSynthesisRef.current) return;

    // Cancel any ongoing speech
    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-IN"; // Indian English accent

    // Try to use a preferred voice
    const getVoices = () => {
      if (!speechSynthesisRef.current) return [];
      return speechSynthesisRef.current.getVoices();
    };

    const voices = getVoices();
    const preferredVoice = voices.find(
      (voice) =>
        voice.name.includes("Female") ||
        voice.name.includes("Zira") ||
        voice.name.includes("Neural") ||
        (voice.lang.startsWith("en") && !voice.name.includes("Male"))
    ) || voices.find((voice) => voice.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    currentUtteranceRef.current = utterance;
    speechSynthesisRef.current.speak(utterance);
  };

  // Speak when step changes
  useEffect(() => {
    if (isPlaying && isAudioEnabled && speechSynthesisRef.current) {
      const step = tutorialSteps[currentStep];
      const textToSpeak = step.audioScript || `${step.title}. ${step.description}`;
      
      // Small delay to ensure smooth transition
      const timeoutId = setTimeout(() => {
        speakText(textToSpeak);
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
          speechSynthesisRef.current.cancel();
        }
      };
    }
  }, [currentStep, isPlaying, isAudioEnabled]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && isAutoPlay) {
      // Update progress bar
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / (currentStepData.duration / 100));
          if (newProgress >= 100) {
            return 100;
          }
          return newProgress;
        });
      }, 100);

      // Move to next step after duration
      intervalRef.current = setTimeout(() => {
        setProgress(0);
        if (currentStep < tutorialSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          setIsPlaying(false);
          setIsAutoPlay(false);
        }
      }, currentStepData.duration);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentStep, isAutoPlay, currentStepData.duration]);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsAutoPlay(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setIsAutoPlay(false);
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(0);
      if (isPlaying) {
        handlePause();
        setTimeout(() => handlePlay(), 100);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress(0);
      if (isPlaying) {
        handlePause();
        setTimeout(() => handlePlay(), 100);
      }
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(false);
    setIsAutoPlay(false);
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    // Stop any ongoing speech
    if (speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
  };

  const handleAudioToggle = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // Stop speech if disabling
    if (isAudioEnabled && speechSynthesisRef.current && speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel();
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setProgress(0);
    if (isPlaying) {
      handlePause();
      setTimeout(() => handlePlay(), 100);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Video Player Container */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Video Display Area */}
        <div className="relative bg-gradient-to-br from-amber-50 via-white to-amber-50 h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
          {/* Paper Texture Background */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='paper' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='25' cy='25' r='1' fill='%23000' opacity='0.1'/%3E%3Ccircle cx='75' cy='75' r='1' fill='%23000' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23paper)'/%3E%3C/svg%3E")`,
          }} />

          {/* Pencil Art Animation */}
          <PencilArtAnimation animationType={currentStepData.animation as "register" | "browse" | "bid" | "win"} isPlaying={isPlaying} />

          {/* Step Icon Animation */}
          <div className="relative z-10">
            <div className="relative">
              {/* Icon Container with Animation */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto mb-6 relative">
                {/* Icon Circle */}
                <div className="relative w-full h-full bg-amber-100/80 backdrop-blur-sm rounded-full flex items-center justify-center border-3 border-amber-300 shadow-lg">
                  <currentStepData.icon className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-amber-800" />
                </div>

                {/* Step Number Badge */}
                <div className="absolute -top-2 -right-2 bg-amber-600 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center text-base sm:text-lg md:text-xl font-bold shadow-md border-2 border-white">
                  {currentStepData.step}
                </div>
              </div>

              {/* Title Animation */}
              <div className="text-center px-4 bg-white/90 backdrop-blur-sm rounded-lg py-4 shadow-lg border-2 border-amber-200">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 animate-fade-in">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-700 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
            {tutorialSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "bg-amber-600 w-8"
                    : index < currentStep
                    ? "bg-amber-400 w-6"
                    : "bg-amber-200 w-2"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Video Controls */}
        <div className="bg-gray-800 px-4 sm:px-6 py-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-100 ease-linear relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Play/Pause Button */}
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-1" />
                )}
              </button>

              {/* Previous Button */}
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous step"
              >
                <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={currentStep === tutorialSteps.length - 1}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next step"
              >
                <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Restart Button */}
              <button
                onClick={handleRestart}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-all duration-200"
                aria-label="Restart tutorial"
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Audio Toggle Button */}
              <button
                onClick={handleAudioToggle}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isAudioEnabled
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
                aria-label={isAudioEnabled ? "Disable audio" : "Enable audio"}
                title={isAudioEnabled ? "Audio On" : "Audio Off"}
              >
                {isAudioEnabled ? (
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            </div>

            {/* Step Counter */}
            <div className="text-white text-sm sm:text-base">
              <span className="font-semibold">{currentStep + 1}</span>
              <span className="text-gray-400"> / </span>
              <span className="text-gray-400">{tutorialSteps.length}</span>
            </div>
          </div>

          {/* Step Navigation Pills */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {tutorialSteps.map((step, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  index === currentStep
                    ? "bg-primary-600 text-white shadow-lg scale-105"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Step {step.step}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

