// Email notification service — uses Resend if RESEND_API_KEY is set,
// otherwise silently falls back to in-app-only notifications.

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const isEmailEnabled = !!process.env.RESEND_API_KEY;

/**
 * Send an email via Resend. If no API key is set, silently no-ops.
 * Always returns { ok: true } so callers don't crash.
 */
export async function sendEmail(params: EmailParams): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const { to, subject, html, text } = params;

  if (!isEmailEnabled) {
    // No email service configured — skip silently
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "TechUs QA <noreply@techus.app>",
        to: [to],
        subject,
        html,
        text: text || subject,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Email send failed:", err);
      return { ok: false, error: err };
    }

    return { ok: true };
  } catch (e: any) {
    console.error("Email send error:", e.message);
    return { ok: false, error: e.message };
  }
}

// ---- Email Templates ----

export function emailTemplate_BugAssigned(bug: { title: string; severity: string; moduleName?: string | null; stepsToRepro?: string | null }) {
  return {
    subject: `[TechUs] Bug assigned to you: ${bug.title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #10b981, #0d9488); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">TechUs QA</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Bug assigned to you</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 18px;">${bug.title}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px; width: 100px;">Severity:</td><td style="padding: 6px 0; color: #1e293b; font-size: 13px; font-weight: 600;">${bug.severity.toUpperCase()}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b; font-size: 13px;">Module:</td><td style="padding: 6px 0; color: #1e293b; font-size: 13px;">${bug.moduleName || "—"}</td></tr>
          </table>
          ${bug.stepsToRepro ? `<div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 16px;"><p style="color: #64748b; font-size: 11px; text-transform: uppercase; margin: 0 0 8px;">Steps to Reproduce</p><pre style="color: #334155; font-size: 13px; white-space: pre-wrap; margin: 0;">${bug.stepsToRepro}</pre></div>` : ""}
          <a href="${process.env.NEXTAUTH_URL || 'https://tech-us-seven.vercel.app'}" style="display: inline-block; background: #10b981; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View Bug</a>
        </div>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">You received this email because a bug was assigned to you in TechUs QA.</p>
      </div>
    `,
    text: `Bug assigned: ${bug.title} (Severity: ${bug.severity})\n\nView at ${process.env.NEXTAUTH_URL || 'https://tech-us-seven.vercel.app'}`,
  };
}

export function emailTemplate_BugFixed(bug: { title: string }, fixerName: string, resolutionNotes?: string) {
  return {
    subject: `[TechUs] Bug marked as fixed: ${bug.title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #10b981, #0d9488); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Bug Fixed</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Please verify and close</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin: 0 0 12px; font-size: 18px;">${bug.title}</h2>
          <p style="color: #475569; font-size: 14px; margin: 0 0 12px;">${fixerName} marked this bug as fixed.</p>
          ${resolutionNotes ? `<div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 16px;"><p style="color: #64748b; font-size: 11px; text-transform: uppercase; margin: 0 0 8px;">Resolution Notes</p><p style="color: #334155; font-size: 13px; margin: 0; white-space: pre-wrap;">${resolutionNotes}</p></div>` : ""}
          <a href="${process.env.NEXTAUTH_URL || 'https://tech-us-seven.vercel.app'}" style="display: inline-block; background: #10b981; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">Verify Bug</a>
        </div>
      </div>
    `,
    text: `Bug fixed: ${bug.title}\n${fixerName} marked this as fixed.\n${resolutionNotes || ""}\n\nVerify at ${process.env.NEXTAUTH_URL || 'https://tech-us-seven.vercel.app'}`,
  };
}

export function emailTemplate_BugCommented(bug: { title: string }, commenterName: string, commentBody: string) {
  return {
    subject: `[TechUs] New comment on: ${bug.title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">New Comment</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <p style="color: #475569; font-size: 14px;"><strong>${commenterName}</strong> commented on:</p>
          <h2 style="color: #1e293b; margin: 8px 0 12px; font-size: 18px;">${bug.title}</h2>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
            <p style="color: #334155; font-size: 14px; margin: 0; white-space: pre-wrap;">${commentBody}</p>
          </div>
          <a href="${process.env.NEXTAUTH_URL || 'https://tech-us-seven.vercel.app'}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">Reply</a>
        </div>
      </div>
    `,
    text: `${commenterName} commented on "${bug.title}":\n\n${commentBody}\n\nReply at ${process.env.NEXTAUTH_URL || 'https://tech-us-seven.vercel.app'}`,
  };
}

export function emailTemplate_TestAssigned(testCase: { title: string }, assignerName: string) {
  return {
    subject: `[TechUs] Test case assigned to you: ${testCase.title}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #10b981, #0d9488); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Test Case Assigned</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <p style="color: #475569; font-size: 14px;"><strong>${assignerName}</strong> assigned you a test case:</p>
          <h2 style="color: #1e293b; margin: 8px 0 16px; font-size: 18px;">${testCase.title}</h2>
          <a href="${process.env.NEXTAUTH_URL || 'https://tech-us-seven.vercel.app'}" style="display: inline-block; background: #10b981; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View Test Case</a>
        </div>
      </div>
    `,
    text: `${assignerName} assigned you a test case: ${testCase.title}\n\nView at ${process.env.NEXTAUTH_URL || 'https://tech-us-seven.vercel.app'}`,
  };
}
