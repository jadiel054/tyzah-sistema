import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  lastService: text("last_service"),
  lastVisitAt: timestamp("last_visit_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  durationMin: integer("duration_min").notNull().default(30),
  priceCents: integer("price_cents").notNull().default(0),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  serviceName: text("service_name").notNull(),
  serviceDurationMin: integer("service_duration_min").notNull().default(30),
  priceCents: integer("price_cents").notNull().default(0),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status").notNull().default("confirmed"),
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  confirmationSent: boolean("confirmation_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blockedSlots = pgTable("blocked_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Service = typeof services.$inferSelect;
export type BlockedSlot = typeof blockedSlots.$inferSelect;
