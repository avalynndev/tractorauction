"use client";

import Spinner from "./Spinner";

interface PageLoaderProps {
  text?: string;
  fullScreen?: boolean;
}

export default function PageLoader({ text = "Loading...", fullScreen = true }: PageLoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-4">
          <Spinner size="xl" />
          <p className="text-gray-600 font-medium">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </div>
  );
}





















