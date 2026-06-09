/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Prisma client singleton.
 * The actual @prisma/client module is generated at deploy time (after prisma generate).
 * During build, this returns a safe stub that won't be called at static generation.
 */

let _prisma: any;

function getPrisma() {
  if (_prisma) return _prisma;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require("@prisma/client");
    const globalForPrisma = globalThis as any;
    _prisma = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma;
    return _prisma;
  } catch {
    // During build without generated client, return a proxy that throws on use
    return new Proxy({}, {
      get: () => { throw new Error("Prisma client not available (run prisma generate)"); },
    });
  }
}

export const prisma: any = new Proxy({} as any, {
  get: (_target, prop) => {
    const client = getPrisma();
    return typeof client[prop] === "function" ? client[prop].bind(client) : client[prop];
  },
});
