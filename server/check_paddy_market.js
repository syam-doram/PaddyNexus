import sqlite3 from 'better-sqlite3';
const db = new sqlite3('server/local.db');

try {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='paddy_market'").get();
    if (table) {
        console.log("SUCCESS: paddy_market table exists.");
        const columns = db.prepare("PRAGMA table_info(paddy_market)").all();
        console.log("Columns:", columns.map(c => c.name).join(', '));
    } else {
        console.error("FAILURE: paddy_market table does not exist.");
    }
} catch (err) {
    console.error("Error checking database:", err);
} finally {
    db.close();
}
