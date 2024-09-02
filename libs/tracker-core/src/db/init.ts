import { Database } from "sqlite3";
import { initTables } from "@slippiops/sqllite";
import { columnDefs } from "./columnDefs";

export async function initDb(pathToDb: string) : Promise<Database> {
  const db = new Database(pathToDb);
  await initTables(db, columnDefs);
  return db;
}