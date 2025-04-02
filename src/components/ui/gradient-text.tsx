"use client"
import React from "react";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function GradientText({
  children,
  className = "",
  as: Component = "span",
}: GradientTextProps) {
  return (
    <Component
      className={cn(
        "bg-gradient-to-r from-pink-500 via-red-500 to-green-500 bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </Component>
  );
}
