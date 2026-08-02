"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        toast({ title: "Account created!", description: "Please sign in with your credentials." });
        setMode("login");
        setPassword("");
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (result?.error) throw new Error("Invalid email or password");
        toast({ title: "Welcome back!", description: "Signed in successfully." });
        onClose();
        // Refresh the page to load session
        window.location.reload();
      }
    } catch (e: any) {
      toast({
        title: mode === "register" ? "Registration failed" : "Sign-in failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "admin" | "tester") => {
    if (role === "admin") {
      setEmail("admin@techus.app");
      setPassword("admin123");
    } else {
      setEmail("priya.n@hidayah.test");
      setPassword("tester123");
    }
    setMode("login");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-11 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                  <Shield className="size-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold leading-tight">TechUs</h1>
                  <p className="text-[11px] text-white/80 leading-tight">QA Reporting System</p>
                </div>
              </div>
              <p className="text-sm text-white/90 mt-3">
                {mode === "login"
                  ? "Sign in to track test execution, log bugs, and view audit trails."
                  : "Create your tester account to join the QA team."}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <div>
                  <Label className="text-xs font-medium text-slate-700">Full name</Label>
                  <div className="relative mt-1">
                    <UserIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aarav Sharma"
                      className="pl-9 h-10"
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs font-medium text-slate-700">Email</Label>
                <div className="relative mt-1">
                  <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@techus.app"
                    className="pl-9 h-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-700">Password</Label>
                <div className="relative mt-1">
                  <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Min 6 characters" : "Your password"}
                    className="pl-9 pr-10 h-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                {loading ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Please wait…</>
                ) : mode === "login" ? (
                  <>Sign in</>
                ) : (
                  <>Create account</>
                )}
              </Button>
            </form>

            <div className="text-center text-xs text-slate-500">
              {mode === "login" ? (
                <>
                  New to TechUs?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>

            {/* Demo credentials */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="size-3" />
                Demo accounts (click to fill)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fillDemo("admin")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-[11px]"
                >
                  <div className="font-semibold text-slate-700">Admin</div>
                  <div className="text-slate-500 text-[10px]">admin@techus.app</div>
                </button>
                <button
                  onClick={() => fillDemo("tester")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition text-[11px]"
                >
                  <div className="font-semibold text-slate-700">Tester</div>
                  <div className="text-slate-500 text-[10px]">priya.n@hidayah.test</div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
