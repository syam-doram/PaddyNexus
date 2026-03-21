import Database from 'better-sqlite3';
const db = new Database('local.db');
const columns = db.prepare("PRAGMA table_info(lots)").all();
console.log('Columns:', columns.map(c => c.name));
const lots = db.prepare("SELECT id, pre_load_scale, weigh_scale_kgs, trader_id FROM lots ORDER BY ROWID DESC LIMIT 5").all();
console.log('Recent Lots:', lots);
