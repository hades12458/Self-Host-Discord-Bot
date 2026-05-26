/**
 * database/DatabaseManager.js
 * Gestionnaire central SQLite - singleton
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = path.join(process.cwd(), 'data', 'bot.db');
  }

  /**
   * Initialise la base de données et crée les tables
   */
  init() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this._createTables();
    console.log('[DB] Base de données initialisée');
    return this;
  }

  _createTables() {
    this.db.exec(`
      -- Blacklist globale inter-serveur
      CREATE TABLE IF NOT EXISTS blacklist (
        user_id   TEXT PRIMARY KEY,
        reason    TEXT NOT NULL,
        added_by  TEXT NOT NULL,
        added_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
      );

      -- Paramètres par serveur
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id        TEXT PRIMARY KEY,
        log_channel_id  TEXT,
        prefix          TEXT DEFAULT '!',
        updated_at      INTEGER NOT NULL DEFAULT (strftime('%s','now'))
      );

      -- Backups serveur
      CREATE TABLE IF NOT EXISTS guild_backups (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id    TEXT NOT NULL,
        created_by  TEXT NOT NULL,
        created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        data        TEXT NOT NULL
      );

      -- Logs des actions
      CREATE TABLE IF NOT EXISTS action_logs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id    TEXT NOT NULL,
        action      TEXT NOT NULL,
        executor_id TEXT NOT NULL,
        target_id   TEXT,
        reason      TEXT,
        metadata    TEXT,
        created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
      );

      -- Rate limits
      CREATE TABLE IF NOT EXISTS rate_limits (
        key         TEXT NOT NULL,
        action      TEXT NOT NULL,
        timestamp   INTEGER NOT NULL,
        PRIMARY KEY (key, action, timestamp)
      );
    `);
  }

  // ---- Blacklist ----

  addBlacklist(userId, reason, addedBy) {
    const stmt = this.db.prepare(`
      INSERT INTO blacklist (user_id, reason, added_by)
      VALUES (?, ?, ?)
    `);
    return stmt.run(userId, reason, addedBy);
  }

  removeBlacklist(userId) {
    return this.db.prepare('DELETE FROM blacklist WHERE user_id = ?').run(userId);
  }

  isBlacklisted(userId) {
    return !!this.db.prepare('SELECT 1 FROM blacklist WHERE user_id = ?').get(userId);
  }

  getBlacklistEntry(userId) {
    return this.db.prepare('SELECT * FROM blacklist WHERE user_id = ?').get(userId);
  }

  getAllBlacklist() {
    return this.db.prepare('SELECT * FROM blacklist ORDER BY added_at DESC').all();
  }

  // ---- Guild Settings ----

  getGuildSettings(guildId) {
    return this.db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId)
      || { guild_id: guildId, log_channel_id: null, prefix: '!' };
  }

  setLogChannel(guildId, channelId) {
    return this.db.prepare(`
      INSERT INTO guild_settings (guild_id, log_channel_id) VALUES (?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET log_channel_id = excluded.log_channel_id, updated_at = strftime('%s','now')
    `).run(guildId, channelId);
  }

  setPrefix(guildId, prefix) {
    return this.db.prepare(`
      INSERT INTO guild_settings (guild_id, prefix) VALUES (?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET prefix = excluded.prefix, updated_at = strftime('%s','now')
    `).run(guildId, prefix);
  }

  // ---- Backups ----

  saveBackup(guildId, createdBy, data) {
    return this.db.prepare(`
      INSERT INTO guild_backups (guild_id, created_by, data) VALUES (?, ?, ?)
    `).run(guildId, createdBy, JSON.stringify(data));
  }

  getLatestBackup(guildId) {
    const row = this.db.prepare(`
      SELECT * FROM guild_backups WHERE guild_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(guildId);
    if (row) row.data = JSON.parse(row.data);
    return row;
  }

  // ---- Logs ----

  logAction({ guildId, action, executorId, targetId = null, reason = null, metadata = null }) {
    return this.db.prepare(`
      INSERT INTO action_logs (guild_id, action, executor_id, target_id, reason, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(guildId, action, executorId, targetId, reason, metadata ? JSON.stringify(metadata) : null);
  }

  // ---- Rate Limit ----

  checkRateLimit(key, action, windowMs, maxCalls) {
    const since = Date.now() - windowMs;
    // Nettoyage des anciens enregistrements
    this.db.prepare('DELETE FROM rate_limits WHERE timestamp < ?').run(since);

    const count = this.db.prepare(
      'SELECT COUNT(*) as c FROM rate_limits WHERE key = ? AND action = ? AND timestamp > ?'
    ).get(key, action, since).c;

    if (count >= maxCalls) return false;

    this.db.prepare('INSERT INTO rate_limits (key, action, timestamp) VALUES (?, ?, ?)').run(key, action, Date.now());
    return true;
  }
}

// Singleton
const instance = new DatabaseManager();
module.exports = instance;
