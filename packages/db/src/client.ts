import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";

export function createDb(url: string) {
  return drizzle(url, { schema });
}

export type Database = ReturnType<typeof createDb>;
