import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    notes: text("notes"),
    photoUrl: text("photo_url"),
    lastService: text("last_service"),
    lastVisitAt: timestamp("last_visit_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("clients_phone_idx").on(table.phone),
    index("clients_name_idx").on(table.name),
  ]
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    durationMin: integer("duration_min").notNull().default(30),
    priceCents: integer("price_cents").notNull().default(0),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("services_name_idx").on(table.name),
    index("services_active_sort_idx").on(table.active, table.sortOrder),
  ]
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    clientName: text("client_name").notNull(),
    clientPhone: text("client_phone").notNull(),
    serviceName: text("service_name").notNull(),
    serviceDurationMin: integer("service_duration_min").notNull().default(30),
    priceCents: integer("price_cents").notNull().default(0),
    date: date("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    status: text("status").notNull().default("confirmed"), // confirmed | done | cancelled | no_show
    notes: text("notes"),
    reminderSent: boolean("reminder_sent").notNull().default(false),
    confirmationSent: boolean("confirmation_sent").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("appointments_date_status_idx").on(table.date, table.status),
    index("appointments_client_id_idx").on(table.clientId),
    index("appointments_client_phone_idx").on(table.clientPhone),
  ]
);

export const blockedSlots = pgTable(
  "blocked_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: date("date").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("blocked_slots_date_idx").on(table.date),
  ]
);

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    serviceName: text("service_name"),
    preferredDate: date("preferred_date"),
    notes: text("notes"),
    status: text("status").notNull().default("waiting"), // waiting | notified | booked | cancelled
    notifiedAt: timestamp("notified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("waitlist_status_idx").on(table.status),
    index("waitlist_preferred_date_idx").on(table.preferredDate),
  ]
);

export type Client = typeof clients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Service = typeof services.$inferSelect;
export type BlockedSlot = typeof blockedSlots.$inferSelect;
export type WaitlistEntry = typeof waitlist.$inferSelect;
