// Shared types and helpers for the Testing Reporting System

export type TestStatus = "not_run" | "pass" | "fail" | "blocked" | "skipped";
export type Priority = "low" | "medium" | "high" | "critical";
export type Category = "functional" | "ui" | "integration" | "security" | "payment";
export type BugSeverity = "minor" | "major" | "critical" | "blocker";
export type BugStatus = "open" | "in_progress" | "fixed" | "verified" | "wont_fix";

export interface ModuleStat {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  skipped: number;
  notRun: number;
  passRate: number;
  coverage: number;
}

export interface TestCase {
  id: string;
  title: string;
  description: string | null;
  steps: string | null;
  expected: string | null;
  status: TestStatus;
  priority: Priority;
  category: Category;
  testerName: string | null;
  notes: string | null;
  lastRunAt: string | null;
  suite: {
    id: string;
    name: string;
    module: {
      id: string;
      key: string;
      name: string;
    };
  };
  bugs: Bug[];
  executions: {
    id: string;
    status: string;
    notes: string | null;
    executedBy: string | null;
    executedAt: string;
    tester?: { id: string; name: string; color: string } | null;
  }[];
}

export interface Bug {
  id: string;
  title: string;
  description: string | null;
  severity: BugSeverity;
  priority: Priority;
  status: BugStatus;
  moduleName: string | null;
  reporter: string | null;
  reporterId: string | null;
  assignee: string | null;
  assigneeId: string | null;
  stepsToRepro: string | null;
  expected: string | null;
  actual: string | null;
  testCaseId: string | null;
  createdAt: string;
  updatedAt: string;
  testCase?: {
    id: string;
    title: string;
    suite: {
      module: { name: string };
    };
  } | null;
  reporterRef?: { id: string; name: string; color: string } | null;
  assigneeRef?: { id: string; name: string; color: string } | null;
}

export interface TesterStat {
  id: string;
  name: string;
  email?: string | null;
  role: string;
  color: string;
  active: boolean;
  stats: {
    totalExecutions: number;
    pass: number;
    fail: number;
    blocked: number;
    skipped: number;
    passRate: number;
    bugsReported: number;
    bugsAssigned: number;
    modulesTouched: number;
    lastActive: string | null;
  };
  recentExecutions: {
    id: string;
    status: string;
    notes: string | null;
    executedAt: string;
    testCase: { id: string; title: string; module: string };
  }[];
  recentBugs: {
    id: string;
    title: string;
    severity: string;
    status: string;
    createdAt: string;
  }[];
}

export const STATUS_META: Record<TestStatus, { label: string; color: string; bg: string; text: string; dot: string }> = {
  not_run: { label: "Not Run", color: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  pass: { label: "Pass", color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  fail: { label: "Fail", color: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  blocked: { label: "Blocked", color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  skipped: { label: "Skipped", color: "bg-sky-500", bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string; text: string }> = {
  critical: { label: "Critical", color: "bg-rose-600", bg: "bg-rose-50", text: "text-rose-700" },
  high: { label: "High", color: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
  medium: { label: "Medium", color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  low: { label: "Low", color: "bg-slate-400", bg: "bg-slate-50", text: "text-slate-600" },
};

export const CATEGORY_META: Record<Category, { label: string; color: string; bg: string; text: string }> = {
  functional: { label: "Functional", color: "bg-teal-500", bg: "bg-teal-50", text: "text-teal-700" },
  ui: { label: "UI", color: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700" },
  integration: { label: "Integration", color: "bg-cyan-500", bg: "bg-cyan-50", text: "text-cyan-700" },
  security: { label: "Security", color: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700" },
  payment: { label: "Payment", color: "bg-emerald-600", bg: "bg-emerald-50", text: "text-emerald-700" },
};

export const BUG_SEVERITY_META: Record<BugSeverity, { label: string; color: string; bg: string; text: string }> = {
  blocker: { label: "Blocker", color: "bg-rose-700", bg: "bg-rose-100", text: "text-rose-800" },
  critical: { label: "Critical", color: "bg-rose-600", bg: "bg-rose-50", text: "text-rose-700" },
  major: { label: "Major", color: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
  minor: { label: "Minor", color: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
};

export const BUG_STATUS_META: Record<BugStatus, { label: string; color: string; bg: string; text: string }> = {
  open: { label: "Open", color: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700" },
  in_progress: { label: "In Progress", color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  fixed: { label: "Fixed", color: "bg-sky-500", bg: "bg-sky-50", text: "text-sky-700" },
  verified: { label: "Verified", color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  wont_fix: { label: "Won't Fix", color: "bg-slate-500", bg: "bg-slate-50", text: "text-slate-600" },
};
