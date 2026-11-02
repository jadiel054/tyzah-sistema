import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { services } from "./schema";
import { DEFAULT_SERVICES } from "../services";

/**
 * Ensures that DEFAULT_SERVICES are populated in the database `services` table.
 * Idempotent: Does not overwrite customized active/price if service exists, but inserts missing ones.
 */
export async function syncServices(): Promise<void> {
  const db = getDb();
  const existing = await db.select().from(services);
  const existingNames = new Set(existing.map((s) => s.name));

  for (const item of DEFAULT_SERVICES) {
    if (!existingNames.has(item.name)) {
      await db.insert(services).values({
        name: item.name,
        durationMin: item.durationMin,
        priceCents: item.priceCents,
        sortOrder: item.sortOrder,
        active: true,
      });
    }
  }
}

/**
 * Fetches all active services from the database with fallback to DEFAULT_SERVICES if database has none.
 */
export async function getActiveServices() {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(services)
      .where(eq(services.active, true))
      .orderBy(services.sortOrder);

    if (rows.length > 0) {
      return rows;
    }
  } catch (err) {
    console.warn("Could not query services table, falling back to DEFAULT_SERVICES:", err);
  }

  return DEFAULT_SERVICES.map((s, idx) => ({
    id: `default-${idx}`,
    name: s.name,
    durationMin: s.durationMin,
    priceCents: s.priceCents,
    active: true,
    sortOrder: s.sortOrder,
  }));
}
