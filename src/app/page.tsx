"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Globe,
  UserPlus,
  GraduationCap,
  BookOpen,
  Shield,
  LifeBuoy,
  ListChecks,
  Bug as BugIcon,
  BarChart3,
  Database,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  SkipForward,
  CircleDashed,
  ExternalLink,
  Calendar,
  User,
  Users,
  Activity,
  Target,
  PieChart as PieChartIcon,
  FileBarChart,
  Crown,
  Mail,
  GitBranch,
  Route,
  Bell,
  ScrollText,
  FileCheck,
  Pencil,
  Trash2,
  Copy,
  Code,
  Wrench,
  PlayCircle,
  UserCog,
  Paperclip,
  Upload,
  Mic,
  Video,
  Square,
  Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
  LineChart, Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  STATUS_META, PRIORITY_META, CATEGORY_META, BUG_SEVERITY_META, BUG_STATUS_META,
  type TestCase, type Bug, type ModuleStat, type TesterStat, type TestStatus, type Priority, type Category, type BugSeverity, type BugStatus,
} from "@/lib/testing-types";
import {
  useTesterStore, testerColor, initials,
  type CurrentTester,
} from "@/lib/tester-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { AuthGate } from "@/components/auth-gate";

const TESTER_ROLE_META: Record<string, { label: string; icon: typeof Crown }> = {
  lead:      { label: "QA Lead",     icon: Crown },
  admin:     { label: "Admin",       icon: Shield },
  tester:    { label: "Tester",      icon: User },
  developer: { label: "Developer",  icon: Code },
};

type ViewKey = "dashboard" | "test_cases" | "bugs" | "my_bugs" | "users" | "testers" | "audit" | "requirements" | "modules" | "reports";

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean; developerOnly?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "test_cases", label: "Test Cases", icon: ListChecks },
  { key: "bugs",       label: "Bug Tracker", icon: BugIcon },
  { key: "my_bugs",    label: "My Bugs",     icon: Wrench, developerOnly: true },
  { key: "users",      label: "User Management", icon: UserCog, adminOnly: true },
  { key: "testers",    label: "Testers",     icon: Users },
  { key: "audit",      label: "Audit Log",   icon: ScrollText, adminOnly: true },
  { key: "requirements", label: "Requirements", icon: FileCheck },
  { key: "modules",    label: "Module Reports", icon: BarChart3 },
  { key: "reports",    label: "Reports",     icon: FileBarChart },
];

const MODULE_ICONS: Record<string, typeof Globe> = {
  Globe, UserPlus, LayoutDashboard, GraduationCap, BookOpen, Shield, LifeBuoy, Users, GitBranch, Route, Bell,
};

const STATUS_COLORS_PIE: Record<TestStatus, string> = {
  pass: "#10b981",
  fail: "#f43f5e",
  blocked: "#f59e0b",
  skipped: "#0ea5e9",
  not_run: "#94a3b8",
};

export default function HomePage() {
  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  );
}

function AppContent() {
  const { data: session } = useSession();
  const [view, setView] = useState<ViewKey>("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [testers, setTesters] = useState<TesterStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [crudState, setCrudState] = useState<{ action: "create" | "edit" | "clone" | "delete" | null; testCase: TestCase | null }>({ action: null, testCase: null });
  const { toast } = useToast();
  const currentTester = useTesterStore((s) => s.currentTester);
  const setCurrentTester = useTesterStore((s) => s.setCurrentTester);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      toast({ title: "Failed to load stats", variant: "destructive" });
    }
  }, [toast]);

  const refreshTesters = useCallback(async () => {
    try {
      const res = await fetch("/api/testers");
      const data = await res.json();
      setTesters(data.testers);
    } catch (e) {
      toast({ title: "Failed to load testers", variant: "destructive" });
    }
  }, [toast]);

  const refreshTestCases = useCallback(async (filters?: Record<string, string>) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters || {});
      const res = await fetch(`/api/test-cases?${params.toString()}`);
      const data = await res.json();
      setTestCases(data.testCases);
    } catch (e) {
      toast({ title: "Failed to load test cases", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refreshBugs = useCallback(async (filters?: Record<string, string>) => {
    try {
      const params = new URLSearchParams(filters || {});
      const res = await fetch(`/api/bugs?${params.toString()}`);
      const data = await res.json();
      setBugs(data.bugs);
    } catch (e) {
      toast({ title: "Failed to load bugs", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    refreshStats();
    refreshTestCases();
    refreshBugs();
    refreshTesters();
  }, [refreshStats, refreshTestCases, refreshBugs, refreshTesters]);

  // Auto-set current tester from session user
  useEffect(() => {
    if (session?.user && !currentTester) {
      const u = session.user as any;
      // Find the tester matching this user
      const matching = testers.find((t) => t.email === u.email || t.name === u.name);
      if (matching) {
        setCurrentTester({
          id: matching.id,
          name: matching.name,
          role: matching.role,
          color: matching.color,
        });
      }
    }
  }, [session, testers, currentTester, setCurrentTester]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        testers={testers}
        currentTester={currentTester}
        onPickTester={setCurrentTester}
        onAddTester={async (name, role, color) => {
          try {
            const res = await fetch("/api/testers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, role, color }),
            });
            const data = await res.json();
            toast({ title: "Tester added", description: name });
            refreshTesters();
            refreshStats();
            if (data.tester) {
              setCurrentTester({
                id: data.tester.id,
                name: data.tester.name,
                role: data.tester.role,
                color: data.tester.color,
              });
            }
          } catch (e) {
            toast({ title: "Failed to add tester", variant: "destructive" });
          }
        }}
      />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar view={view} onViewChange={setView} stats={stats} userRole={(session?.user as any)?.role} />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {view === "dashboard" && (
                <DashboardView stats={stats} onNavigate={setView} />
              )}
              {view === "test_cases" && (
                <TestCasesView
                  testCases={testCases}
                  testers={testers}
                  currentTester={currentTester}
                  loading={loading}
                  userRole={(session?.user as any)?.role}
                  onCrudTestCase={(action, tc) => {
                    setCrudState({ action, testCase: tc ?? null });
                  }}
                  onRefresh={refreshTestCases}
                  onUpdateStatus={async (id, status, notes, testerName) => {
                    try {
                      await fetch("/api/test-cases", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id, status, notes, testerName,
                          testerId: currentTester?.id,
                          createExecution: true,
                        }),
                      });
                      toast({ title: "Test case updated", description: `Status: ${STATUS_META[status].label}${currentTester ? ` · by ${currentTester.name}` : ""}` });
                      refreshTestCases();
                      refreshStats();
                      refreshTesters();
                    } catch (e) {
                      toast({ title: "Update failed", variant: "destructive" });
                    }
                  }}
                  onReportBug={async (bugData) => {
                    try {
                      await fetch("/api/bugs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...bugData,
                          reporter: currentTester?.name ?? bugData.reporter,
                          reporterId: currentTester?.id ?? null,
                        }),
                      });
                      toast({ title: "Bug reported", description: bugData.title });
                      refreshBugs();
                      refreshStats();
                      refreshTesters();
                    } catch (e) {
                      toast({ title: "Bug creation failed", variant: "destructive" });
                    }
                  }}
                />
              )}
              {view === "bugs" && (
                <BugsView
                  bugs={bugs}
                  testers={testers}
                  currentTester={currentTester}
                  onRefresh={refreshBugs}
                  onUpdateBug={async (id, updates) => {
                    try {
                      await fetch("/api/bugs", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, ...updates }),
                      });
                      toast({ title: "Bug updated" });
                      refreshBugs();
                      refreshStats();
                      refreshTesters();
                    } catch (e) {
                      toast({ title: "Update failed", variant: "destructive" });
                    }
                  }}
                  onCreateBug={async (bugData) => {
                    try {
                      await fetch("/api/bugs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...bugData,
                          reporter: currentTester?.name ?? bugData.reporter,
                          reporterId: currentTester?.id ?? null,
                        }),
                      });
                      toast({ title: "Bug created" });
                      refreshBugs();
                      refreshStats();
                      refreshTesters();
                    } catch (e) {
                      toast({ title: "Creation failed", variant: "destructive" });
                    }
                  }}
                />
              )}
              {view === "testers" && (
                <TestersView
                  testers={testers}
                  onRefresh={refreshTesters}
                  onPickTester={(t) => {
                    setCurrentTester({ id: t.id, name: t.name, role: t.role, color: t.color });
                    toast({ title: `Switched to ${t.name}`, description: "All new executions and bugs will be attributed to this tester" });
                  }}
                  onToggleActive={async (id, active) => {
                    try {
                      await fetch("/api/testers", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, active }),
                      });
                      toast({ title: `Tester ${active ? "activated" : "deactivated"}` });
                      refreshTesters();
                      refreshStats();
                    } catch (e) {
                      toast({ title: "Update failed", variant: "destructive" });
                    }
                  }}
                />
              )}
              {view === "modules" && <ModulesView stats={stats} onNavigate={setView} />}
              {view === "audit" && <AuditLogView userRole={(session?.user as any)?.role} />}
              {view === "requirements" && <RequirementsView />}
              {view === "my_bugs" && <MyBugsView session={session} />}
              {view === "users" && <UserManagementView session={session} />}
              {view === "reports" && <ReportsView stats={stats} testCases={testCases} bugs={bugs} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Footer />
      <Toaster />
      {crudState.action && (
        <TestCaseCrudDialog
          action={crudState.action}
          testCase={crudState.testCase}
          testers={testers}
          onClose={() => setCrudState({ action: null, testCase: null })}
          onSuccess={() => {
            refreshTestCases();
            refreshStats();
            setCrudState({ action: null, testCase: null });
          }}
        />
      )}
    </div>
  );
}

