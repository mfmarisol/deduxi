import { pgTable, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { taxpayers } from "./taxpayers.js";

export const sessions = pgTable("sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taxpayerId: integer("taxpayer_id").notNull().references(() => taxpayers.id, { onDelete: "cascade" }),
  storageState: jsonb("storage_state"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
