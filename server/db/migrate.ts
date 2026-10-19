import fs from "node:fs";
import { getRepository } from "./repository";

const repo = getRepository();
const appliedMigrations = repo.runMigrations();
const locations = repo.listLocations();
const records = repo.listAdminRecords();
const events = repo.listAdminEvents();
const users = repo.listUsers();

const fieldVerifiedCount = records.filter(
  (r) => r.recordOrigin === "FIELD_VERIFIED"
).length;
const demoCount = records.filter(
  (r) => r.recordOrigin === "DEMO_REFERENCE"
).length;

console.log(
  `[db:migrate] Database initialized via driver '${repo.driverName}' (${repo.dbPath}).`
);
console.log(
  `[db:migrate] Schema migrations: ${appliedMigrations.join(", ")} | Locations: ${locations.length} | Records: ${records.length} (${fieldVerifiedCount} field-verified, ${demoCount} demo-reference) | Events: ${events.length} | Users: ${users.length}`
);

if (repo.migratedFromPortableCount > 0) {
  console.log(
    `[db:migrate] Preserved & migrated ${repo.migratedFromPortableCount} item(s) from legacy portable store into persistent SQLite (backup saved at ${repo.dbPath}.portable.backup.json).`
  );
}

const backupFile = `${repo.dbPath}.bak`;
if (fs.existsSync(backupFile)) {
  console.log(
    `[db:migrate] Pre-migration SQLite backup verified at ${backupFile}.`
  );
}

repo.close();
