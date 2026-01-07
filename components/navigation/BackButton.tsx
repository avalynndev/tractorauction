"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BackButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}

export default function BackButton({ 
  href, 
  label = "Back", 
  onClick,
  className = "" 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const buttonClasses = `inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 ${className}`;

  if (href && !onClick) {
    return (
      <Link href={href} className={buttonClasses}>
        <ArrowLeft className="w-5 h-5" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={buttonClasses}>
      <ArrowLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}
























