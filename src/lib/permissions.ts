import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type Role = "admin" | "lead" | "tester";

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
 * manage milestones, assign test cases.
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
