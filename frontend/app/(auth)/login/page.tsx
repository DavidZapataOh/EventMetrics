"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/lib/hooks/use-auth";
import Image from "next/image";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.svg" alt="Logo" width={48} height={48} />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
            EventMetrics
          </h1>
          <h2 className="mt-2 text-xl font-semibold text-text">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-textSecondary">
            Access your event metrics and analytics
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md border border-element">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}