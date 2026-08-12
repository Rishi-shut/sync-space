import { PrismaClient } from "@/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

import { cache } from "react";
import { auth } from "@clerk/nextjs/server";

export const getSessionUser = cache(async () => {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    return await db.user.findUnique({
      where: { clerkId: userId },
    });
  } catch (err) {
    console.error("Error in getSessionUser:", err);
    return null;
  }
});
