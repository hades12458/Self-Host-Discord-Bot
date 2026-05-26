/**
 * events/guildMemberAdd.js
 * Vérification blacklist + anti-raid basique
 */

const BlacklistService = require('../services/BlacklistService');
const logger = require('../services/LoggerService');
const db = require('../database/DatabaseManager');

// Anti-raid: détection d'afflux massif de membres
const joinTimestamps = new Map(); // guildId => number[]

const RAID_WINDOW_MS = 10_000;
const RAID_THRESHOLD = 10; // 10 joins en 10 secondes = raid détecté

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {
    const { guild, user } = member;

    // --- Vérification blacklist ---
    const isBlocked = await BlacklistService.enforceBlacklist(user.id, guild, member);
    if (isBlocked) return;

    // --- Anti-raid basique ---
    const now = Date.now();
    if (!joinTimestamps.has(guild.id)) joinTimestamps.set(guild.id, []);

    const timestamps = joinTimestamps.get(guild.id);
    timestamps.push(now);

    // Nettoyage des vieux timestamps
    const recent = timestamps.filter(t => now - t < RAID_WINDOW_MS);
    joinTimestamps.set(guild.id, recent);

    if (recent.length >= RAID_THRESHOLD) {
      logger.warn('AntiRaid', `Potentiel raid détecté sur ${guild.name} (${recent.length} joins en ${RAID_WINDOW_MS / 1000}s)`);

      logger.sendLog(guild, {
        action: '🚨 Anti-Raid — Alerte',
        executor: { id: 'system', tag: 'Système' },
        extra: {
          'Joins récents': recent.length,
          'Fenêtre': `${RAID_WINDOW_MS / 1000}s`,
          'Dernier membre': `${user.tag} (${user.id})`,
        },
      });
    }
  },
};
