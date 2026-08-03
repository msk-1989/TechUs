import { db } from "../src/lib/db";
import { SEED_MODULES } from "../src/lib/seed-data";
import bcrypt from "bcryptjs";

const SEED_TESTERS = [
  { name: "Aarav Sharma",  email: "aarav.s@hidayah.test",  role: "lead",    color: "emerald" },
  { name: "Priya Nair",    email: "priya.n@hidayah.test",  role: "tester",  color: "violet" },
  { name: "Imran Khan",    email: "imran.k@hidayah.test",  role: "tester",  color: "amber" },
  { name: "Sarah Joseph",  email: "sarah.j@teachus.test",  role: "tester",  color: "sky" },
  { name: "Bilal Ahmed",   email: "bilal.a@teachus.test",  role: "tester",  color: "rose" },
];

async function main() {
  console.log("→ Seeding Neon PostgreSQL (this may take 2-3 minutes)...");

  // Wipe in dependency order
  console.log("→ Cleaning existing data...");
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.testExecution.deleteMany();
  await db.testRun.deleteMany();
  await db.bug.deleteMany();
  await db.testCase.deleteMany();
  await db.testSuite.deleteMany();
  await db.module.deleteMany();
  await db.tester.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verificationToken.deleteMany();
  await db.user.deleteMany();
  await db.milestone.deleteMany();
  console.log("✓ Cleaned");

  // Admin user
  console.log("→ Creating admin user...");
  const adminPassword = await bcrypt.hash("admin123", 12);
  const adminUser = await db.user.create({
    data: {
      name: "TechUs Admin",
      email: "admin@techus.app",
      passwordHash: adminPassword,
      role: "admin",
      emailVerified: new Date(),
      tester: {
        create: { name: "TechUs Admin", email: "admin@techus.app", role: "admin", color: "emerald" },
      },
    },
  });
  console.log("✓ Admin: admin@techus.app / admin123");

  // Demo testers with login
  console.log("→ Creating demo tester accounts...");
  for (const t of SEED_TESTERS) {
    const password = await bcrypt.hash("tester123", 12);
    await db.user.create({
      data: {
        name: t.name,
        email: t.email,
        passwordHash: password,
        role: t.role,
        emailVerified: new Date(),
        tester: { create: { name: t.name, email: t.email, role: t.role, color: t.color } },
      },
    });
  }
  console.log(`✓ ${SEED_TESTERS.length} testers created (password: tester123)`);

  // Milestone
  console.log("→ Creating milestone...");
  const milestone = await db.milestone.create({
    data: {
      name: "MVP Launch Readiness",
      description: "All critical-path test cases must pass before public launch.",
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "active",
    },
  });
  console.log("✓ Milestone created");

  // Modules + suites + test cases
  console.log("→ Seeding modules and test cases...");
  let moduleCount = 0;
  let suiteCount = 0;
  let testCount = 0;
  for (const mod of SEED_MODULES) {
    const createdModule = await db.module.create({
      data: {
        key: mod.key,
        name: mod.name,
        description: mod.description,
        icon: mod.icon,
        order: mod.order,
      },
    });
    moduleCount++;

    for (let i = 0; i < mod.suites.length; i++) {
      const suite = mod.suites[i];
      const createdSuite = await db.testSuite.create({
        data: {
          moduleId: createdModule.id,
          name: suite.name,
          description: suite.description,
          order: i,
        },
      });
      suiteCount++;

      // Batch create test cases for this suite
      await db.testCase.createMany({
        data: suite.testCases.map((tc) => ({
          suiteId: createdSuite.id,
          title: tc.title,
          description: tc.description ?? null,
          steps: tc.steps ?? null,
          expected: tc.expected ?? null,
          status: "not_run" as const,
          priority: tc.priority ?? "medium",
          category: tc.category ?? "functional",
          decisionNeeded: tc.decisionNeeded ?? false,
          specReference: tc.specReference ?? null,
          milestoneId: milestone.id,
        })),
      });
      testCount += suite.testCases.length;
    }
    console.log(`  ✓ ${mod.name} — ${mod.suites.length} suites`);
  }

  // Audit the seed itself
  await db.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "system.seed",
      entityType: "System",
      details: `Database seeded: ${moduleCount} modules, ${suiteCount} suites, ${testCount} test cases`,
    },
  });

  console.log("\n========================================");
  console.log("✅ SEED COMPLETE");
  console.log("========================================");
  console.log(`  Modules:    ${moduleCount}`);
  console.log(`  Suites:     ${suiteCount}`);
  console.log(`  Test cases: ${testCount}`);
  console.log(`  Users:      ${1 + SEED_TESTERS.length} (1 admin + ${SEED_TESTERS.length} testers)`);
  console.log(`  Milestones: 1`);
  console.log("");
  console.log("  Admin login:  admin@techus.app / admin123");
  console.log("  Tester login: priya.n@hidayah.test / tester123");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("✗ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
