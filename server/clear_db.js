import Database from 'better-sqlite3';

const db = new Database('local.db');

const tables = [
  'machine_logs',
  'machine_advances',
  'transactions',
  'batches',
  'lots',
  'farmer_advances',
  'lot_rates',
  'farmer_settlement_status',
  'mill_payments',
  'mills',
  'machines',
  'commission_rates'
];

console.log('Clearing database records...');

db.exec('PRAGMA foreign_keys = OFF');

db.transaction(() => {
  for (const table of tables) {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
      // Optional: Reset autoincrement
      db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
      console.log(`Cleared table: ${table}`);
    } catch (err) {
      console.error(`Error clearing table ${table}:`, err.message);
    }
  }
})();

console.log('Database cleared successfully.');
db.exec('PRAGMA foreign_keys = ON');
db.close();
