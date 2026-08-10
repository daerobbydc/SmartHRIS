"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
}

export function LoadingSpinner({ size = "medium" }: LoadingSpinnerProps) {
  const sizeStyles = {
    small: "h-5 w-5",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center py-12"
    >
      <Loader2 className={`${sizeStyles[size]} text-teal-600 animate-spin`} />
    </motion.div>
  );
}
