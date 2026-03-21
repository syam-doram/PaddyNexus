import Database from 'better-sqlite3';
const dbPath = 'c:/Users/syamk/OneDrive/Desktop/GoogleAIStudio/paddymanager-load-encounter/local.db';
const db = new Database(dbPath);
const tableInfo = db.prepare("PRAGMA table_info(lots)").all();
console.log(JSON.stringify(tableInfo, null, 2));
db.close();
