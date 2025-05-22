import React from "react";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;  
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("flex items-start", className)}>
      <div className="flex-1">
        <p className="text-sm font-medium text-textSecondary">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-text">{value}</h3>
        {description && (
          <p className="text-xs text-textSecondary mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={cn(
              "flex items-center mt-2 text-xs font-medium",
              trend.isPositive ? "text-success" : "text-error"
            )}
          >
            <span
              className={cn(
                "mr-1",
                trend.isPositive ? "rotate-0" : "rotate-180"
              )}
            >
              ↑
            </span>
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <div
        className={cn(
          "p-3 rounded-lg",
          "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </div>
    </Card>
  );
}