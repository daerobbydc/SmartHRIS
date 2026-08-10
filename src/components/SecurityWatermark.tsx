"use client";

import { useSession } from "next-auth/react";
import { ShieldAlert } from "lucide-react";

interface SecurityWatermarkProps {
  documentTitle?: string;
  className?: string;
}

export function SecurityWatermark({ documentTitle, className = "" }: SecurityWatermarkProps) {
  const { data: session } = useSession();

  const userName = session?.user?.name || "Confidential Viewer";
  const userEmail = session?.user?.email || "internal@smarthris.com";
  const userRole = session?.user?.role || "EMPLOYEE";
  const timestamp = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const watermarkText = `CONFIDENTIAL • ${userName} (${userEmail}) • ${userRole} • ${timestamp} • DO NOT COPY`;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 overflow-hidden select-none opacity-20 ${className}`}
      aria-hidden="true"
    >
      {/* Repeating Diagonal Watermark Grid */}
      <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 gap-16 p-8 transform -rotate-12 scale-110">
        {Array.from({ length: 12 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-center text-center space-y-1 py-6"
          >
            <div className="flex items-center gap-1.5 text-gray-900 font-extrabold text-xs uppercase tracking-widest">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>SmartHRIS Security Protection</span>
            </div>
            <p className="text-[11px] font-mono text-gray-800 font-bold max-w-[220px] leading-tight">
              {watermarkText}
            </p>
            {documentTitle && (
              <p className="text-[10px] text-gray-700 italic">
                Doc: {documentTitle}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
