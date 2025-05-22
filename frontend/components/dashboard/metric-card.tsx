import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  color?: "primary" | "secondary" | "accent" | "success" | "error" | "warning";
}

export function MetricCard({
  title,
  value,
  icon,
  description,
  change,
  className,
  color = "primary",
}: MetricCardProps) {
  const colors = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent bg-accent/10",
    success: "text-success bg-success/10",
    error: "text-error bg-error/10",
    warning: "text-warning bg-warning/10",
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-textSecondary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-text">{value}</div>
            {description && <p className="text-xs text-textSecondary mt-1">{description}</p>}
            {change && (
              <div
                className={cn(
                  "flex items-center mt-2 text-xs font-medium",
                  change.isPositive ? "text-success" : "text-error"
                )}
              >
                <span className={change.isPositive ? "text-success" : "text-error"}>
                  {change.isPositive ? "↑" : "↓"} {Math.abs(change.value)}%
                </span>
                <span className="ml-1 text-textSecondary">from the last period</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", colors[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}