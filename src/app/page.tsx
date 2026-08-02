"use client";

import { useState, useEffect, useCallback } from "react";
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
  Activity,
  Target,
  PieChart as PieChartIcon,
  FileBarChart,
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
  type TestCase, type Bug, type ModuleStat, type TestStatus, type Priority, type Category, type BugSeverity, type BugStatus,
} from "@/lib/testing-types";

type ViewKey = "dashboard" | "test_cases" | "bugs" | "modules" | "reports";

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "test_cases", label: "Test Cases", icon: ListChecks },
  { key: "bugs", label: "Bug Tracker", icon: BugIcon },
  { key: "modules", label: "Module Reports", icon: BarChart3 },
  { key: "reports", label: "Reports", icon: FileBarChart },
];

const MODULE_ICONS: Record<string, typeof Globe> = {
  Globe, UserPlus, LayoutDashboard, GraduationCap, BookOpen, Shield, LifeBuoy,
};

const STATUS_COLORS_PIE: Record<TestStatus, string> = {
  pass: "#10b981",
  fail: "#f43f5e",
  blocked: "#f59e0b",
  skipped: "#0ea5e9",
  not_run: "#94a3b8",
};

export default function HomePage() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      toast({ title: "Failed to load stats", variant: "destructive" });
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
  }, [refreshStats, refreshTestCases, refreshBugs]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar view={view} onViewChange={setView} stats={stats} />
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
                  loading={loading}
                  onRefresh={refreshTestCases}
                  onUpdateStatus={async (id, status, notes, testerName) => {
                    try {
                      await fetch("/api/test-cases", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, status, notes, testerName, createExecution: true }),
                      });
                      toast({ title: "Test case updated", description: `Status: ${STATUS_META[status].label}` });
                      refreshTestCases();
                      refreshStats();
                    } catch (e) {
                      toast({ title: "Update failed", variant: "destructive" });
                    }
                  }}
                  onReportBug={async (bugData) => {
                    try {
                      await fetch("/api/bugs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(bugData),
                      });
                      toast({ title: "Bug reported", description: bugData.title });
                      refreshBugs();
                      refreshStats();
                    } catch (e) {
                      toast({ title: "Bug creation failed", variant: "destructive" });
                    }
                  }}
                />
              )}
              {view === "bugs" && (
                <BugsView
                  bugs={bugs}
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
                    } catch (e) {
                      toast({ title: "Update failed", variant: "destructive" });
                    }
                  }}
                  onCreateBug={async (bugData) => {
                    try {
                      await fetch("/api/bugs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(bugData),
                      });
                      toast({ title: "Bug created" });
                      refreshBugs();
                      refreshStats();
                    } catch (e) {
                      toast({ title: "Creation failed", variant: "destructive" });
                    }
                  }}
                />
              )}
              {view === "modules" && <ModulesView stats={stats} onNavigate={setView} />}
              {view === "reports" && <ReportsView stats={stats} testCases={testCases} bugs={bugs} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Footer />
      <Toaster />
    </div>
  );
}

