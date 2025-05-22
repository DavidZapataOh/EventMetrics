import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  homeIcon?: React.ReactNode;
  showHome?: boolean;
}

export function Breadcrumbs({
  items,
  className,
  separator = "/",
  homeIcon,
  showHome = true,
}: BreadcrumbsProps) {
  const allItems = showHome
    ? [
        {
          label: "Home",
          href: "/",
          icon: homeIcon || (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
        },
        ...items,
      ]
    : items;

  return (
    <nav aria-label="Breadcrumbs" className={cn("flex", className)}>
      <ol className="flex items-center flex-wrap gap-1.5">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center text-sm"
            >
              {index > 0 && (
                <span className="mx-1.5 text-textSecondary">{separator}</span>
              )}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center text-primary hover:underline hover:text-primaryHover"
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center",
                    isLast ? "font-medium text-text" : "text-textSecondary"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}