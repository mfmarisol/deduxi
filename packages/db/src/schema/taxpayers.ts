import { pgTable, integer, varchar, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const taxpayers = pgTable(
  "taxpayers",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    cuit: varchar({ length: 13 }).notNull(),
    encryptedClaveFiscal: text("encrypted_clave_fiscal").notNull(),
    iv: text().notNull(),
    authTag: text("auth_tag").notNull(),
    name: varchar({ length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.cuit)],
);
