import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type Role = "admin" | "lead" | "tester" | "developer";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  testerId?: string | null;
}

/**
 * Get the current authenticated session user, or null.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/**
 * Require authentication. Returns the user or throws 401.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Require admin role. Returns the user or throws 403.
 * Admins can: create/edit/delete test cases, manage users, view audit logs,
 * manage milestones, assign test cases, assign bugs.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "admin" && user.role !== "lead") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Check if a user has admin-level permissions (admin or lead).
 */
export function isAdmin(user: SessionUser | null | undefined): boolean {
  return user?.role === "admin" || user?.role === "lead";
}

/**
 * Check if a user can perform write operations on test cases (admin/lead only).
 */
export function canManageTestCases(user: SessionUser | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if a user can view the audit log (admin only).
 */
export function canViewAuditLog(user: SessionUser | null | undefined): boolean {
  return user?.role === "admin";
}

/**
 * Check if a user can manage users (admin only).
 */
export function canManageUsers(user: SessionUser | null | undefined): boolean {
  return user?.role === "admin";
}

/**
 * Check if a user can assign bugs to developers (admin/lead only).
 */
export function canAssignBugs(user: SessionUser | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if a user can update a specific bug's status.
 * - Admin/lead: can update any bug
 * - Developer: can update bugs assigned to them
 * - Tester: can only update bugs they reported (limited)
 */
export function canUpdateBug(
  user: SessionUser | null | undefined,
  bug: { assigneeId?: string | null; reporterId?: string | null }
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (user.role === "developer" && bug.assigneeId === user.testerId) return true;
  // Testers cannot update bug status (only admin/assignee can)
  return false;
}

/**
 * Check if a user is a developer (can fix bugs assigned to them).
 */
export function isDeveloper(user: SessionUser | null | undefined): boolean {
  return user?.role === "developer";
}

/**
 * Get the list of nav items this role should see.
 */
export function getVisibleNavItems(role: string | undefined): string[] {
  const base = ["dashboard", "test_cases", "bugs", "reports"];
  if (role === "admin") {
    return [...base, "testers", "audit", "requirements", "modules"];
  }
  if (role === "lead") {
    return [...base, "testers", "requirements", "modules"];
  }
  if (role === "developer") {
    return [...base, "my_bugs"];
  }
  // tester
  return [...base, "testers", "requirements", "modules"];
}
