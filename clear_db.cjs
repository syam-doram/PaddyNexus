const Database = require('better-sqlite3');
const db = new Database('local.db');

const tablesToClear = [
  'machines',
  'machine_logs',
  'machine_advances',
  'transactions',
  'batches',
  'lots',
  'farmer_advances',
  'lot_rates',
  'mills',
  'mill_payments',
  'labour_groups',
  'labour_members',
  'operators',
  'paddy_market',
  'farmer_settlement_status',
  'machine_settlement_status',
  'mill_settlement_status'
];

console.log("Starting database cleanup...");

db.transaction(() => {
  for (const table of tablesToClear) {
    try {
      const result = db.prepare(`DELETE FROM ${table}`).run();
      console.log(`- Cleared ${result.changes} records from [${table}]`);
      
      // Reset autoincrement sequences
      db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
    } catch (err) {
      if (err.message.includes("no such table")) {
        console.warn(`- Table [${table}] does not exist, skipping.`);
      } else {
        console.error(`- Error clearing [${table}]:`, err.message);
      }
    }
  }
})();

console.log("\nCleanup complete! Your user accounts and commission settings have been preserved.");
db.close();