/* ---------------- Header ---------------- */
function Header({
  testers, currentTester, onPickTester, onAddTester,
}: {
  testers: TesterStat[];
  currentTester: CurrentTester | null;
  onPickTester: (t: CurrentTester) => void;
  onAddTester: (name: string, role: string, color: string) => void;
}) {
  const [showAddTester, setShowAddTester] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("tester");
  const [newColor, setNewColor] = useState("emerald");

  const colorOptions = ["emerald", "violet", "amber", "sky", "rose", "teal"];

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
            <Shield className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              TechUs <span className="text-emerald-600 font-semibold">QA</span>
            </h1>
            <p className="text-[11px] text-slate-500 leading-tight">Hidayah Connect × TeachUs — Reporting</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Tester selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 px-2">
                {currentTester ? (
                  <>
                    <Avatar className="size-6">
                      <AvatarFallback className={`text-[10px] font-bold bg-gradient-to-br ${testerColor(currentTester.color).gradient} text-white`}>
                        {initials(currentTester.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium hidden sm:inline">{currentTester.name}</span>
                    <ChevronDown className="size-3.5 text-slate-400" />
                  </>
                ) : (
                  <>
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px] bg-slate-100 text-slate-500">
                        <User className="size-3.5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-slate-500 hidden sm:inline">Select tester</span>
                    <ChevronDown className="size-3.5 text-slate-400" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-[11px] uppercase text-slate-500">
                Switch active tester
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {testers.length === 0 && (
                <div className="px-2 py-3 text-xs text-slate-400 text-center">
                  No testers yet. Add one below.
                </div>
              )}
              {testers.map((t) => {
                const isActive = currentTester?.id === t.id;
                const colorCls = testerColor(t.color);
                const RoleIcon = TESTER_ROLE_META[t.role]?.icon ?? User;
                return (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => onPickTester({ id: t.id, name: t.name, role: t.role, color: t.color })}
                    className="gap-2 py-2"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className={`text-[10px] font-bold bg-gradient-to-br ${colorCls.gradient} text-white`}>
                        {initials(t.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-900 flex items-center gap-1.5">
                        {t.name}
                        {!t.active && (
                          <span className="text-[9px] text-slate-400 bg-slate-100 rounded px-1">inactive</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <RoleIcon className="size-2.5" />
                        {TESTER_ROLE_META[t.role]?.label ?? "Tester"}
                        <span>·</span>
                        <span>{t.stats.totalExecutions} runs</span>
                      </div>
                    </div>
                    {isActive && <CheckCircle2 className="size-4 text-emerald-600" />}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowAddTester(true)}
                className="gap-2 text-emerald-700"
              >
                <Plus className="size-4" />
                <span className="text-xs font-medium">Add new tester…</span>
              </DropdownMenuItem>
              {currentTester && (
                <DropdownMenuItem
                  onClick={() => onPickTester(null as any)}
                  className="gap-2 text-slate-500"
                >
                  <X className="size-4" />
                  <span className="text-xs">Clear current tester</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge variant="outline" className="hidden sm:flex border-emerald-200 bg-emerald-50 text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Live
          </Badge>
          <Badge variant="outline" className="hidden md:flex text-slate-600">
            <Calendar className="size-3 mr-1" />
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </Badge>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>

      {/* Add Tester Dialog */}
      {showAddTester && (
        <Dialog open onOpenChange={(o) => !o && setShowAddTester(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add new tester</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Full name *</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tester">Tester</SelectItem>
                    <SelectItem value="lead">QA Lead</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Color (avatar)</Label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`size-8 rounded-full bg-gradient-to-br ${testerColor(c).gradient} flex items-center justify-center transition-all ${
                        newColor === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""
                      }`}
                    >
                      {newColor === c && <CheckCircle2 className="size-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddTester(false)}>Cancel</Button>
              <Button
                disabled={!newName}
                onClick={() => {
                  onAddTester(newName, newRole, newColor);
                  setNewName("");
                  setShowAddTester(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="size-3.5 mr-1" /> Add tester
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </header>
  );
}

/* ---------------- Notification Bell ---------------- */
function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const doRefresh = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (!mounted) return;
        setNotifications(data.notifications || []);
        setUnread(data.unreadCount || 0);
      } catch {}
    };
    doRefresh();
    const i = setInterval(doRefresh, 30000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 w-9 p-0 relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-700">
            Notifications {unread > 0 && <span className="text-rose-600">({unread} new)</span>}
          </span>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              <Bell className="size-6 mx-auto mb-2 text-slate-300" />
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 border-b border-slate-50 text-xs ${!n.read ? "bg-emerald-50/50" : ""}`}
              >
                <div className="font-medium text-slate-900">{n.title}</div>
                {n.body && <div className="text-slate-600 mt-0.5">{n.body}</div>}
                <div className="text-[10px] text-slate-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------- User Menu ---------------- */
function UserMenu() {
  const { data: session } = useSession();
  if (!session?.user) return null;
  const user = session.user as any;
  const name = user.name || user.email || "User";
  const role = user.role || "tester";
  const RoleIcon = TESTER_ROLE_META[role]?.icon ?? User;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-slate-600 to-slate-800 text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="size-3 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarFallback className="text-[11px] font-bold bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-900 truncate">{name}</div>
              <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500">
            <RoleIcon className="size-2.5" />
            {TESTER_ROLE_META[role]?.label ?? role}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="gap-2 text-rose-600"
        >
          <XCircle className="size-4" />
          <span className="text-xs font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({
  view, onViewChange, stats, userRole,
}: { view: ViewKey; onViewChange: (v: ViewKey) => void; stats: any; userRole?: string }) {
  const counts = stats?.summary;
  const isAdmin = userRole === "admin" || userRole === "lead";
  const isDeveloper = userRole === "developer";
  return (
    <aside className="md:w-60 lg:w-64 border-b md:border-b-0 md:border-r bg-white shrink-0">
      <nav className="flex md:flex-col gap-1 p-3 overflow-x-auto md:overflow-y-auto md:h-[calc(100vh-4rem)] md:sticky md:top-16">
        {NAV_ITEMS.filter((item) => {
          if (item.adminOnly && !isAdmin) return false;
          if (item.developerOnly && !isDeveloper) return false;
          return true;
        }).map((item) => {
          const Icon = item.icon;
          const isActive = view === item.key;
          const count =
            item.key === "test_cases" ? counts?.totalTestCases :
            item.key === "bugs" ? counts?.openBugs :
            item.key === "testers" ? counts?.totalTesters :
            item.key === "modules" ? stats?.moduleStats?.length :
            null;
          return (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {count != null && (
                <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <Separator className="hidden md:block my-3" />
        <div className="hidden md:block p-3 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="size-3.5 text-slate-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Coverage</span>
          </div>
          {counts && (
            <>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-2xl font-bold text-slate-900">{counts.overallCoverage}%</span>
                <span className="text-[11px] text-slate-500">{counts.totalTestCases} tests</span>
              </div>
              <Progress value={counts.overallCoverage} className="h-1.5" />
              <div className="grid grid-cols-2 gap-1 mt-2 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="size-3" />{counts.passCount} pass</span>
                <span className="flex items-center gap-1 text-rose-600"><XCircle className="size-3" />{counts.failCount} fail</span>
              </div>
            </>
          )}
        </div>
      </nav>
    </aside>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="mt-auto border-t bg-white px-4 md:px-6 py-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <span>© {new Date().getFullYear()} Hidayah Connect & TeachUs — Internal QA Tool</span>
        <span className="flex items-center gap-1.5">
          <Database className="size-3" /> SQLite · Local persistence
        </span>
      </div>
    </footer>
  );
}

/* ---------------- Dashboard View ---------------- */
function DashboardView({ stats, onNavigate }: { stats: any; onNavigate: (v: ViewKey) => void }) {
  if (!stats) return <LoadingSkeleton />;
  const s = stats.summary;

  const pieData = [
    { name: "Pass", value: s.passCount, color: STATUS_COLORS_PIE.pass },
    { name: "Fail", value: s.failCount, color: STATUS_COLORS_PIE.fail },
    { name: "Blocked", value: s.blockedCount, color: STATUS_COLORS_PIE.blocked },
    { name: "Skipped", value: s.skippedCount, color: STATUS_COLORS_PIE.skipped },
    { name: "Not Run", value: s.notRunCount, color: STATUS_COLORS_PIE.not_run },
  ].filter((d) => d.value > 0);

  const moduleChart = stats.moduleStats.map((m: ModuleStat) => ({
    name: m.name.length > 18 ? m.name.slice(0, 16) + "…" : m.name,
    Pass: m.pass,
    Fail: m.fail,
    Blocked: m.blocked,
    NotRun: m.notRun,
  }));

  return (
    <div className="space-y-5">
      {/* Hero KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Total Test Cases"
          value={s.totalTestCases}
          icon={ListChecks}
          accent="slate"
          subtitle={`Across ${stats.moduleStats?.length ?? 12} modules`}
        />
        <KpiCard
          title="Passed"
          value={s.passCount}
          icon={CheckCircle2}
          accent="emerald"
          subtitle={`${s.overallPassRate}% pass rate`}
        />
        <KpiCard
          title="Failed"
          value={s.failCount}
          icon={XCircle}
          accent="rose"
          subtitle="Needs attention"
        />
        <KpiCard
          title="Open Bugs"
          value={s.openBugs}
          icon={BugIcon}
          accent="amber"
          subtitle={`${s.criticalBugs} critical`}
        />
        <KpiCard
          title="Coverage"
          value={`${s.overallCoverage}%`}
          icon={Target}
          accent="teal"
          subtitle={`${s.totalTestCases - s.notRunCount} of ${s.totalTestCases} executed`}
        />
        <KpiCard
          title="Decisions Needed"
          value={s.decisionsNeeded ?? 0}
          icon={AlertTriangle}
          accent="amber"
          subtitle="Pending founder confirm"
        />
      </div>

      {/* Decisions Needed banner (only shown if there are pending decisions) */}
      {s.decisionsNeeded > 0 && (
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="size-9 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">
                {s.decisionsNeeded} Product Decision{s.decisionsNeeded === 1 ? "" : "s"} Pending Founder Confirmation
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Per Sec 11.12 of the spec, five refund-policy numbers were never defined anywhere else and need founder confirmation before public launch: (1) Student cancellation cutoff — proposed 24h, (2) Refund decision timeline — proposed 5 business days, (3) Refund request window — proposed 7 days, (4) Demo class refund treatment — proposed no cash refund, (5) Recording Pass refund — proposed non-refundable once billing month started.
              </p>
              <p className="text-[11px] text-amber-700 mt-2">
                Go to <strong>Test Cases</strong> → click the amber <strong>Decisions Needed</strong> toggle to filter these items.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-slate-500" />
              Module-wise Test Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={moduleChart} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Pass" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Fail" stackId="a" fill="#f43f5e" />
                <Bar dataKey="Blocked" stackId="a" fill="#f59e0b" />
                <Bar dataKey="NotRun" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="size-4 text-slate-500" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Module cards */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Module Overview</CardTitle>
              <CardDescription className="text-xs">Test progress across all 7 modules</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => onNavigate("modules")}>
              View details <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.moduleStats.map((m: ModuleStat) => {
              const Icon = MODULE_ICONS[m.icon] ?? Globe;
              return (
                <button
                  key={m.id}
                  onClick={() => onNavigate("modules")}
                  className="text-left rounded-lg border border-slate-200 bg-white p-3 hover:shadow-md hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="size-9 rounded-md bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0">
                      <Icon className="size-4.5 text-emerald-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{m.name}</p>
                      <p className="text-[11px] text-slate-500">{m.total} test cases</p>
                    </div>
                  </div>
                  <Progress value={m.coverage} className="h-1.5 mb-2" />
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{m.coverage}% coverage</span>
                    <div className="flex gap-2">
                      <span className="text-emerald-600 font-medium">{m.pass} pass</span>
                      {m.fail > 0 && <span className="text-rose-600 font-medium">{m.fail} fail</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category & Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Test Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.categoryStats} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} width={75} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="pass" stackId="a" fill="#10b981" name="Pass" />
                <Bar dataKey="fail" stackId="a" fill="#f43f5e" name="Fail" />
                <Bar dataKey="blocked" stackId="a" fill="#f59e0b" name="Blocked" />
                <Bar dataKey="notRun" stackId="a" fill="#94a3b8" name="Not Run" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">By Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.priorityStats} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="pass" stackId="a" fill="#10b981" name="Pass" />
                <Bar dataKey="fail" stackId="a" fill="#f43f5e" name="Fail" />
                <Bar dataKey="blocked" stackId="a" fill="#f59e0b" name="Blocked" />
                <Bar dataKey="notRun" stackId="a" fill="#94a3b8" name="Not Run" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Team Activity */}
      <ActivityFeed />
    </div>
  );
}

/* ---------------- Activity Feed (Dashboard Widget) ---------------- */
function ActivityFeed() {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/activity");
        const data = await res.json();
        if (!mounted) return;
        setActivity(data.activity || []);
      } catch {}
      if (mounted) setLoading(false);
    };
    load();
  }, []);

  const actionIcon = (action: string): typeof ListChecks => {
    if (action.startsWith("test_case")) return ListChecks;
    if (action.startsWith("bug")) return BugIcon;
    if (action.startsWith("auth")) return User;
    if (action.startsWith("tester")) return Users;
    if (action.startsWith("test_run")) return Route;
    return Activity;
  };

  const actionColor = (action: string): string => {
    if (action.includes("create") || action.includes("execute")) return "text-emerald-600 bg-emerald-50";
    if (action.includes("update") || action.includes("assign")) return "text-sky-600 bg-sky-50";
    if (action.includes("delete")) return "text-rose-600 bg-rose-50";
    if (action.includes("clone")) return "text-violet-600 bg-violet-50";
    if (action.startsWith("auth")) return "text-amber-600 bg-amber-50";
    return "text-slate-600 bg-slate-50";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4 text-slate-500" />
              Recent Team Activity
            </CardTitle>
            <CardDescription className="text-xs">Last 20 actions across the QA team</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="size-8 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center text-sm text-slate-400 py-8">
            <Activity className="size-6 mx-auto mb-2 text-slate-300" />
            No recent activity. Start testing to see actions here.
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {activity.map((a) => {
              const Icon = actionIcon(a.action);
              const color = actionColor(a.action);
              return (
                <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-900">
                      <span className="font-medium">{a.userName}</span>
                      <span className="text-slate-500"> · {a.action.replace(/_/g, " ")}</span>
                    </div>
                    {a.details && (
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{a.details}</div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KpiCard({
  title, value, icon: Icon, accent, subtitle,
}: {
  title: string;
  value: string | number;
  icon: typeof ListChecks;
  accent: "slate" | "emerald" | "rose" | "amber" | "teal";
  subtitle?: string;
}) {
  const accentClasses = {
    slate: "from-slate-100 to-slate-200 text-slate-700",
    emerald: "from-emerald-100 to-teal-100 text-emerald-700",
    rose: "from-rose-100 to-pink-100 text-rose-700",
    amber: "from-amber-100 to-orange-100 text-amber-700",
    teal: "from-teal-100 to-cyan-100 text-teal-700",
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide truncate">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 leading-tight">{value}</p>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className={`size-9 rounded-lg bg-gradient-to-br ${accentClasses[accent]} flex items-center justify-center shrink-0`}>
            <Icon className="size-4.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3.5">
              <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-7 w-16 bg-slate-200 rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
    </div>
  );
}

/* ---------------- Test Cases View ---------------- */
function TestCasesView({
  testCases, testers, currentTester, loading, onRefresh, onUpdateStatus, onReportBug, userRole, onCrudTestCase,
}: {
  testCases: TestCase[];
  testers: TesterStat[];
  currentTester: CurrentTester | null;
  loading: boolean;
  onRefresh: (filters?: Record<string, string>) => void;
  onUpdateStatus: (id: string, status: TestStatus, notes: string, testerName: string) => void;
  onReportBug: (bug: any) => void;
  userRole?: string;
  onCrudTestCase?: (action: "create" | "edit" | "clone" | "delete", tc?: TestCase) => void;
}) {
  const isAdmin = userRole === "admin" || userRole === "lead";
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedTc, setSelectedTc] = useState<TestCase | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      onRefresh({ ...filters, search });
    }, 250);
    return () => clearTimeout(t);
  }, [filters, search, onRefresh]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Test Cases</h2>
          <p className="text-sm text-slate-500">
            {testCases.length} cases · click any row to execute
            {currentTester && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <span className={`size-1.5 rounded-full ${testerColor(currentTester.color).dot}`} />
                  All new runs attributed to {currentTester.name}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search title, description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-full md:w-64 h-9"
            />
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="size-3.5 mr-1" />
            Filters
            <ChevronDown className={`size-3.5 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </Button>
          {isAdmin && onCrudTestCase && (
            <Button
              size="sm"
              onClick={() => onCrudTestCase("create")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="size-3.5 mr-1" />
              New Test Case
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <FilterSelect
                label="Module"
                value={filters.moduleId || "all"}
                onChange={(v) => setFilters((f) => ({ ...f, moduleId: v }))}
                options={[
                  { value: "all", label: "All modules" },
                  { value: "landing", label: "Landing Page" },
                  { value: "teacher_reg", label: "Teacher Registration" },
                  { value: "teacher_dashboard", label: "Teacher Dashboard" },
                  { value: "course_wizard", label: "Course Wizard" },
                  { value: "student_dashboard", label: "Student Dashboard" },
                  { value: "admin_dashboard", label: "Admin Dashboard" },
                  { value: "support_ticketing", label: "Support & Ticketing" },
                  { value: "refund_escrow", label: "Refund & Escrow" },
                  { value: "parent_journey", label: "Parent Journey" },
                  { value: "conditional_edge_cases", label: "Conditional & Edge" },
                  { value: "worked_scenarios", label: "Worked Scenarios (E2E)" },
                  { value: "notifications_matrix", label: "Notifications" },
                ]}
              />
              <FilterSelect
                label="Status"
                value={filters.status || "all"}
                onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "not_run", label: "Not Run" },
                  { value: "pass", label: "Pass" },
                  { value: "fail", label: "Fail" },
                  { value: "blocked", label: "Blocked" },
                  { value: "skipped", label: "Skipped" },
                ]}
              />
              <FilterSelect
                label="Priority"
                value={filters.priority || "all"}
                onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
                options={[
                  { value: "all", label: "All priorities" },
                  { value: "critical", label: "Critical" },
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]}
              />
              <FilterSelect
                label="Category"
                value={filters.category || "all"}
                onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
                options={[
                  { value: "all", label: "All categories" },
                  { value: "functional", label: "Functional" },
                  { value: "ui", label: "UI" },
                  { value: "integration", label: "Integration" },
                  { value: "security", label: "Security" },
                  { value: "payment", label: "Payment" },
                ]}
              />
              <FilterSelect
                label="Tester"
                value={filters.testerId || "all"}
                onChange={(v) => setFilters((f) => ({ ...f, testerId: v }))}
                options={[
                  { value: "all", label: "Any tester" },
                  { value: "none", label: "Never executed" },
                  { value: "any", label: "Executed by anyone" },
                  ...testers.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <Button
                size="sm"
                variant={filters.decisionNeeded === "true" ? "default" : "outline"}
                onClick={() => setFilters((f) => {
                  const next = { ...f };
                  if (next.decisionNeeded === "true") {
                    delete next.decisionNeeded;
                  } else {
                    next.decisionNeeded = "true";
                  }
                  return next;
                })}
                className={filters.decisionNeeded === "true" ? "bg-amber-500 hover:bg-amber-600 text-white" : "border-amber-300 text-amber-700 hover:bg-amber-50"}
              >
                <AlertTriangle className="size-3.5 mr-1.5" />
                Decisions Needed
                {filters.decisionNeeded === "true" && (
                  <X className="size-3 ml-1.5" />
                )}
              </Button>
              <span className="text-[11px] text-slate-500">
                {filters.decisionNeeded === "true"
                  ? "Showing only items pending founder/product decision (per Sec 11.12)"
                  : "5 refund-policy items need founder confirmation before launch — click to filter"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-18rem)]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[38%]">Test Case</TableHead>
                  <TableHead>Module / Suite</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Last Tester</TableHead>
                  <TableHead className="text-right">Bugs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && testCases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      No test cases match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && testCases.slice(0, 200).map((tc) => {
                  const lastExec = tc.executions[0];
                  const lastTester = lastExec?.tester ?? null;
                  return (
                    <TableRow
                      key={tc.id}
                      onClick={() => setSelectedTc(tc)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <TableCell>
                        <div className="flex items-start gap-1.5">
                          {tc.decisionNeeded && (
                            <span className="inline-flex items-center gap-0.5 shrink-0 mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-300" title={`Pending founder decision — ${tc.specReference ?? "see spec"}`}>
                              <AlertTriangle className="size-2.5" />
                              Decision
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 text-sm line-clamp-1">{tc.title}</div>
                            {tc.description && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{tc.description}</div>
                            )}
                            {tc.specReference && (
                              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{tc.specReference}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-700 font-medium">{tc.suite.module.name}</div>
                        <div className="text-[10px] text-slate-500">{tc.suite.name}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tc.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={tc.priority} />
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={tc.category} />
                      </TableCell>
                      <TableCell>
                        {lastTester ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="size-5">
                              <AvatarFallback className={`text-[9px] font-bold bg-gradient-to-br ${testerColor(lastTester.color).gradient} text-white`}>
                                {initials(lastTester.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-slate-600 truncate max-w-20">{lastTester.name}</span>
                          </div>
                        ) : lastExec?.executedBy ? (
                          <span className="text-[11px] text-slate-500 italic">{lastExec.executedBy}</span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {tc.bugs.length > 0 ? (
                          <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">
                            <BugIcon className="size-3 mr-1" />{tc.bugs.length}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {testCases.length > 200 && (
              <div className="text-center text-xs text-slate-500 py-3 border-t">
                Showing first 200 of {testCases.length} matches — refine filters to narrow further
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedTc && (
        <TestCaseDetailDialog
          tc={selectedTc}
          currentTester={currentTester}
          onClose={() => setSelectedTc(null)}
          onUpdateStatus={onUpdateStatus}
          onReportBug={onReportBug}
          userRole={userRole}
          onCrudTestCase={onCrudTestCase}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="text-[10px] font-medium uppercase tracking-wide text-slate-500 mb-1">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StatusBadge({ status }: { status: TestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.text}`}>
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  const meta = CATEGORY_META[category];
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}

/* ---------------- Test Case Detail Dialog ---------------- */
function TestCaseDetailDialog({
  tc, currentTester, onClose, onUpdateStatus, onReportBug, userRole, onCrudTestCase,
}: {
  tc: TestCase;
  currentTester: CurrentTester | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: TestStatus, notes: string, testerName: string) => void;
  onReportBug: (bug: any) => void;
  userRole?: string;
  onCrudTestCase?: (action: "create" | "edit" | "clone" | "delete", tc?: TestCase) => void;
}) {
  const isAdmin = userRole === "admin" || userRole === "lead";
  const [status, setStatus] = useState<TestStatus>(tc.status);
  const [notes, setNotes] = useState(tc.notes || "");
  // Prefill tester name from currentTester (priority) or existing testerName
  const [testerName, setTesterName] = useState(
    currentTester?.name ?? tc.testerName ?? ""
  );
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugSeverity, setBugSeverity] = useState<BugSeverity>("major");

  const handleSave = () => {
    const finalName = currentTester?.name ?? testerName;
    onUpdateStatus(tc.id, status, notes, finalName);
    onClose();
  };

  const handleReportBug = () => {
    if (!bugTitle) return;
    onReportBug({
      title: bugTitle,
      description: bugDescription,
      severity: bugSeverity,
      priority: tc.priority,
      moduleName: tc.suite.module.name,
      testCaseId: tc.id,
      stepsToRepro: tc.steps || "",
      expected: tc.expected || "",
      actual: "",
      reporter: currentTester?.name ?? testerName,
    });
    setShowBugForm(false);
    setBugTitle("");
    setBugDescription("");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{tc.suite.module.name}</Badge>
            <Badge variant="outline" className="text-[10px]">{tc.suite.name}</Badge>
            <CategoryBadge category={tc.category} />
            <PriorityBadge priority={tc.priority} />
            {tc.decisionNeeded && (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="size-3" />
                Decision Needed
              </span>
            )}
            {tc.specReference && (
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                {tc.specReference}
              </span>
            )}
          </div>
          <DialogTitle className="text-base flex items-start justify-between gap-3">
            <span>{tc.title}</span>
            {isAdmin && onCrudTestCase && (
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-sky-700 hover:bg-sky-50"
                  onClick={() => { onClose(); onCrudTestCase("edit", tc); }}
                  title="Edit this test case"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-violet-700 hover:bg-violet-50"
                  onClick={() => { onClose(); onCrudTestCase("clone", tc); }}
                  title="Clone this test case"
                >
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-rose-700 hover:bg-rose-50"
                  onClick={() => { onClose(); onCrudTestCase("delete", tc); }}
                  title="Delete this test case"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}
          </DialogTitle>
          {tc.decisionNeeded && (
            <p className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded p-2">
              <strong>Pending founder/product decision.</strong> This test case covers a refund-policy number that was never defined elsewhere in the spec. The proposed default is in the expected result below — confirm or replace before launch.
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {tc.description && (
            <div>
              <h4 className="text-[11px] uppercase font-semibold text-slate-500 mb-1">Description</h4>
              <p className="text-sm text-slate-700">{tc.description}</p>
            </div>
          )}
          {tc.expected && (
            <div>
              <h4 className="text-[11px] uppercase font-semibold text-slate-500 mb-1">Expected Result</h4>
              <p className="text-sm text-slate-700 bg-emerald-50 border border-emerald-200 rounded p-2.5">{tc.expected}</p>
            </div>
          )}
          {tc.steps && (
            <div>
              <h4 className="text-[11px] uppercase font-semibold text-slate-500 mb-1">Steps to Reproduce</h4>
              <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-2.5 whitespace-pre-wrap">{tc.steps}</p>
            </div>
          )}

          {tc.bugs.length > 0 && (
            <div>
              <h4 className="text-[11px] uppercase font-semibold text-slate-500 mb-1.5">Linked Bugs ({tc.bugs.length})</h4>
              <div className="space-y-1.5">
                {tc.bugs.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-xs border border-slate-200 rounded p-2">
                    <BugIcon className="size-3.5 text-rose-500" />
                    <span className="flex-1 font-medium">{b.title}</span>
                    <Badge variant="outline" className="text-[10px]">{BUG_SEVERITY_META[b.severity].label}</Badge>
                    <Badge variant="outline" className="text-[10px]">{BUG_STATUS_META[b.status].label}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tc.executions.length > 0 && (
            <div>
              <h4 className="text-[11px] uppercase font-semibold text-slate-500 mb-1.5">Execution History</h4>
              <div className="space-y-1.5 text-xs">
                {tc.executions.map((e) => {
                  const testerInfo = e.tester;
                  const displayName = testerInfo?.name ?? e.executedBy;
                  return (
                    <div key={e.id} className="flex items-center gap-2 text-slate-600 border border-slate-100 rounded p-1.5 bg-slate-50/50">
                      <StatusBadge status={e.status as TestStatus} />
                      <span>{new Date(e.executedAt).toLocaleString()}</span>
                      {displayName && (
                        <span className="flex items-center gap-1 text-slate-500">
                          · by
                          {testerInfo ? (
                            <>
                              <Avatar className="size-4">
                                <AvatarFallback className={`text-[8px] font-bold bg-gradient-to-br ${testerColor(testerInfo.color).gradient} text-white`}>
                                  {initials(testerInfo.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-700">{testerInfo.name}</span>
                            </>
                          ) : (
                            <span className="italic">{e.executedBy}</span>
                          )}
                        </span>
                      )}
                      {e.notes && <span className="text-slate-500 italic">· "{e.notes}"</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Execution form */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase font-semibold text-slate-500">Execute Test</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Status</Label>
                <div className="grid grid-cols-5 gap-1.5 mt-1">
                  {(["not_run", "pass", "fail", "blocked", "skipped"] as TestStatus[]).map((st) => {
                    const meta = STATUS_META[st];
                    const Icon =
                      st === "pass" ? CheckCircle2 :
                      st === "fail" ? XCircle :
                      st === "blocked" ? Pause :
                      st === "skipped" ? SkipForward :
                      CircleDashed;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                          status === st
                            ? `${meta.bg} ${meta.text} border-current`
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1.5">
                  Tester
                  {currentTester ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                      <span className={`size-1.5 rounded-full ${testerColor(currentTester.color).dot}`} />
                      Auto: {currentTester.name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal">(no tester selected)</span>
                  )}
                </Label>
                {currentTester ? (
                  <div className={`mt-1 h-9 rounded-md border px-3 flex items-center gap-2 ${testerColor(currentTester.color).bg} ${testerColor(currentTester.color).text}`}>
                    <Avatar className="size-5">
                      <AvatarFallback className={`text-[9px] font-bold bg-gradient-to-br ${testerColor(currentTester.color).gradient} text-white`}>
                        {initials(currentTester.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{currentTester.name}</span>
                    <span className="text-[10px] opacity-70">· {TESTER_ROLE_META[currentTester.role]?.label ?? "Tester"}</span>
                  </div>
                ) : (
                  <Input
                    value={testerName}
                    onChange={(e) => setTesterName(e.target.value)}
                    placeholder="Pick a tester from header, or type name"
                    className="mt-1 h-9"
                  />
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add observations, steps taken, or context…"
                className="mt-1 min-h-20 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBugForm((v) => !v)}>
                <BugIcon className="size-3.5 mr-1" />
                {showBugForm ? "Cancel bug" : "Report a bug"}
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
                <Button size="sm" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                  Save execution
                </Button>
              </div>
            </div>

            {showBugForm && (
              <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-3 space-y-2">
                <h5 className="text-xs font-semibold text-rose-700">Report new bug</h5>
                <Input
                  placeholder="Bug title *"
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  className="h-9 bg-white"
                />
                <Textarea
                  placeholder="Bug description"
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  className="min-h-16 text-sm bg-white"
                />
                <div className="flex items-center justify-between gap-2">
                  <Select value={bugSeverity} onValueChange={(v) => setBugSeverity(v as BugSeverity)}>
                    <SelectTrigger className="h-8 w-40 text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocker">Blocker</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="destructive" onClick={handleReportBug} disabled={!bugTitle}>
                    Create bug
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Bugs View ---------------- */
function BugsView({
  bugs, testers, currentTester, onRefresh, onUpdateBug, onCreateBug,
}: {
  bugs: Bug[];
  testers: TesterStat[];
  currentTester: CurrentTester | null;
  onRefresh: (filters?: Record<string, string>) => void;
  onUpdateBug: (id: string, updates: any) => void;
  onCreateBug: (bug: any) => void;
}) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [showNewBug, setShowNewBug] = useState(false);
  const [expandedBug, setExpandedBug] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => onRefresh({ ...filters, search }), 250);
    return () => clearTimeout(t);
  }, [filters, search, onRefresh]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bug Tracker</h2>
          <p className="text-sm text-slate-500">
            {bugs.length} bugs · {bugs.filter((b) => b.status === "open").length} open
            {currentTester && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <span className={`size-1.5 rounded-full ${testerColor(currentTester.color).dot}`} />
                  New bugs reported by {currentTester.name}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search bugs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-full md:w-56 h-9"
            />
          </div>
          <Button size="sm" onClick={() => setShowNewBug(true)} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="size-3.5 mr-1" /> New Bug
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <FilterSelect
              label="Status"
              value={filters.status || "all"}
              onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
              options={[
                { value: "all", label: "All statuses" },
                { value: "open", label: "Open" },
                { value: "in_progress", label: "In Progress" },
                { value: "fixed", label: "Fixed" },
                { value: "verified", label: "Verified" },
                { value: "wont_fix", label: "Won't Fix" },
              ]}
            />
            <FilterSelect
              label="Severity"
              value={filters.severity || "all"}
              onChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
              options={[
                { value: "all", label: "All severities" },
                { value: "blocker", label: "Blocker" },
                { value: "critical", label: "Critical" },
                { value: "major", label: "Major" },
                { value: "minor", label: "Minor" },
              ]}
            />
            <FilterSelect
              label="Module"
              value={filters.module || "all"}
              onChange={(v) => setFilters((f) => ({ ...f, module: v }))}
              options={[
                { value: "all", label: "All modules" },
                { value: "Landing Page", label: "Landing Page" },
                { value: "Teacher Registration Wizard", label: "Teacher Reg" },
                { value: "Teacher Dashboard", label: "Teacher Dashboard" },
                { value: "Course Creation Wizard", label: "Course Wizard" },
                { value: "Student Dashboard", label: "Student Dashboard" },
                { value: "Admin Dashboard", label: "Admin Dashboard" },
                { value: "Support & Ticketing System", label: "Support" },
              ]}
            />
            <FilterSelect
              label="Reporter"
              value={filters.reporterId || "all"}
              onChange={(v) => setFilters((f) => ({ ...f, reporterId: v }))}
              options={[
                { value: "all", label: "Anyone" },
                { value: "none", label: "No reporter" },
                ...testers.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
            <FilterSelect
              label="Assignee"
              value={filters.assigneeId || "all"}
              onChange={(v) => setFilters((f) => ({ ...f, assigneeId: v }))}
              options={[
                { value: "all", label: "Anyone" },
                { value: "none", label: "Unassigned" },
                { value: "any", label: "Has assignee" },
                ...testers.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {bugs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-400">
              <BugIcon className="size-8 mx-auto mb-2 text-slate-300" />
              No bugs found. Click "New Bug" to log one.
            </CardContent>
          </Card>
        )}
        {bugs.map((bug) => {
          const reporter = bug.reporterRef;
          const assignee = bug.assigneeRef;
          return (
            <Card key={bug.id} className="overflow-hidden">
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={`size-2 rounded-full mt-1.5 ${
                    bug.severity === "blocker" ? "bg-rose-700" :
                    bug.severity === "critical" ? "bg-rose-500" :
                    bug.severity === "major" ? "bg-orange-500" :
                    "bg-amber-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900">{bug.title}</p>
                        {bug.testCase && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Linked: {bug.testCase.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${BUG_SEVERITY_META[bug.severity].bg} ${BUG_SEVERITY_META[bug.severity].text}`}>
                          {BUG_SEVERITY_META[bug.severity].label}
                        </span>
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${BUG_STATUS_META[bug.status].bg} ${BUG_STATUS_META[bug.status].text}`}>
                          {BUG_STATUS_META[bug.status].label}
                        </span>
                      </div>
                    </div>
                    {bug.description && (
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{bug.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                      {bug.moduleName && <span className="flex items-center gap-1"><Globe className="size-3" />{bug.moduleName}</span>}
                      {reporter && (
                        <span className="flex items-center gap-1">
                          <Avatar className="size-4">
                            <AvatarFallback className={`text-[8px] font-bold bg-gradient-to-br ${testerColor(reporter.color).gradient} text-white`}>
                              {initials(reporter.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>reported by <strong className="text-slate-700">{reporter.name}</strong></span>
                        </span>
                      )}
                      {assignee && (
                        <span className="flex items-center gap-1">
                          <Avatar className="size-4">
                            <AvatarFallback className={`text-[8px] font-bold bg-gradient-to-br ${testerColor(assignee.color).gradient} text-white`}>
                              {initials(assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>assigned to <strong className="text-slate-700">{assignee.name}</strong></span>
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(bug.createdAt).toLocaleDateString()}</span>
                      <button
                        className="ml-auto text-emerald-600 hover:underline font-medium"
                        onClick={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
                      >
                        {expandedBug === bug.id ? "Hide" : "Details"}
                      </button>
                    </div>

                    {expandedBug === bug.id && (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        {bug.stepsToRepro && (
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Steps to Reproduce</p>
                            <p className="text-xs text-slate-700 bg-slate-50 rounded p-2 whitespace-pre-wrap">{bug.stepsToRepro}</p>
                          </div>
                        )}
                        {bug.expected && (
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Expected</p>
                            <p className="text-xs text-slate-700">{bug.expected}</p>
                          </div>
                        )}
                        {bug.actual && (
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Actual</p>
                            <p className="text-xs text-slate-700">{bug.actual}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Select value={bug.status} onValueChange={(v) => onUpdateBug(bug.id, { status: v })}>
                            <SelectTrigger className="h-7 w-32 text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="fixed">Fixed</SelectItem>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="wont_fix">Won't Fix</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={bug.severity} onValueChange={(v) => onUpdateBug(bug.id, { severity: v })}>
                            <SelectTrigger className="h-7 w-32 text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="blocker">Blocker</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                              <SelectItem value="major">Major</SelectItem>
                              <SelectItem value="minor">Minor</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={bug.assigneeId ?? "none"}
                            onValueChange={(v) => {
                              const picked = v === "none" ? null : testers.find((t) => t.id === v);
                              onUpdateBug(bug.id, {
                                assigneeId: v === "none" ? null : v,
                                assignee: picked?.name ?? null,
                              });
                            }}
                          >
                            <SelectTrigger className="h-7 w-44 text-[11px]">
                              <SelectValue placeholder="Assign to…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— Unassigned —</SelectItem>
                              {testers.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Attachments section */}
                        <BugAttachments bugId={bug.id} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showNewBug && (
        <NewBugDialog
          testers={testers}
          currentTester={currentTester}
          onClose={() => setShowNewBug(false)}
          onCreate={(data) => {
            onCreateBug(data);
            setShowNewBug(false);
          }}
        />
      )}
    </div>
  );
}

function NewBugDialog({
  testers, currentTester, onClose, onCreate,
}: {
  testers: TesterStat[];
  currentTester: CurrentTester | null;
  onClose: () => void;
  onCreate: (b: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("major");
  const [priority, setPriority] = useState<Priority>("medium");
  const [moduleName, setModuleName] = useState("Landing Page");
  const [reporter, setReporter] = useState(currentTester?.name ?? "");
  const [reporterId, setReporterId] = useState<string | "">(currentTester?.id ?? "");
  const [assigneeId, setAssigneeId] = useState<string | "">("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report New Bug</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary of the bug" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description" className="mt-1 min-h-20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as BugSeverity)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocker">Blocker</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Module</Label>
              <Select value={moduleName} onValueChange={setModuleName}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Landing Page">Landing Page</SelectItem>
                  <SelectItem value="Teacher Registration Wizard">Teacher Registration</SelectItem>
                  <SelectItem value="Teacher Dashboard">Teacher Dashboard</SelectItem>
                  <SelectItem value="Course Creation Wizard">Course Wizard</SelectItem>
                  <SelectItem value="Student Dashboard">Student Dashboard</SelectItem>
                  <SelectItem value="Admin Dashboard">Admin Dashboard</SelectItem>
                  <SelectItem value="Support & Ticketing System">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1.5">
                Reporter
                {currentTester && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                    <span className={`size-1.5 rounded-full ${testerColor(currentTester.color).dot}`} />
                    Auto: {currentTester.name}
                  </span>
                )}
              </Label>
              <Select
                value={reporterId}
                onValueChange={(v) => {
                  setReporterId(v);
                  const picked = testers.find((t) => t.id === v);
                  setReporter(picked?.name ?? "");
                }}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select reporter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {testers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Assign to (optional)</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Leave unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Unassigned —</SelectItem>
                {testers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Steps to Reproduce</Label>
            <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="1. Go to…&#10;2. Click…&#10;3. See error" className="mt-1 min-h-16" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Expected</Label>
              <Textarea value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="What should happen" className="mt-1 min-h-12" />
            </div>
            <div>
              <Label className="text-xs">Actual</Label>
              <Textarea value={actual} onChange={(e) => setActual(e.target.value)} placeholder="What actually happens" className="mt-1 min-h-12" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!title}
            onClick={() => onCreate({
              title, description, severity, priority, moduleName,
              reporter: reporter || undefined,
              reporterId: reporterId || undefined,
              assigneeId: assigneeId || undefined,
              assignee: testers.find((t) => t.id === assigneeId)?.name,
              stepsToRepro: steps, expected, actual,
            })}
            className="bg-rose-600 hover:bg-rose-700"
          >
            Create bug
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Testers View ---------------- */
function TestersView({
  testers, onRefresh, onPickTester, onToggleActive,
}: {
  testers: TesterStat[];
  onRefresh: () => void;
  onPickTester: (t: TesterStat) => void;
  onToggleActive: (id: string, active: boolean) => void;
}) {
  const [selectedTesterId, setSelectedTesterId] = useState<string | null>(null);
  const selectedTester = testers.find((t) => t.id === selectedTesterId);

  const sortedTesters = [...testers].sort((a, b) => b.stats.totalExecutions - a.stats.totalExecutions);
  const totalExecutions = testers.reduce((sum, t) => sum + t.stats.totalExecutions, 0);
  const totalBugsReported = testers.reduce((sum, t) => sum + t.stats.bugsReported, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Testers</h2>
          <p className="text-sm text-slate-500">
            {testers.length} testers · {totalExecutions} total executions · {totalBugsReported} bugs reported
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw className="size-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Tester roster grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedTesters.map((t) => {
          const colorCls = testerColor(t.color);
          const RoleIcon = TESTER_ROLE_META[t.role]?.icon ?? User;
          const isExpanded = selectedTesterId === t.id;
          return (
            <Card
              key={t.id}
              className={`overflow-hidden transition-all cursor-pointer ${isExpanded ? "ring-2 ring-emerald-400" : "hover:shadow-md"}`}
              onClick={() => setSelectedTesterId(isExpanded ? null : t.id)}
            >
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className={`text-sm font-bold bg-gradient-to-br ${colorCls.gradient} text-white`}>
                      {initials(t.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-slate-900 truncate">{t.name}</p>
                      {!t.active && (
                        <span className="text-[9px] text-slate-500 bg-slate-100 rounded px-1 py-0.5">inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <RoleIcon className="size-3" />
                      <span>{TESTER_ROLE_META[t.role]?.label ?? "Tester"}</span>
                      {t.email && (
                        <>
                          <span>·</span>
                          <Mail className="size-2.5" />
                          <span className="truncate">{t.email}</span>
                        </>
                      )}
                    </div>
                    {t.stats.lastActive && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Clock className="size-2.5" />
                        Last active {new Date(t.stats.lastActive).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-1 mt-3 text-center text-[11px]">
                  <div className="rounded bg-slate-50 py-1.5">
                    <div className="font-bold text-slate-900 text-sm">{t.stats.totalExecutions}</div>
                    <div className="text-slate-500">Runs</div>
                  </div>
                  <div className="rounded bg-emerald-50 py-1.5">
                    <div className="font-bold text-emerald-700 text-sm">{t.stats.pass}</div>
                    <div className="text-slate-500">Pass</div>
                  </div>
                  <div className="rounded bg-rose-50 py-1.5">
                    <div className="font-bold text-rose-700 text-sm">{t.stats.fail}</div>
                    <div className="text-slate-500">Fail</div>
                  </div>
                  <div className="rounded bg-amber-50 py-1.5">
                    <div className="font-bold text-amber-700 text-sm">{t.stats.bugsReported}</div>
                    <div className="text-slate-500">Bugs</div>
                  </div>
                </div>

                {t.stats.totalExecutions > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Pass rate</span>
                      <span className="font-semibold">{t.stats.passRate}%</span>
                    </div>
                    <Progress value={t.stats.passRate} className="h-1" />
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPickTester(t);
                    }}
                  >
                    Set as current
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleActive(t.id, !t.active);
                    }}
                  >
                    {t.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Drill-down: per-tester activity */}
      {selectedTester && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className={`text-sm font-bold bg-gradient-to-br ${testerColor(selectedTester.color).gradient} text-white`}>
                  {initials(selectedTester.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{selectedTester.name}</CardTitle>
                <CardDescription className="text-xs">
                  {TESTER_ROLE_META[selectedTester.role]?.label ?? "Tester"}
                  {selectedTester.email && ` · ${selectedTester.email}`}
                  {" · "}Active in {selectedTester.stats.modulesTouched} module{selectedTester.stats.modulesTouched === 1 ? "" : "s"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent executions */}
              <div>
                <h4 className="text-[11px] uppercase font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                  <ListChecks className="size-3" />
                  Recent Executions ({selectedTester.recentExecutions.length})
                </h4>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {selectedTester.recentExecutions.length === 0 && (
                    <div className="text-xs text-slate-400 italic py-3 text-center">No executions yet.</div>
                  )}
                  {selectedTester.recentExecutions.map((e) => (
                    <div key={e.id} className="border border-slate-100 rounded p-2 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <StatusBadge status={e.status as TestStatus} />
                        <span className="text-[10px] text-slate-400">
                          {new Date(e.executedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="font-medium text-slate-900 line-clamp-1 text-[11px]">{e.testCase.title}</div>
                      <div className="text-[10px] text-slate-500">{e.testCase.module}</div>
                      {e.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">"{e.notes}"</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent bugs */}
              <div>
                <h4 className="text-[11px] uppercase font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                  <BugIcon className="size-3" />
                  Recently Reported Bugs ({selectedTester.recentBugs.length})
                </h4>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {selectedTester.recentBugs.length === 0 && (
                    <div className="text-xs text-slate-400 italic py-3 text-center">No bugs reported.</div>
                  )}
                  {selectedTester.recentBugs.map((b) => (
                    <div key={b.id} className="border border-slate-100 rounded p-2 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${BUG_SEVERITY_META[b.severity as BugSeverity]?.bg ?? "bg-slate-100"} ${BUG_SEVERITY_META[b.severity as BugSeverity]?.text ?? "text-slate-700"}`}>
                          {BUG_SEVERITY_META[b.severity as BugSeverity]?.label ?? b.severity}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="font-medium text-slate-900 line-clamp-1 text-[11px]">{b.title}</div>
                      <div className="text-[10px] text-slate-500">
                        Status: {BUG_STATUS_META[b.status as BugStatus]?.label ?? b.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {testers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-400">
            <Users className="size-8 mx-auto mb-2 text-slate-300" />
            No testers yet. Click the tester selector in the header to add one.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Modules View ---------------- */
function ModulesView({ stats, onNavigate }: { stats: any; onNavigate: (v: ViewKey) => void }) {
  if (!stats) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Module Reports</h2>
        <p className="text-sm text-slate-500">Test coverage and pass rate for each of the 7 platform modules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.moduleStats.map((m: ModuleStat) => {
          const Icon = MODULE_ICONS[m.icon] ?? Globe;
          return (
            <Card key={m.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="size-11 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Icon className="size-5.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-1">{m.description}</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onNavigate("test_cases")}>
                    Open <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[11px] uppercase font-semibold text-slate-500">Coverage</span>
                      <span className="text-sm font-bold text-slate-900">{m.coverage}%</span>
                    </div>
                    <Progress value={m.coverage} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[11px] uppercase font-semibold text-slate-500">Pass Rate</span>
                      <span className="text-sm font-bold text-emerald-700">{m.passRate}%</span>
                    </div>
                    <Progress value={m.passRate} className="h-1.5" />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 text-center text-[11px]">
                  <div className="rounded bg-emerald-50 py-1.5">
                    <div className="font-bold text-emerald-700">{m.pass}</div>
                    <div className="text-slate-500">Pass</div>
                  </div>
                  <div className="rounded bg-rose-50 py-1.5">
                    <div className="font-bold text-rose-700">{m.fail}</div>
                    <div className="text-slate-500">Fail</div>
                  </div>
                  <div className="rounded bg-amber-50 py-1.5">
                    <div className="font-bold text-amber-700">{m.blocked}</div>
                    <div className="text-slate-500">Blocked</div>
                  </div>
                  <div className="rounded bg-sky-50 py-1.5">
                    <div className="font-bold text-sky-700">{m.skipped}</div>
                    <div className="text-slate-500">Skipped</div>
                  </div>
                  <div className="rounded bg-slate-50 py-1.5">
                    <div className="font-bold text-slate-600">{m.notRun}</div>
                    <div className="text-slate-500">Not Run</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                  <span><strong className="text-slate-700">{m.total}</strong> total tests</span>
                  <span>·</span>
                  <span><strong className="text-slate-700">{m.pass + m.fail + m.blocked + m.skipped}</strong> executed</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Reports View ---------------- */
function ReportsView({ stats, testCases, bugs }: { stats: any; testCases: TestCase[]; bugs: Bug[] }) {
  if (!stats) return <LoadingSkeleton />;
  const s = stats.summary;

  const handleExport = (kind: "csv_testcases" | "csv_bugs" | "json_summary") => {
    let content = "";
    let filename = "";
    let mime = "text/csv";
    if (kind === "csv_testcases") {
      const headers = ["Module", "Suite", "Title", "Status", "Priority", "Category", "Expected", "Tester", "Last Run", "Notes"];
      const rows = testCases.map((tc) => [
        tc.suite.module.name,
        tc.suite.name,
        tc.title,
        tc.status,
        tc.priority,
        tc.category,
        tc.expected || "",
        tc.testerName || "",
        tc.lastRunAt ? new Date(tc.lastRunAt).toISOString() : "",
        tc.notes || "",
      ]);
      content = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      filename = `test-cases-${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (kind === "csv_bugs") {
      const headers = ["Title", "Severity", "Priority", "Status", "Module", "Reporter", "Assignee", "Created", "Description"];
      const rows = bugs.map((b) => [
        b.title, b.severity, b.priority, b.status, b.moduleName || "", b.reporter || "", b.assignee || "",
        new Date(b.createdAt).toISOString(), b.description || "",
      ]);
      content = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      filename = `bugs-${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      content = JSON.stringify({ summary: s, moduleStats: stats.moduleStats, categoryStats: stats.categoryStats, priorityStats: stats.priorityStats, exportedAt: new Date().toISOString() }, null, 2);
      filename = `qa-summary-${new Date().toISOString().slice(0, 10)}.json`;
      mime = "application/json";
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Reports & Exports</h2>
        <p className="text-sm text-slate-500">Generate summary reports and export test data</p>
      </div>

      {/* Executive summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileBarChart className="size-4 text-slate-500" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-slate-700 leading-relaxed">
            This report summarizes the current state of QA testing for the <strong>Hidayah Connect & TeachUs</strong> platform.
            Testing covers <strong>{s.totalTestCases} test cases</strong> distributed across <strong>{stats.moduleStats.length} modules</strong>
            and <strong>{stats.categoryStats.length} test categories</strong> (functional, UI, integration, security, payment).
          </p>
          <p className="text-slate-700 leading-relaxed">
            As of {new Date().toLocaleString()}, <strong>{s.overallCoverage}% of test cases have been executed</strong>,
            with <strong>{s.passCount} passing</strong> ({s.overallPassRate}% pass rate),
            <strong> {s.failCount} failing</strong>, and <strong>{s.blockedCount} blocked</strong>.
            There are currently <strong>{s.openBugs} open bugs</strong>, of which <strong>{s.criticalBugs} are critical</strong>.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
            <SummaryStat label="Total Tests" value={s.totalTestCases} />
            <SummaryStat label="Executed" value={`${s.overallCoverage}%`} />
            <SummaryStat label="Pass Rate" value={`${s.overallPassRate}%`} accent="emerald" />
            <SummaryStat label="Open Bugs" value={s.openBugs} accent={s.criticalBugs > 0 ? "rose" : "slate"} />
          </div>
        </CardContent>
      </Card>

      {/* Module summary table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Module Coverage Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Pass</TableHead>
                <TableHead className="text-center">Fail</TableHead>
                <TableHead className="text-center">Blocked</TableHead>
                <TableHead className="text-center">Not Run</TableHead>
                <TableHead className="text-center">Coverage</TableHead>
                <TableHead className="text-center">Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.moduleStats.map((m: ModuleStat) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-center">{m.total}</TableCell>
                  <TableCell className="text-center text-emerald-700 font-medium">{m.pass}</TableCell>
                  <TableCell className="text-center text-rose-700 font-medium">{m.fail}</TableCell>
                  <TableCell className="text-center text-amber-700 font-medium">{m.blocked}</TableCell>
                  <TableCell className="text-center text-slate-500">{m.notRun}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Progress value={m.coverage} className="h-1.5 w-12" />
                      <span className="text-xs font-medium">{m.coverage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Progress value={m.passRate} className="h-1.5 w-12" />
                      <span className="text-xs font-medium">{m.passRate}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Export Data</CardTitle>
          <CardDescription className="text-xs">Download testing data as CSV or JSON for sharing and archival</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => handleExport("csv_testcases")} className="h-auto py-3 flex flex-col items-start gap-1">
            <FileBarChart className="size-4 text-emerald-600" />
            <span className="font-semibold text-sm">Test Cases CSV</span>
            <span className="text-[11px] text-slate-500 font-normal">All {testCases.length} test cases with status, priority, notes</span>
          </Button>
          <Button variant="outline" onClick={() => handleExport("csv_bugs")} className="h-auto py-3 flex flex-col items-start gap-1">
            <BugIcon className="size-4 text-rose-600" />
            <span className="font-semibold text-sm">Bugs CSV</span>
            <span className="text-[11px] text-slate-500 font-normal">All {bugs.length} bugs with severity, status, steps</span>
          </Button>
          <Button variant="outline" onClick={() => handleExport("json_summary")} className="h-auto py-3 flex flex-col items-start gap-1">
            <Database className="size-4 text-teal-600" />
            <span className="font-semibold text-sm">Summary JSON</span>
            <span className="text-[11px] text-slate-500 font-normal">Complete QA snapshot with module & category stats</span>
          </Button>
        </CardContent>
      </Card>

      {/* Print button */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => window.print()}>
          <FileBarChart className="size-3.5 mr-1" />
          Print this report
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, accent = "slate" }: { label: string; value: string | number; accent?: "slate" | "emerald" | "rose" }) {
  const colors = {
    slate: "bg-slate-50 text-slate-900",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className={`rounded-lg p-3 ${colors[accent]}`}>
      <div className="text-[10px] uppercase font-semibold opacity-70">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

/* ---------------- Test Case CRUD Dialog (Admin Only) ---------------- */
function TestCaseCrudDialog({
  action, testCase, testers, onClose, onSuccess,
}: {
  action: "create" | "edit" | "clone" | "delete";
  testCase: TestCase | null;
  testers: TesterStat[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isDelete = action === "delete";
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState(testCase?.title ?? "");
  const [description, setDescription] = useState(testCase?.description ?? "");
  const [steps, setSteps] = useState(testCase?.steps ?? "");
  const [expected, setExpected] = useState(testCase?.expected ?? "");
  const [priority, setPriority] = useState<Priority>(testCase?.priority ?? "medium");
  const [category, setCategory] = useState<Category>(testCase?.category ?? "functional");
  const [specReference, setSpecReference] = useState(testCase?.specReference ?? "");
  const [decisionNeeded, setDecisionNeeded] = useState(testCase?.decisionNeeded ?? false);
  const [assignedTesterId, setAssignedTesterId] = useState(testCase?.assignedTester?.id ?? "");
  const [suiteId, setSuiteId] = useState(testCase?.suite?.id ?? "");

  const [suites, setSuites] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/modules")
      .then((r) => r.json())
      .then((data) => {
        const all: any[] = [];
        data.modules?.forEach((m: any) => {
          m.suites?.forEach((s: any) => {
            all.push({ id: s.id, name: `${m.name} → ${s.name}`, moduleName: m.name });
          });
        });
        setSuites(all);
        if (!testCase?.suite?.id && all.length > 0) {
          setSuiteId(all[0].id);
        }
      });
  }, [testCase]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (action === "create") {
        const res = await fetch("/api/test-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suiteId, title, description, steps, expected,
            priority, category, specReference, decisionNeeded,
            assignedTesterId: assignedTesterId || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        toast({ title: "Test case created", description: title });
      } else if (action === "edit" && testCase) {
        const res = await fetch(`/api/test-cases/${testCase.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, description, steps, expected,
            priority, category, specReference, decisionNeeded,
            assignedTesterId: assignedTesterId || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        toast({ title: "Test case updated", description: title });
      } else if (action === "clone" && testCase) {
        const res = await fetch(`/api/test-cases/${testCase.id}`, { method: "POST" });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        toast({ title: "Test case cloned", description: `${testCase.title} (Clone)` });
      }
      onSuccess();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!testCase) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/test-cases/${testCase.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast({ title: "Test case deleted", description: testCase.title });
      onSuccess();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "create" && <><Plus className="size-4 text-emerald-600" /> Create New Test Case</>}
            {action === "edit" && <><Pencil className="size-4 text-sky-600" /> Edit Test Case</>}
            {action === "clone" && <><Copy className="size-4 text-violet-600" /> Clone Test Case</>}
            {action === "delete" && <><Trash2 className="size-4 text-rose-600" /> Delete Test Case</>}
          </DialogTitle>
        </DialogHeader>

        {isDelete ? (
          <div className="space-y-4 py-2">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-rose-800 mb-1">Are you sure?</p>
              <p className="text-xs text-rose-700">
                You are about to delete <strong>"{testCase?.title}"</strong>. This will also delete:
              </p>
              <ul className="text-xs text-rose-700 mt-2 ml-4 list-disc">
                <li>All execution history ({testCase?.executions?.length ?? 0} executions)</li>
                <li>All linked bugs ({testCase?.bugs?.length ?? 0} bugs)</li>
              </ul>
              <p className="text-xs text-rose-700 mt-2">This action cannot be undone.</p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? "Deleting…" : "Delete permanently"}
              </Button>
            </DialogFooter>
          </div>
        ) : action === "clone" ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">
              This will create a copy of <strong>"{testCase?.title}"</strong> with the same:
              suite, description, steps, expected result, priority, category, spec reference,
              and decision-needed flag. The clone will have status "Not Run".
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} className="bg-violet-600 hover:bg-violet-700">
                <Copy className="size-3.5 mr-1.5" />
                {loading ? "Cloning…" : "Clone test case"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Test Case Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Verify login with valid credentials" className="mt-1" />
            </div>

            <div>
              <Label className="text-xs">Suite *</Label>
              <Select value={suiteId} onValueChange={setSuiteId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select suite" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {suites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="ui">UI</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this test case verify?" className="mt-1 min-h-16" />
            </div>

            <div>
              <Label className="text-xs">Steps to Reproduce</Label>
              <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="1. Go to…&#10;2. Click…&#10;3. Verify…" className="mt-1 min-h-20 font-mono text-xs" />
            </div>

            <div>
              <Label className="text-xs">Expected Result</Label>
              <Textarea value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="What should happen if the test passes?" className="mt-1 min-h-16" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Spec Reference</Label>
                <Input value={specReference} onChange={(e) => setSpecReference(e.target.value)} placeholder="e.g. Sec 5.2" className="mt-1 font-mono text-xs" />
              </div>
              <div>
                <Label className="text-xs">Assign To</Label>
                <Select value={assignedTesterId} onValueChange={setAssignedTesterId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Unassigned —</SelectItem>
                    {testers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={decisionNeeded}
                onChange={(e) => setDecisionNeeded(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs">
                Mark as <strong className="text-amber-700">DECISION NEEDED</strong> (pending founder/product confirmation)
              </span>
            </label>

            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={loading || !title || !suiteId}
                className={action === "edit" ? "bg-sky-600 hover:bg-sky-700" : "bg-emerald-600 hover:bg-emerald-700"}
              >
                {loading ? "Saving…" : action === "edit" ? "Save changes" : "Create test case"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Audit Log View (Admin Only) ---------------- */
function AuditLogView({ userRole }: { userRole?: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.set("action", actionFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.status === 403) {
        setLogs([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  if (userRole !== "admin" && userRole !== "lead") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ScrollText className="size-10 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-700">Admin Access Required</h3>
          <p className="text-sm text-slate-500 mt-1">The audit log is only visible to admin users.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Audit Log</h2>
          <p className="text-sm text-slate-500">Every action taken in the system — who did what and when</p>
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-56 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="test_case">Test cases</SelectItem>
            <SelectItem value="bug">Bugs</SelectItem>
            <SelectItem value="auth">Authentication</SelectItem>
            <SelectItem value="tester">Testers</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {loading ? (
              <div className="text-center text-sm text-slate-400 py-12">Loading audit log…</div>
            ) : logs.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-12">
                <ScrollText className="size-8 mx-auto mb-2 text-slate-300" />
                No audit log entries
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id} className="text-xs">
                      <TableCell className="text-slate-500 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{l.user?.name ?? "System"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">{l.action}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{l.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Requirements Coverage View ---------------- */
function RequirementsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/requirements-coverage")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-sm text-slate-400 py-12">Loading requirements coverage…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Requirements Coverage</h2>
        <p className="text-sm text-slate-500">
          Test cases grouped by spec section — see which parts of the product spec have tests and their pass rates
        </p>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3">
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Spec Sections</div>
            <div className="text-xl font-bold text-slate-900">{data.totalSpecSections}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Tests with Spec</div>
            <div className="text-xl font-bold text-slate-900">{data.totalTestCasesWithSpec}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Tests without Spec</div>
            <div className="text-xl font-bold text-amber-700">{data.untraceableCount}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Coverage</div>
            <div className="text-xl font-bold text-emerald-700">
              {data.totalTestCasesWithSpec + data.untraceableCount > 0
                ? Math.round((data.totalTestCasesWithSpec / (data.totalTestCasesWithSpec + data.untraceableCount)) * 100)
                : 0}%
            </div>
          </CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Spec Sections Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spec Section</TableHead>
                <TableHead className="text-center">Tests</TableHead>
                <TableHead className="text-center">Pass</TableHead>
                <TableHead className="text-center">Fail</TableHead>
                <TableHead className="text-center">Not Run</TableHead>
                <TableHead className="text-center">Decisions</TableHead>
                <TableHead className="text-center">Coverage</TableHead>
                <TableHead className="text-center">Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.sections?.map((s: any) => (
                <TableRow key={s.section}>
                  <TableCell className="font-mono text-xs">{s.section}</TableCell>
                  <TableCell className="text-center">{s.total}</TableCell>
                  <TableCell className="text-center text-emerald-700 font-medium">{s.pass}</TableCell>
                  <TableCell className="text-center text-rose-700 font-medium">{s.fail}</TableCell>
                  <TableCell className="text-center text-slate-500">{s.notRun}</TableCell>
                  <TableCell className="text-center">
                    {s.decisionsNeeded > 0 ? (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px]">
                        <AlertTriangle className="size-2.5 mr-1" />
                        {s.decisionsNeeded}
                      </Badge>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Progress value={s.coverage} className="h-1.5 w-12" />
                      <span className="text-xs">{s.coverage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-1.5 justify-center">
                      <Progress value={s.passRate} className="h-1.5 w-12" />
                      <span className="text-xs font-medium">{s.passRate}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- My Bugs View (Developer Only) ---------------- */
function MyBugsView({ session }: { session: any }) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [expandedBug, setExpandedBug] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bugs?assignedToMe=true&status=" + statusFilter);
      const data = await res.json();
      setBugs(data.bugs || []);
    } catch {
      setBugs([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateBugStatus = async (bugId: string, status: string) => {
    try {
      const notes = resolutionNotes[bugId] || "";
      const res = await fetch("/api/bugs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bugId,
          status,
          ...(status === "fixed" && notes ? { resolutionNotes: notes } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      toast({
        title: "Bug updated",
        description: status === "fixed"
          ? "Marked as fixed — reporter has been notified to verify"
          : `Status: ${status}`,
      });
      refresh();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  const openCount = bugs.filter((b) => b.status === "open" || b.status === "in_progress").length;
  const fixedCount = bugs.filter((b) => b.status === "fixed").length;
  const verifiedCount = bugs.filter((b) => b.status === "verified").length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="size-5 text-teal-600" />
          My Assigned Bugs
        </h2>
        <p className="text-sm text-slate-500">
          Bugs assigned to you for fixing. Update status as you work on them.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Open</div>
          <div className="text-2xl font-bold text-rose-700">{openCount}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">In Progress</div>
          <div className="text-2xl font-bold text-amber-700">{bugs.filter((b) => b.status === "in_progress").length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Fixed</div>
          <div className="text-2xl font-bold text-sky-700">{fixedCount}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Verified</div>
          <div className="text-2xl font-bold text-emerald-700">{verifiedCount}</div>
        </CardContent></Card>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open (to start)</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="fixed">Fixed (awaiting verify)</SelectItem>
            <SelectItem value="verified">Verified (closed)</SelectItem>
            <SelectItem value="wont_fix">Won't Fix</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={refresh}>
          <RefreshCw className="size-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Bug list */}
      <div className="space-y-2">
        {loading ? (
          <Card><CardContent className="py-12 text-center text-sm text-slate-400">Loading your bugs…</CardContent></Card>
        ) : bugs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-400">
              <Wrench className="size-8 mx-auto mb-2 text-slate-300" />
              No bugs assigned to you with status "{statusFilter}".
              <br />
              <span className="text-xs">When an admin assigns a bug to you, it will appear here.</span>
            </CardContent>
          </Card>
        ) : (
          bugs.map((bug) => (
            <Card key={bug.id} className="overflow-hidden">
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={`size-2 rounded-full mt-1.5 ${
                    bug.severity === "blocker" ? "bg-rose-700" :
                    bug.severity === "critical" ? "bg-rose-500" :
                    bug.severity === "major" ? "bg-orange-500" :
                    "bg-amber-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900">{bug.title}</p>
                        {bug.testCase && (
                          <p className="text-[11px] text-slate-500 mt-0.5">Linked: {bug.testCase.title}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${BUG_SEVERITY_META[bug.severity].bg} ${BUG_SEVERITY_META[bug.severity].text}`}>
                          {BUG_SEVERITY_META[bug.severity].label}
                        </span>
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${BUG_STATUS_META[bug.status].bg} ${BUG_STATUS_META[bug.status].text}`}>
                          {BUG_STATUS_META[bug.status].label}
                        </span>
                      </div>
                    </div>
                    {bug.description && (
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{bug.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                      {bug.moduleName && <span className="flex items-center gap-1"><Globe className="size-3" />{bug.moduleName}</span>}
                      {bug.reporterRef && (
                        <span className="flex items-center gap-1">
                          <Avatar className="size-4">
                            <AvatarFallback className={`text-[8px] font-bold bg-gradient-to-br ${testerColor(bug.reporterRef.color).gradient} text-white`}>
                              {initials(bug.reporterRef.name)}
                            </AvatarFallback>
                          </Avatar>
                          Reported by <strong className="text-slate-700">{bug.reporterRef.name}</strong>
                        </span>
                      )}
                      <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(bug.createdAt).toLocaleDateString()}</span>
                      <button
                        className="ml-auto text-emerald-600 hover:underline font-medium"
                        onClick={() => setExpandedBug(expandedBug === bug.id ? null : bug.id)}
                      >
                        {expandedBug === bug.id ? "Hide" : "Work on this"}
                      </button>
                    </div>

                    {expandedBug === bug.id && (
                      <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                        {bug.stepsToRepro && (
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Steps to Reproduce</p>
                            <pre className="text-xs text-slate-700 bg-slate-50 rounded p-2 whitespace-pre-wrap font-mono">{bug.stepsToRepro}</pre>
                          </div>
                        )}
                        {bug.expected && (
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Expected</p>
                            <p className="text-xs text-slate-700">{bug.expected}</p>
                          </div>
                        )}
                        {bug.actual && (
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Actual</p>
                            <p className="text-xs text-slate-700">{bug.actual}</p>
                          </div>
                        )}

                        {/* Developer action panel */}
                        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2">
                          <p className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
                            <Wrench className="size-3" />
                            Developer Actions
                          </p>

                          {(bug.status === "open" || bug.status === "in_progress") && (
                            <>
                              <Label className="text-[10px] text-teal-700">
                                Resolution notes (required when marking as fixed)
                              </Label>
                              <Textarea
                                value={resolutionNotes[bug.id] || ""}
                                onChange={(e) => setResolutionNotes({ ...resolutionNotes, [bug.id]: e.target.value })}
                                placeholder="Describe what you fixed, the root cause, and any testing you did…"
                                className="min-h-20 text-xs bg-white"
                              />
                              <div className="flex flex-wrap gap-2">
                                {bug.status === "open" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateBugStatus(bug.id, "in_progress")}
                                    className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                  >
                                    <PlayCircle className="size-3 mr-1" /> Start working
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => updateBugStatus(bug.id, "fixed")}
                                  disabled={!resolutionNotes[bug.id]}
                                  className="h-7 text-xs bg-sky-600 hover:bg-sky-700"
                                >
                                  <CheckCircle2 className="size-3 mr-1" /> Mark as fixed
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateBugStatus(bug.id, "wont_fix")}
                                  className="h-7 text-xs border-slate-300 text-slate-600 hover:bg-slate-50"
                                >
                                  Won't fix
                                </Button>
                              </div>
                              <p className="text-[10px] text-teal-600">
                                Marking as fixed notifies the reporter to verify and close.
                              </p>
                            </>
                          )}

                          {bug.status === "fixed" && (
                            <p className="text-xs text-sky-700">
                              ✅ You marked this as fixed. Waiting for {bug.reporterRef?.name ?? "the reporter"} to verify.
                            </p>
                          )}

                          {bug.status === "verified" && (
                            <p className="text-xs text-emerald-700">
                              ✅ This bug has been verified and closed.
                            </p>
                          )}

                          {bug.status === "wont_fix" && (
                            <p className="text-xs text-slate-600">
                              This bug was marked as "Won't Fix".
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- User Management View (Admin Only) ---------------- */
function UserManagementView({ session }: { session: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const { toast } = useToast();
  const currentUserId = (session?.user as any)?.id;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        toast({ title: "Admin access required", variant: "destructive" });
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!u.name?.toLowerCase().includes(s) && !u.email?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const counts = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    leads: users.filter((u) => u.role === "lead").length,
    testers: users.filter((u) => u.role === "tester").length,
    developers: users.filter((u) => u.role === "developer").length,
    active: users.filter((u) => u.active).length,
    inactive: users.filter((u) => !u.active).length,
  };

  const handleToggleActive = async (user: any) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast({
        title: `User ${!user.active ? "activated" : "deactivated"}`,
        description: `${user.name} is now ${!user.active ? "active" : "inactive"}`,
      });
      refresh();
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="size-5 text-emerald-600" />
            User Management
          </h2>
          <p className="text-sm text-slate-500">
            Create, edit, deactivate, or remove users — testers, developers, leads, and admins
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { setEditUser(null); setShowDialog(true); }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="size-3.5 mr-1" /> Add User
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Total Users</div>
          <div className="text-xl font-bold text-slate-900">{counts.total}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Testers</div>
          <div className="text-xl font-bold text-violet-700">{counts.testers}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Developers</div>
          <div className="text-xl font-bold text-teal-700">{counts.developers}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Admins + Leads</div>
          <div className="text-xl font-bold text-emerald-700">{counts.admins + counts.leads}</div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles ({counts.total})</SelectItem>
            <SelectItem value="admin">Admins ({counts.admins})</SelectItem>
            <SelectItem value="lead">QA Leads ({counts.leads})</SelectItem>
            <SelectItem value="tester">Testers ({counts.testers})</SelectItem>
            <SelectItem value="developer">Developers ({counts.developers})</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-56 h-9"
          />
        </div>
        <Button size="sm" variant="outline" onClick={refresh} className="h-9">
          <RefreshCw className="size-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">Loading users…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No users match your filters.</TableCell></TableRow>
                ) : filtered.map((u) => {
                  const isSelf = u.id === currentUserId;
                  const RoleIcon = TESTER_ROLE_META[u.role]?.icon ?? User;
                  return (
                    <TableRow key={u.id} className={isSelf ? "bg-emerald-50/30" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-9">
                            <AvatarFallback className={`text-[11px] font-bold bg-gradient-to-br ${u.tester ? testerColor(u.tester.color).gradient : "from-slate-500 to-slate-700"} text-white`}>
                              {initials(u.name ?? u.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                              {u.name}
                              {isSelf && <span className="text-[9px] text-emerald-700 bg-emerald-100 rounded px-1 py-0.5">YOU</span>}
                            </div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium ${ROLE_BADGE[u.role] ?? "bg-slate-100 text-slate-700"}`}>
                          <RoleIcon className="size-2.5" />
                          {TESTER_ROLE_META[u.role]?.label ?? u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-600">
                        {u.tester ? (
                          <div className="space-y-0.5">
                            <div>{u.tester.stats.executions} runs</div>
                            <div className="text-[10px] text-slate-400">
                              {u.tester.stats.bugsReported} reported · {u.tester.stats.bugsAssigned} assigned
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                            <span className="size-1.5 rounded-full bg-slate-400" /> Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-sky-700 hover:bg-sky-50"
                            onClick={() => { setEditUser(u); setShowDialog(true); }}
                            title="Edit user"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 px-2 ${u.active ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf}
                            title={isSelf ? "Cannot deactivate yourself" : (u.active ? "Deactivate user" : "Activate user")}
                          >
                            {u.active ? <Pause className="size-3.5" /> : <PlayCircle className="size-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-rose-700 hover:bg-rose-50"
                            onClick={() => setDeleteTarget(u)}
                            disabled={isSelf}
                            title={isSelf ? "Cannot delete yourself" : "Delete user"}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      {showDialog && (
        <UserEditDialog
          user={editUser}
          onClose={() => { setShowDialog(false); setEditUser(null); }}
          onSuccess={() => {
            setShowDialog(false);
            setEditUser(null);
            refresh();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteUserDialog
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

const ROLE_BADGE: Record<string, string> = {
  admin:     "bg-emerald-50 text-emerald-700",
  lead:      "bg-amber-50 text-amber-700",
  tester:    "bg-violet-50 text-violet-700",
  developer: "bg-teal-50 text-teal-700",
};

/* ---------------- User Edit Dialog ---------------- */
function UserEditDialog({
  user, onClose, onSuccess,
}: {
  user: any | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<string>(user?.role ?? "tester");
  const [color, setColor] = useState(user?.tester?.color ?? "emerald");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const colors = ["emerald", "violet", "amber", "sky", "rose", "teal"];

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isEdit) {
        const body: any = { name, email, role, color };
        if (password) body.password = password;
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed");
        }
        toast({ title: "User updated", description: `${name} (${role})` });
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role, color }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed");
        }
        toast({ title: "User created", description: `${name} (${role})` });
      }
      onSuccess();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <><Pencil className="size-4 text-sky-600" /> Edit User</> : <><UserPlus className="size-4 text-emerald-600" /> Add New User</>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Full Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="e.g. Rahul Verma" />
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="user@techus.app" />
          </div>
          <div>
            <Label className="text-xs">Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tester">Tester — executes tests, reports bugs</SelectItem>
                <SelectItem value="developer">Developer — fixes bugs assigned to them</SelectItem>
                <SelectItem value="lead">QA Lead — manages test cases, assigns bugs</SelectItem>
                <SelectItem value="admin">Admin — full access, manages users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Avatar Color</Label>
            <div className="flex gap-2 mt-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-8 rounded-full bg-gradient-to-br ${testerColor(c).gradient} flex items-center justify-center transition-all ${color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}`}
                >
                  {color === c && <CheckCircle2 className="size-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">
              Password {isEdit ? "(leave blank to keep current)" : "*"}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              placeholder={isEdit ? "•••••• (unchanged)" : "Min 6 characters"}
              {...(!isEdit ? { required: true } : {})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={loading || !name || !email || (!isEdit && !password)}
            className={isEdit ? "bg-sky-600 hover:bg-sky-700" : "bg-emerald-600 hover:bg-emerald-700"}
          >
            {loading ? "Saving…" : isEdit ? "Save changes" : "Create user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Delete User Confirmation ---------------- */
function DeleteUserDialog({
  user, onClose, onSuccess,
}: {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      const data = await res.json();
      toast({
        title: "User deleted",
        description: `${user.name} has been removed. ${data.deleted?.executionCount ?? 0} executions, ${data.deleted?.bugReportedCount ?? 0} bugs reported, ${data.deleted?.bugAssignedCount ?? 0} bugs assigned.`,
      });
      onSuccess();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <Trash2 className="size-4" /> Delete User
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-rose-800 mb-1">Are you sure?</p>
            <p className="text-xs text-rose-700">
              You are about to permanently delete <strong>{user.name}</strong> ({user.email}).
            </p>
            <p className="text-xs text-rose-700 mt-2">
              This will also delete:
            </p>
            <ul className="text-xs text-rose-700 mt-1 ml-4 list-disc">
              <li>Their tester profile</li>
              <li>{user.tester?.stats.executions ?? 0} test execution records</li>
              <li>Their in-app notifications</li>
              <li>Bugs they reported/assigned will be unassigned (preserved)</li>
              <li>Audit log entries will be anonymized (preserved)</li>
            </ul>
            <p className="text-xs text-rose-700 mt-2 font-medium">This action cannot be undone.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Bug Attachments (screenshots, recordings, voice notes) ---------------- */
function BugAttachments({ bugId }: { bugId: string }) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "record">("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const { toast } = useToast();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/bugs/${bugId}/attachments`);
      const data = await res.json();
      setAttachments(data.attachments || []);
    } catch {
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [bugId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      const res = await fetch(`/api/bugs/${bugId}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      toast({ title: "Attachment uploaded", description: `${file.name} (${(file.size / 1024).toFixed(0)}KB)` });
      refresh();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" });
      toast({ title: "Attachment deleted" });
      refresh();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  // Voice note recording using MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        await handleFileUpload(file);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (e: any) {
      toast({ title: "Microphone access denied", description: e.message, variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const openPreview = async (attachment: any) => {
    const url = `/api/attachments/${attachment.id}`;
    setPreviewUrl(url);
    setPreviewAttachment(attachment);
  };

  const images = attachments.filter((a) => a.fileType === "image");
  const videos = attachments.filter((a) => a.fileType === "video");
  const audios = attachments.filter((a) => a.fileType === "audio");

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <h5 className="text-[10px] uppercase font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
        <Paperclip className="size-3" />
        Attachments ({attachments.length})
      </h5>

      {/* Tabs: Upload File | Record Voice Note */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-3 py-1.5 rounded text-[11px] font-medium transition ${
            activeTab === "upload" ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Upload className="size-3 inline mr-1" /> Upload File
        </button>
        <button
          onClick={() => setActiveTab("record")}
          className={`px-3 py-1.5 rounded text-[11px] font-medium transition ${
            activeTab === "record" ? "bg-rose-100 text-rose-700" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Mic className="size-3 inline mr-1" /> Record Voice Note
        </button>
      </div>

      {/* Upload tab */}
      {activeTab === "upload" && (
        <div className="space-y-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin" /> Uploading…
              </div>
            ) : (
              <>
                <Upload className="size-6 mx-auto text-slate-400 mb-1" />
                <p className="text-xs text-slate-600 font-medium">Click to upload</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Screenshots (PNG/JPG, max 3MB) · Screen recordings (MP4/WebM, max 8MB) · Audio (MP3/WAV, max 2MB)
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Record tab */}
      {activeTab === "record" && (
        <div className="border-2 border-dashed border-rose-200 rounded-lg p-4 text-center bg-rose-50/20">
          {isRecording ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-mono text-rose-700">{formatTime(recordingTime)}</span>
              </div>
              <p className="text-[10px] text-slate-500">Recording… Speak clearly into your microphone</p>
              <Button
                size="sm"
                variant="destructive"
                onClick={stopRecording}
                className="h-7 text-xs"
              >
                <Square className="size-3 mr-1" /> Stop & Upload
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Mic className="size-6 mx-auto text-rose-400" />
              <p className="text-xs text-slate-600 font-medium">Record a voice note explaining the bug</p>
              <p className="text-[10px] text-slate-400">Max ~2 minutes · Browser will request microphone access</p>
              <Button
                size="sm"
                onClick={startRecording}
                className="h-7 text-xs bg-rose-600 hover:bg-rose-700"
              >
                <Mic className="size-3 mr-1" /> Start Recording
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Existing attachments */}
      {loading ? (
        <p className="text-[10px] text-slate-400 mt-2">Loading attachments…</p>
      ) : attachments.length === 0 ? (
        <p className="text-[10px] text-slate-400 mt-2 italic">No attachments yet</p>
      ) : (
        <div className="space-y-2 mt-2">
          {/* Images */}
          {images.length > 0 && (
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-semibold mb-1">Screenshots ({images.length})</p>
              <div className="flex gap-2 flex-wrap">
                {images.map((a) => (
                  <div key={a.id} className="relative group">
                    <img
                      src={`/api/attachments/${a.id}`}
                      alt={a.fileName}
                      className="size-16 object-cover rounded border border-slate-200 cursor-pointer hover:border-emerald-400"
                      onClick={() => openPreview(a)}
                    />
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-semibold mb-1">Screen Recordings ({videos.length})</p>
              <div className="space-y-1">
                {videos.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 p-1.5 rounded border border-slate-100 hover:bg-slate-50">
                    <Video className="size-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-700 truncate flex-1">{a.fileName}</span>
                    <span className="text-[10px] text-slate-400">{formatSize(a.fileSize)}</span>
                    <button
                      onClick={() => openPreview(a)}
                      className="text-emerald-600 hover:text-emerald-700 text-[10px] font-medium"
                    >
                      <PlayCircle className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio */}
          {audios.length > 0 && (
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-semibold mb-1">Voice Notes ({audios.length})</p>
              <div className="space-y-1">
                {audios.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 p-1.5 rounded border border-slate-100 hover:bg-slate-50">
                    <Mic className="size-3.5 text-rose-400 shrink-0" />
                    <span className="text-[11px] text-slate-700 truncate flex-1">{a.fileName}</span>
                    <span className="text-[10px] text-slate-400">{formatSize(a.fileSize)}</span>
                    <button
                      onClick={() => openPreview(a)}
                      className="text-emerald-600 hover:text-emerald-700 text-[10px] font-medium"
                    >
                      <PlayCircle className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && previewAttachment && (
        <Dialog open onOpenChange={() => { setPreviewUrl(null); setPreviewAttachment(null); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-sm flex items-center justify-between">
                <span>{previewAttachment.fileName}</span>
                <span className="text-[10px] text-slate-400">{formatSize(previewAttachment.fileSize)} · {previewAttachment.uploadedBy}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden" style={{ maxHeight: "70vh" }}>
              {previewAttachment.fileType === "image" && (
                <img src={previewUrl} alt={previewAttachment.fileName} className="max-w-full max-h-[70vh] object-contain" />
              )}
              {previewAttachment.fileType === "video" && (
                <video src={previewUrl} controls className="max-w-full max-h-[70vh]" />
              )}
              {previewAttachment.fileType === "audio" && (
                <div className="p-8 w-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-16 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                      <Mic className="size-7 text-white" />
                    </div>
                    <audio src={previewUrl} controls className="w-full" />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
