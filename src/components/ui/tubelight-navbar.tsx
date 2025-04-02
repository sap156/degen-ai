
"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
}

export const NavBar = ({ items }: NavBarProps) => {
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  return (
    <nav className="relative flex space-x-1">
      {items.map((item, index) => {
        const isActive = activeItem === index;
        const isHovered = hoveredItem === index;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onMouseEnter={() => setHoveredItem(index)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => setActiveItem(index)}
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden lg:inline">{item.label}</span>
            {(isActive || isHovered) && (
              <motion.div
                layoutId="tubelight"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
