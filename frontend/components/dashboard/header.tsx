"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Search, User, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="bg-card border-b border-element sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center flex-1">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-textSecondary" />
            </div>
            <input
              type="text"
              className="bg-input border border-element text-text text-sm rounded-lg block w-full pl-10 p-2.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-text"
              placeholder="search events, event planners..."
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
          </Button>
          
          <div className="relative">
            <button 
              className="flex items-center space-x-3 focus:outline-none cursor-pointer"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-text">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-text">{user?.name || 'User'}</div>
                <div className="text-xs text-textSecondary">{user?.email || 'user@example.com'}</div>
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-element overflow-hidden z-20">
                <Link href="/profile">
                  <div className="block px-4 py-2 text-sm text-text hover:bg-element cursor-pointer">
                    Profile
                  </div>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-element cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}