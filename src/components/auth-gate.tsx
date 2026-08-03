"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { AuthModal } from "@/components/auth-modal";
import { Loader2, Shield } from "lucide-react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const showAuth = status === "unauthenticated" || (!session && status !== "loading");

  useEffect(() => {
    // no-op; auth state is derived directly from useSession
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="size-14 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md mx-auto mb-4">
            <Shield className="size-7" />
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading TechUs…
          </div>
        </div>
      </div>
    );
  }

  if (showAuth) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 p-4">
          <div className="text-center max-w-md">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg mx-auto mb-6">
              <Shield className="size-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">TechUs</h1>
            <p className="text-slate-600 mb-1">QA Reporting System</p>
            <p className="text-xs text-slate-400 mb-8">
              Production-grade test tracking for Hidayah Connect & TeachUs
            </p>
            <a
              href="/api/auth/signin"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-8 py-3 rounded-lg shadow-sm transition"
            >
              Sign in to continue
            </a>
          </div>
        </div>
        {showAuth && <AuthModal onClose={() => {}} />}
      </>
    );
  }

  return <>{children}</>;
}
