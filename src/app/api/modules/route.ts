import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const modules = await db.module.findMany({
    orderBy: { order: "asc" },
    include: {
      suites: {
        orderBy: { order: "asc" },
        include: {
          testCases: {
            orderBy: { createdAt: "asc" },
            include: { bugs: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ modules });
}
