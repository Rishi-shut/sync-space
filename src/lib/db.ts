import { PrismaClient } from "@/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Dynamic client recreation: if the cached Prisma client is stale (lacks the new 'friendship' model), reset it
if (globalForPrisma.prisma && !("friendship" in (globalForPrisma.prisma as any))) {
  console.log("[PRISMA] Friendship model missing in cached client. Re-initializing database client...");
  globalForPrisma.prisma = undefined;
}

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
