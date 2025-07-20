"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Calendar, 
  BarChart2, 
  Users, 
  Settings, 
  LogOut, 
  Award,
  Wallet
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import Image from "next/image";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="w-5 h-5" />,
  },
  {
    title: "Events",
    href: "/events",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: <BarChart2 className="w-5 h-5" />,
    submenu: [
      {
        title: "General",
        href: "/analytics/overall",
      },
      {
        title: "Users",
        href: "/analytics/users",
      },
      {
        title: "Timeline",
        href: "/analytics/timeline",
      },
      {
        title: "Regions",
        href: "/analytics/regions",
      },
      {
        title: "Wallets",
        href: "/analytics/wallets",
      },
    ],
  },
  {
    title: "Users",
    href: "/users",
    icon: <Users className="w-5 h-5" />,
  },
  {
    title: "Certifications",
    href: "/certificates",
    icon: <Award className="w-5 h-5" />,
  },
  {
    title: "Wallets",
    href: "/wallets",
    icon: <Wallet className="w-5 h-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);
  const { logout } = useAuth();

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-element w-64">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Image src="/em.jpg" alt="Logo" width={48} height={48} className="rounded-full"/>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
            EventMetrics
          </h1>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.title}>
              {item.submenu ? (
                <div className="space-y-1">
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={cn(
                      "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? "bg-primary/20 text-primary"
                        : "text-textSecondary hover:bg-element hover:text-text"
                    )}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.title}</span>
                    <svg
                      className={cn(
                        "ml-auto h-4 w-4 transition-transform",
                        openSubmenu === item.title ? "rotate-180" : ""
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  
                  {openSubmenu === item.title && (
                    <ul className="pl-8 space-y-1">
                      {item.submenu.map((subitem) => (
                        <li key={subitem.title}>
                          <Link
                            href={subitem.href}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                              pathname === subitem.href
                                ? "bg-primary/20 text-primary"
                                : "text-textSecondary hover:bg-element hover:text-text"
                            )}
                          >
                          {subitem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? "bg-primary/20 text-primary"
                      : "text-textSecondary hover:bg-element hover:text-text"
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-element">
        <Link
          href="/profile"
          className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-textSecondary hover:bg-element hover:text-text cursor-pointer"
        >
          <Settings className="w-5 h-5 mr-3" />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => logout()}
          className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors text-textSecondary hover:bg-element hover:text-text cursor-pointer"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}