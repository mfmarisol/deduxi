import { pgTable, integer, varchar, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { taxpayers } from "./taxpayers.js";
import { jobs } from "./jobs.js";

export const deductions = pgTable("deductions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taxpayerId: integer("taxpayer_id").notNull().references(() => taxpayers.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),
  tipoDeduccion: varchar("tipo_deduccion", { length: 100 }),
  cuitPrestador: varchar("cuit_prestador", { length: 13 }),
  descripcion: text(),
  monto: numeric({ precision: 12, scale: 2 }),
  periodo: varchar({ length: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
