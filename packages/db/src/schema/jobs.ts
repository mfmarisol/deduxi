import { pgTable, integer, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { taxpayers } from "./taxpayers.js";

export const jobs = pgTable("jobs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taxpayerId: integer("taxpayer_id").notNull().references(() => taxpayers.id, { onDelete: "cascade" }),
  status: varchar({ length: 20 }).notNull().default("pending"),
  type: varchar({ length: 50 }).notNull(),
  payload: jsonb(),
  result: jsonb(),
  error: text(),
  step: varchar({ length: 30 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
