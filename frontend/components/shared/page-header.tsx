import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  actionClassName?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
  titleClassName,
  subtitleClassName,
  actionClassName,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 mb-6 border-b border-element",
        className
      )}
    >
      <div>
        <h1 className={cn("text-2xl font-bold text-text", titleClassName)}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn("mt-1 text-sm text-textSecondary", subtitleClassName)}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className={cn("mt-4 sm:mt-0", actionClassName)}>{action}</div>
      )}
    </div>
  );
}