const Database = require('better-sqlite3');
const db = new Database('local.db');
const tableInfo = db.prepare("PRAGMA table_info(lots)").all();
console.log(JSON.stringify(tableInfo, null, 2));
db.close();
