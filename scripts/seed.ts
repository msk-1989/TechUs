import { db } from "../src/lib/db";
import { SEED_MODULES } from "../src/lib/seed-data";

async function main() {
  console.log("Seeding database...");

  // Wipe existing data
  await db.testExecution.deleteMany();
  await db.bug.deleteMany();
  await db.testCase.deleteMany();
  await db.testSuite.deleteMany();
  await db.module.deleteMany();

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