/* ---------------- Header ---------------- */
function Header() {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
            <Shield className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              Hidayah Connect <span className="text-emerald-600">×</span> TeachUs
            </h1>
            <p className="text-[11px] text-slate-500 leading-tight">Testing Reporting System</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex border-emerald-200 bg-emerald-50 text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Live
          </Badge>
          <Badge variant="outline" className="hidden md:flex text-slate-600">
            <Calendar className="size-3 mr-1" />
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </Badge>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({
  view, onViewChange, stats,
}: { view: ViewKey; onViewChange: (v: ViewKey) => void; stats: any }) {
  const counts = stats?.summary;
  return (
    <aside className="md:w-60 lg:w-64 border-b md:border-b-0 md:border-r bg-white shrink-0">
      <nav className="flex md:flex-col gap-1 p-3 overflow-x-auto md:overflow-y-auto md:h-[calc(100vh-4rem)] md:sticky md:top-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.key;
          const count =
            item.key === "test_cases" ? counts?.totalTestCases :
            item.key === "bugs" ? counts?.openBugs :
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          title="Total Test Cases"
          value={s.totalTestCases}
          icon={ListChecks}
          accent="slate"
          subtitle="Across 7 modules"
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
      </div>

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
    </div>
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
  testCases, loading, onRefresh, onUpdateStatus, onReportBug,
}: {
  testCases: TestCase[];
  loading: boolean;
  onRefresh: (filters?: Record<string, string>) => void;
  onUpdateStatus: (id: string, status: TestStatus, notes: string, testerName: string) => void;
  onReportBug: (bug: any) => void;
}) {
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
          <p className="text-sm text-slate-500">{testCases.length} cases · click any row to execute</p>
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
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                  <TableHead className="w-[40%]">Test Case</TableHead>
                  <TableHead>Module / Suite</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Bugs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && testCases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                      No test cases match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && testCases.slice(0, 200).map((tc) => (
                  <TableRow
                    key={tc.id}
                    onClick={() => setSelectedTc(tc)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <TableCell>
                      <div className="font-medium text-slate-900 text-sm line-clamp-1">{tc.title}</div>
                      {tc.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{tc.description}</div>
                      )}
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
                ))}
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
          onClose={() => setSelectedTc(null)}
          onUpdateStatus={onUpdateStatus}
          onReportBug={onReportBug}
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
  tc, onClose, onUpdateStatus, onReportBug,
}: {
  tc: TestCase;
  onClose: () => void;
  onUpdateStatus: (id: string, status: TestStatus, notes: string, testerName: string) => void;
  onReportBug: (bug: any) => void;
}) {
  const [status, setStatus] = useState<TestStatus>(tc.status);
  const [notes, setNotes] = useState(tc.notes || "");
  const [testerName, setTesterName] = useState(tc.testerName || "");
  const [showBugForm, setShowBugForm] = useState(false);
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugSeverity, setBugSeverity] = useState<BugSeverity>("major");

  const handleSave = () => {
    onUpdateStatus(tc.id, status, notes, testerName);
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
    });
    setShowBugForm(false);
    setBugTitle("");
    setBugDescription("");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">{tc.suite.module.name}</Badge>
            <Badge variant="outline" className="text-[10px]">{tc.suite.name}</Badge>
            <CategoryBadge category={tc.category} />
            <PriorityBadge priority={tc.priority} />
          </div>
          <DialogTitle className="text-base">{tc.title}</DialogTitle>
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
              <div className="space-y-1 text-xs">
                {tc.executions.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-slate-600">
                    <StatusBadge status={e.status as TestStatus} />
                    <span>{new Date(e.executedAt).toLocaleString()}</span>
                    {e.executedBy && <span className="text-slate-500">· by {e.executedBy}</span>}
                    {e.notes && <span className="text-slate-500">· {e.notes}</span>}
                  </div>
                ))}
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
                <Label className="text-xs">Tester Name (optional)</Label>
                <Input
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1 h-9"
                />
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
  bugs, onRefresh, onUpdateBug, onCreateBug,
}: {
  bugs: Bug[];
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
          <p className="text-sm text-slate-500">{bugs.length} bugs · {bugs.filter((b) => b.status === "open").length} open</p>
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
        {bugs.map((bug) => (
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
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    {bug.moduleName && <span className="flex items-center gap-1"><Globe className="size-3" />{bug.moduleName}</span>}
                    {bug.reporter && <span className="flex items-center gap-1"><User className="size-3" />{bug.reporter}</span>}
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showNewBug && (
        <NewBugDialog
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

function NewBugDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (b: any) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("major");
  const [priority, setPriority] = useState<Priority>("medium");
  const [moduleName, setModuleName] = useState("Landing Page");
  const [reporter, setReporter] = useState("");
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
              <Label className="text-xs">Reporter</Label>
              <Input value={reporter} onChange={(e) => setReporter(e.target.value)} placeholder="Your name" className="mt-1" />
            </div>
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
          <Button disabled={!title} onClick={() => onCreate({ title, description, severity, priority, moduleName, reporter, stepsToRepro: steps, expected, actual })} className="bg-rose-600 hover:bg-rose-700">
            Create bug
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
