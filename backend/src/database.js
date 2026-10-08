const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(path.join(dataDir, 'recipe-manager.db'));

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });

const getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });

const allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });

async function initDb() {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      instructions TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

async function upsertUser(phone) {
  const existingUser = await getAsync('SELECT * FROM users WHERE phone = ?', [phone]);

  if (existingUser) {
    return existingUser;
  }

  const result = await runAsync('INSERT INTO users (phone) VALUES (?)', [phone]);
  return { id: result.id, phone };
}

async function saveOtp(phone, code, expiresAt) {
  await runAsync('INSERT INTO otps (phone, code, expires_at) VALUES (?, ?, ?)', [phone, code, expiresAt]);
}

async function getLatestOtp(phone) {
  return getAsync('SELECT * FROM otps WHERE phone = ? ORDER BY created_at DESC LIMIT 1', [phone]);
}

async function deleteOtps(phone) {
  await runAsync('DELETE FROM otps WHERE phone = ?', [phone]);
}

async function listRecipesByUser(userId) {
  return allAsync(
    'SELECT * FROM recipes WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

async function createRecipe({ userId, title, ingredients, instructions }) {
  const result = await runAsync(
    'INSERT INTO recipes (user_id, title, ingredients, instructions) VALUES (?, ?, ?, ?)',
    [userId, title, ingredients, instructions]
  );

  return {
    id: result.id,
    user_id: userId,
    title,
    ingredients,
    instructions,
    created_at: new Date().toISOString(),
  };
}

async function deleteRecipe({ userId, recipeId }) {
  const result = await runAsync('DELETE FROM recipes WHERE id = ? AND user_id = ?', [recipeId, userId]);
  return result.changes > 0;
}

module.exports = {
  db,
  initDb,
  upsertUser,
  saveOtp,
  getLatestOtp,
  deleteOtps,
  listRecipesByUser,
  createRecipe,
  deleteRecipe,
};
