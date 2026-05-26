/**
 * services/LoggerService.js
 * Service de logs - channel Discord + console
 */

const db = require('../database/DatabaseManager');
const { logEmbed } = require('../utils/embedBuilder');

class LoggerService {
  /**
   * Envoie un log dans le channel configuré du serveur
   * @param {Guild} guild
   * @param {object} logData
   */
  async sendLog(guild, { action, executor, target = null, reason = null, extra = {} }) {
    const settings = db.getGuildSettings(guild.id);
    const channelId = settings.log_channel_id || process.env.GLOBAL_LOG_CHANNEL_ID;

    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const embed = logEmbed(
      action,
      executor ? `${executor.tag || executor} (${executor.id || executor})` : 'Système',
      target ? `${target.tag || target} (${target.id || target})` : null,
      reason,
      extra
    );

    await channel.send({ embeds: [embed] }).catch(err => {
      console.error(`[LoggerService] Impossible d'envoyer le log: ${err.message}`);
    });

    // Persistance en base
    db.logAction({
      guildId: guild.id,
      action,
      executorId: executor?.id || 'system',
      targetId: target?.id || null,
      reason,
      metadata: Object.keys(extra).length ? extra : null,
    });
  }

  /**
   * Log console structuré
   */
  info(module, message) {
    console.log(`[${new Date().toISOString()}] [${module}] ℹ️  ${message}`);
  }

  warn(module, message) {
    console.warn(`[${new Date().toISOString()}] [${module}] ⚠️  ${message}`);
  }

  error(module, message, err) {
    console.error(`[${new Date().toISOString()}] [${module}] ❌ ${message}`, err || '');
  }
}

module.exports = new LoggerService();
