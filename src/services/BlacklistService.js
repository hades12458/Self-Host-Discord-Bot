/**
 * services/BlacklistService.js
 * Logique métier de la blacklist inter-serveur
 */

const db = require('../database/DatabaseManager');
const logger = require('./LoggerService');

class BlacklistService {
  /**
   * Ajoute un utilisateur à la blacklist
   */
  add(userId, reason, addedById, guild) {
    if (db.isBlacklisted(userId)) {
      return { success: false, reason: 'Cet utilisateur est déjà blacklisté.' };
    }

    db.addBlacklist(userId, reason, addedById);

    logger.sendLog(guild, {
      action: '🚫 Blacklist — Ajout',
      executor: { id: addedById, tag: 'Admin' },
      target: { id: userId, tag: userId },
      reason,
    });

    return { success: true };
  }

  /**
   * Retire un utilisateur de la blacklist
   */
  remove(userId, removedById, guild) {
    if (!db.isBlacklisted(userId)) {
      return { success: false, reason: 'Cet utilisateur n\'est pas blacklisté.' };
    }

    db.removeBlacklist(userId);

    logger.sendLog(guild, {
      action: '✅ Blacklist — Retrait',
      executor: { id: removedById, tag: 'Admin' },
      target: { id: userId, tag: userId },
    });

    return { success: true };
  }

  /**
   * Vérifie et applique la blacklist (appelé à chaque interaction)
   * @returns {boolean} true si bloqué
   */
  async enforceBlacklist(userId, guild, member) {
    if (!db.isBlacklisted(userId)) return false;

    // Si le bot a la permission de bannir, ban automatique
    if (member && guild.members.me?.permissions.has(0x4n)) { // BAN_MEMBERS
      await guild.members.ban(userId, { reason: '[AutoBan] Utilisateur blacklisté.' }).catch(() => {});
      logger.sendLog(guild, {
        action: '🔨 AutoBan — Blacklist',
        executor: { id: 'bot', tag: 'Système' },
        target: { id: userId, tag: userId },
        reason: 'Utilisateur présent dans la blacklist globale',
      });
    }

    return true;
  }

  getInfo(userId) {
    return db.getBlacklistEntry(userId);
  }

  getAll() {
    return db.getAllBlacklist();
  }
}

module.exports = new BlacklistService();
