import { db } from "../src/lib/db";
import { SEED_MODULES } from "../src/lib/seed-data";

const SEED_TESTERS = [
  { name: "Aarav Sharma",  email: "aarav.s@hidayah.test",  role: "lead",    color: "emerald" },
  { name: "Priya Nair",    email: "priya.n@hidayah.test",  role: "tester",  color: "violet" },
  { name: "Imran Khan",    email: "imran.k@hidayah.test",  role: "tester",  color: "amber" },
  { name: "Sarah Joseph",  email: "sarah.j@teachus.test",  role: "tester",  color: "sky" },
  { name: "Bilal Ahmed",   email: "bilal.a@teachus.test",  role: "tester",  color: "rose" },
];

async function main() {
  console.log("Seeding database...");

  // Wipe existing data (order matters due to foreign keys)
  await db.testExecution.deleteMany();
  await db.bug.deleteMany();
  await db.testCase.deleteMany();
  await db.testSuite.deleteMany();
  await db.module.deleteMany();
  await db.tester.deleteMany();

  // Seed testers
  for (const t of SEED_TESTERS) {
    await db.tester.create({ data: t });
  }
  console.log(`Seeded ${SEED_TESTERS.length} testers`);

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

      for (const tc of suite.testCases) {
        await db.testCase.create({
          data: {
            suiteId: createdSuite.id,
            title: tc.title,
            description: tc.description,
            steps: tc.steps,
            expected: tc.expected,
            status: "not_run",
            priority: tc.priority ?? "medium",
            category: tc.category ?? "functional",
          },
        });
      }
    }

    console.log(`Seeded module: ${mod.name} (${mod.suites.length} suites)`);
  }

  const counts = {
    modules: await db.module.count(),
    suites: await db.testSuite.count(),
    testCases: await db.testCase.count(),
    testers: await db.tester.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
