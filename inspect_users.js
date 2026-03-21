import Database from 'better-sqlite3';

const db = new Database('local.db');

try {
  const users = db.prepare('SELECT id, name, mobile, role, password FROM users').all();
  console.log('All Users:');
  console.table(users);
} catch (error) {
  console.error("Error inspecting users table:", error);
}
