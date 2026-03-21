import Database from 'better-sqlite3';
const db = new Database('c:/Users/syamk/OneDrive/Desktop/GoogleAIStudio/paddymanager-load-encounter/local.db');

console.log('Lot Rates Table Contents:');
const rates = db.prepare('SELECT * FROM lot_rates LIMIT 10').all();
console.log(rates);

console.log('Checking for any lot with id like SB-2026-002');
const suspicious = db.prepare("SELECT id FROM lots WHERE id LIKE '%SB-2026-002%'").all();
console.log(suspicious);
