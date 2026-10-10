/**
 * Prisma 8 ORM singleton.
 *
 * Uses the "emitted" approach: the compiled contract JSON is passed at runtime
 * so the db object is fully typed via the Contract type from contract.d.ts.
 *
 * A global reference is kept in development to survive hot-module reloads
 * without opening a new pg pool on every file change.
 *
 * Temporal polyfill is required before any query: Prisma 8 decodes
 * `DateTime` / timestamptz columns through the global Temporal API, which
 * Node.js 24 and earlier do not ship.
 */
import "temporal-polyfill/full/global";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../prisma/contract";
import contractJson from "../prisma/contract.json";

type Db = ReturnType<typeof postgres<Contract>>;

const globalForDb = globalThis as unknown as { db: Db | undefined };

export const db: Db =
  globalForDb.db ??
  postgres<Contract>({
    contractJson,
    url: process.env.DATABASE_URL!,
  });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
