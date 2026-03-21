import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '../local.db'));

try {
  console.log("Starting migrations...");

  // 1. Add machine_cost to lots
  try {
    db.prepare("ALTER TABLE lots ADD COLUMN machine_cost INTEGER DEFAULT 0").run();
    console.log("Added machine_cost to lots table.");
  } catch (err) {
    if (err.message.includes("duplicate column name")) {
      console.log("Column machine_cost already exists in lots table.");
    } else {
      console.error("Error adding column machine_cost:", err.message);
    }
  }

  // 2. Ensure farmer_advances table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmer_advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      lotId TEXT,
      FOREIGN KEY(lotId) REFERENCES lots(id)
    );
  `);
  console.log("Ensured farmer_advances table exists.");

  console.log("Migration completed successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
} finally {
  db.close();
}
